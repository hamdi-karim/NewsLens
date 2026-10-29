import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import guardianSearch from "@/test/fixtures/guardian/search.json";
import { renderRoute } from "@/test/render";
import { server } from "@/test/server";

const FIRST_GUARDIAN_TITLE = guardianSearch.response.results[0]?.webTitle ?? "";

function failSource(path: string, status = 500) {
  server.use(http.get(path, () => HttpResponse.json({}, { status })));
}

describe("SearchPage (real adapters + aggregator, MSW at the network edge)", () => {
  it("loads the latest articles on first visit, with no filter applied", async () => {
    const paths: string[] = [];
    server.events.on("request:start", ({ request }) => {
      paths.push(new URL(request.url).pathname);
    });
    renderRoute("/search");

    expect(await screen.findByText(/^\d+ articles$/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Search" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Any time" })).toBeChecked();
    expect(
      screen.queryByRole("button", { name: "Clear all filters" }),
    ).toBeNull();
    // No keyword → NewsAPI uses /top-headlines (overview §4 endpoint rule).
    expect(paths).toContain("/api/newsapi/top-headlines");
    expect(screen.getByText("Newest first")).toBeInTheDocument();
    expect(screen.getAllByText("Top story")).toHaveLength(1);
    server.events.removeAllListeners();
  });

  it("orders keyword results by relevance, interleaving each source's ranking", async () => {
    renderRoute("/search?q=ai");

    expect(await screen.findByText("Most relevant first")).toBeInTheDocument();
    const [first, second, third] = screen.getAllByRole("article");
    // Each source's #1, in registry order; the Guardian's #1 is the featured top story.
    expect(within(first!).getByText("Top story")).toBeInTheDocument();
    expect(within(first!).getByText(FIRST_GUARDIAN_TITLE)).toBeInTheDocument();
    expect(within(second!).getByText("New York Times")).toBeInTheDocument();
    expect(within(third!).getByText(/^NewsAPI · /)).toBeInTheDocument();
  });

  it("merges results from every source for a keyword", async () => {
    renderRoute("/search?q=ai");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Results for “ai”",
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("15 articles")).toBeInTheDocument();
    expect(screen.getAllByText("The Guardian").length).toBeGreaterThan(0);
    expect(screen.getAllByText("New York Times").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^NewsAPI · /).length).toBeGreaterThan(0);
  });

  it("writes filter changes to the URL as new history entries", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/search?q=ai");
    await screen.findByText("15 articles");

    await user.click(screen.getByRole("checkbox", { name: "technology" }));
    expect(router.state.location.search).toBe("?q=ai&categories=technology");
    expect(router.state.historyAction).toBe("PUSH");

    await user.click(screen.getByRole("checkbox", { name: "NewsAPI" }));
    expect(router.state.location.search).toBe(
      "?q=ai&categories=technology&sources=guardian&sources=nyt",
    );

    await user.click(screen.getByRole("radio", { name: "Last 7 days" }));
    expect(router.state.location.search).toMatch(/from=\d{4}-\d{2}-\d{2}/);

    await user.click(screen.getByRole("radio", { name: "Any time" }));
    expect(router.state.location.search).not.toMatch(/from=|to=/);
    expect(screen.getByRole("radio", { name: "Any time" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Today" }));

    await user.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(router.state.location.search).toBe("?q=ai");
  });

  it("refetches with the date range sent server-side when a date preset is picked", async () => {
    const user = userEvent.setup();
    const requests: URL[] = [];
    server.events.on("request:start", ({ request }) => {
      requests.push(new URL(request.url));
    });
    renderRoute("/search");
    await screen.findByText(/^\d+ articles$/);

    await user.click(screen.getByRole("radio", { name: "Last 7 days" }));

    await waitFor(() => {
      const guardian = requests.find(
        (url) =>
          url.pathname === "/api/guardian/search" &&
          url.searchParams.has("from-date"),
      );
      const nyt = requests.find(
        (url) =>
          url.pathname === "/api/nyt/articlesearch.json" &&
          url.searchParams.has("begin_date"),
      );
      expect(guardian?.searchParams.get("to-date")).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
      expect(nyt?.searchParams.get("end_date")).toMatch(/^\d{8}$/);
    });
    server.events.removeAllListeners();
  });

  it("keeps the last selected source checked", async () => {
    renderRoute("/search?q=ai&sources=nyt");

    expect(
      await screen.findByRole("checkbox", { name: "New York Times" }),
    ).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "NewsAPI" })).toBeEnabled();
  });

  it("shows other sources and a notice when one source fails", async () => {
    failSource("/api/nyt/articlesearch.json", 429);
    renderRoute("/search?q=ai");

    expect(
      await screen.findByText("New York Times is unavailable right now."),
    ).toBeInTheDocument();
    expect(screen.getByText("10 articles")).toBeInTheDocument();
  });

  it("explains a skipped source instead of reporting a failure", async () => {
    renderRoute("/search?q=ai&from=2020-01-01&to=2020-01-31");

    expect(
      await screen.findByText("NewsAPI only covers the last 30 days."),
    ).toBeInTheDocument();
  });

  it("shows an error with Retry when every source fails, and recovers", async () => {
    const user = userEvent.setup();
    failSource("/api/guardian/search");
    failSource("/api/nyt/articlesearch.json");
    failSource("/api/newsapi/everything");
    renderRoute("/search?q=ai");

    expect(
      await screen.findByRole("heading", { name: "Couldn't load articles" }),
    ).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("15 articles")).toBeInTheDocument();
  });

  it("shows the empty state with a clear-filters action", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/guardian/search", () =>
        HttpResponse.json({ response: { results: [], pages: 0 } }),
      ),
    );
    const { router } = renderRoute("/search?q=ai&sources=guardian");

    expect(
      await screen.findByText("No articles match your search"),
    ).toBeInTheDocument();

    const emptyState = screen.getByRole("status");
    await user.click(
      within(emptyState).getByRole("button", { name: "Clear all filters" }),
    );
    expect(router.state.location.search).toBe("?q=ai");
  });

  it("loads more results from a source that has more pages", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/guardian/search", ({ request }) => {
        const page = new URL(request.url).searchParams.get("page") ?? "1";
        return HttpResponse.json({
          response: {
            ...guardianSearch.response,
            currentPage: Number(page),
            pages: 2,
            results: guardianSearch.response.results.map((item) => ({
              ...item,
              id: `${item.id}-p${page}`,
              webTitle: `${item.webTitle} (page ${page})`,
              webUrl: `${item.webUrl}-p${page}`,
            })),
          },
        });
      }),
    );
    renderRoute("/search?q=ai&sources=guardian");
    await screen.findByText("5 articles");

    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("10 articles")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `${FIRST_GUARDIAN_TITLE} (page 2) (opens in a new tab)`,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });
});

// jsdom applies no CSS, so the sidebar and the sheet trigger are both rendered; the
// breakpoint switch (hidden / lg:hidden) is checked in the browser.
describe("SearchPage mobile filter sheet", () => {
  it("shows the active filter count on the trigger", async () => {
    renderRoute(
      "/search?q=ai&from=2026-10-01&categories=world&categories=health&sources=nyt",
    );

    expect(
      await screen.findByRole("button", { name: "Filters, 4 active" }),
    ).toBeInTheDocument();
  });

  it("applies filters live and returns focus to the trigger on close", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/search?q=ai");
    await screen.findByText("15 articles");
    const trigger = screen.getByRole("button", { name: "Filters" });

    await user.click(trigger);
    const sheet = screen.getByRole("dialog", { name: "Filters" });
    await user.click(
      within(sheet).getByRole("checkbox", { name: "technology" }),
    );

    expect(router.state.location.search).toBe("?q=ai&categories=technology");

    await user.click(
      within(sheet).getByRole("button", { name: "Show results" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // Radix hides everything outside the open sheet (aria-hidden), so the count is checked after closing.
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAccessibleName("Filters, 1 active");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderRoute("/search");
    await screen.findByText(/^\d+ articles$/);

    await user.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
