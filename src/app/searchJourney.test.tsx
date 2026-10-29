import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderRoute } from "@/test/render";
import { server } from "@/test/server";

function trackRequests() {
  const paths: string[] = [];
  server.events.on("request:start", ({ request }) => {
    paths.push(new URL(request.url).pathname);
  });
  return paths;
}

function articleSources() {
  return screen
    .getAllByRole("article")
    .map(
      (card) =>
        within(card).getByText(/^(The Guardian|New York Times|NewsAPI)/)
          .textContent,
    );
}

// The whole app, header to results: real routes, providers, adapters, and aggregator,
// with MSW at the network edge. Page-level filter behavior lives in SearchPage.test.tsx.
describe("search journey", () => {
  afterEach(() => server.events.removeAllListeners());

  it("searches from the header, filters, and goes Back to the cached results", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/");
    await screen.findByRole("heading", {
      level: 1,
      name: /^Good (morning|afternoon|evening)$/,
    });

    // 1. Keyword from the header: after the debounce, /search?q= with every source merged.
    await user.type(
      screen.getByRole("searchbox", { name: "Search articles" }),
      "ai",
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Results for “ai”",
      }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/search");
    expect(router.state.location.search).toBe("?q=ai");
    expect(await screen.findByText("15 articles")).toBeInTheDocument();
    expect(new Set(articleSources().map((s) => s?.split(" · ")[0]))).toEqual(
      new Set(["The Guardian", "New York Times", "NewsAPI"]),
    );

    // 2. A category joins the URL and refetches.
    const paths = trackRequests();
    await user.click(screen.getByRole("checkbox", { name: "technology" }));
    expect(router.state.location.search).toBe("?q=ai&categories=technology");
    await waitFor(() => expect(paths).toContain("/api/guardian/search"));

    // 3. Narrow to the Guardian: only its articles, and no request to the dropped sources.
    await user.click(screen.getByRole("checkbox", { name: "NewsAPI" }));
    // Previous results stay on screen while fetching (keepPreviousData), so wait for
    // the new ones; clicking sooner would cancel this fetch and leave nothing cached.
    await waitFor(() =>
      expect(articleSources().some((s) => s?.startsWith("NewsAPI"))).toBe(
        false,
      ),
    );
    paths.length = 0;
    await user.click(screen.getByRole("checkbox", { name: "New York Times" }));
    expect(router.state.location.search).toBe(
      "?q=ai&categories=technology&sources=guardian",
    );
    await waitFor(() =>
      expect(articleSources().every((s) => s === "The Guardian")).toBe(true),
    );
    expect(paths).toEqual(["/api/guardian/search"]);
    expect(
      screen.getByRole("checkbox", { name: "The Guardian" }),
    ).toBeDisabled();

    // 4. Back restores the previous filters, served from the query cache.
    paths.length = 0;
    await router.navigate(-1);
    expect(router.state.location.search).toBe(
      "?q=ai&categories=technology&sources=guardian&sources=nyt",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", { name: "New York Times" }),
      ).toBeChecked(),
    );
    await waitFor(() => expect(articleSources()).toContain("New York Times"));
    expect(paths).toEqual([]);
  });
});
