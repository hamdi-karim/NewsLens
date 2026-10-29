import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { EMPTY_PREFERENCES, type Preferences } from "@/domain/types";
import { renderRoute } from "@/test/render";
import { server } from "@/test/server";

const GREETING = /^Good (morning|afternoon|evening)$/;

function trackRequests(): URL[] {
  const requests: URL[] = [];
  server.events.on("request:start", ({ request }) => {
    requests.push(new URL(request.url));
  });
  return requests;
}

function prefs(overrides: Partial<Preferences>): Preferences {
  return { ...EMPTY_PREFERENCES, ...overrides };
}

afterEach(() => server.events.removeAllListeners());

describe("ForYouPage (real adapters + aggregator, MSW at the network edge)", () => {
  it("shows every source and a nudge when nothing is saved", async () => {
    const requests = trackRequests();
    renderRoute("/");

    expect(
      screen.getByRole("heading", { level: 1, name: GREETING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Personalize your feed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Set preferences" }),
    ).toHaveAttribute("href", "/preferences");

    expect(await screen.findByText(/^\d+ articles$/)).toBeInTheDocument();
    // No keyword → NewsAPI uses /top-headlines (overview §4 endpoint rule).
    expect(requests.map((url) => url.pathname).sort()).toEqual([
      "/api/guardian/search",
      "/api/newsapi/top-headlines",
      "/api/nyt/articlesearch.json",
    ]);
  });

  it("calls only the preferred sources, filtered by the preferred categories", async () => {
    const requests = trackRequests();
    renderRoute("/", {
      preferences: prefs({
        sources: ["guardian", "newsapi"],
        categories: ["technology"],
      }),
    });

    expect(
      screen.getByText(/^Technology from The Guardian and NewsAPI/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Personalize your feed" }),
    ).toBeNull();
    await screen.findByText(/^\d+ articles?$/);

    const paths = requests.map((url) => url.pathname);
    expect(paths).not.toContain("/api/nyt/articlesearch.json");
    const guardian = requests.find(
      (url) => url.pathname === "/api/guardian/search",
    );
    const newsApi = requests.find(
      (url) => url.pathname === "/api/newsapi/top-headlines",
    );
    expect(guardian?.searchParams.get("section")).toBe("technology");
    expect(newsApi?.searchParams.get("category")).toBe("technology");
  });

  it("moves articles by followed authors to the top and labels them", async () => {
    renderRoute("/", { preferences: prefs({ authors: ["melina khan"] }) });

    await screen.findByText(/^\d+ articles$/);
    const [first, second] = screen.getAllByRole("article");
    // The NewsAPI article is older than the Guardian ones, so only the boost puts it first.
    expect(within(first!).getByText("Melina Khan")).toBeInTheDocument();
    expect(
      within(first!).getByText("From an author you follow"),
    ).toBeInTheDocument();
    expect(within(second!).queryByText("From an author you follow")).toBeNull();
    expect(screen.getAllByText("From an author you follow")).toHaveLength(1);
  });

  it("reorders without a new request when an author is followed", async () => {
    const requests = trackRequests();
    const { preferencesStore } = renderRoute("/");
    await screen.findByText(/^\d+ articles$/);
    const requestCount = requests.length;

    preferencesStore.set(prefs({ authors: ["Melina Khan"] }));

    expect(
      await screen.findByText("From an author you follow"),
    ).toBeInTheDocument();
    expect(requests).toHaveLength(requestCount);
  });

  it("links to preferences when nothing matches", async () => {
    server.use(
      http.get("/api/guardian/search", () =>
        HttpResponse.json({
          response: { status: "ok", results: [], pages: 1 },
        }),
      ),
    );
    renderRoute("/", { preferences: prefs({ sources: ["guardian"] }) });

    expect(
      await screen.findByRole("heading", {
        name: "No articles match your preferences",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Edit preferences" }).at(-1),
    ).toHaveAttribute("href", "/preferences");
  });

  it("shows the other sources and a notice when one fails", async () => {
    server.use(
      http.get("/api/nyt/articlesearch.json", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    renderRoute("/");

    expect(
      await screen.findByText("New York Times is unavailable right now."),
    ).toBeInTheDocument();
    expect(screen.getByText(/^\d+ articles$/)).toBeInTheDocument();
  });

  it("opens preferences from the nudge", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    await user.click(screen.getByRole("link", { name: "Set preferences" }));

    expect(router.state.location.pathname).toBe("/preferences");
  });
});
