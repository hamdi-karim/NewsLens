// Kept outside netlify/functions/: Netlify deploys every file there as a function.
import { describe, expect, it, vi } from "vitest";
import { handle, toUpstream } from "./functions/api.ts";

const KEYS = {
  GUARDIAN_API_KEY: "guardian-key",
  NYT_API_KEY: "nyt-key",
  NEWSAPI_API_KEY: "newsapi-key",
};

const at = (path: string) => new URL(path, "https://newslens.example");

describe("toUpstream", () => {
  it("adds the Guardian key as a query param and keeps the query", () => {
    expect(
      toUpstream(at("/api/guardian/search?q=climate&page=2"), KEYS),
    ).toEqual({
      url: "https://content.guardianapis.com/search?q=climate&page=2&api-key=guardian-key",
      headers: {},
    });
  });

  it("maps NYT to its article search path with the key", () => {
    expect(toUpstream(at("/api/nyt/articlesearch.json?q=ai"), KEYS)).toEqual({
      url: "https://api.nytimes.com/svc/search/v2/articlesearch.json?q=ai&api-key=nyt-key",
      headers: {},
    });
  });

  it.each(["everything", "top-headlines"])(
    "sends the NewsAPI key as a header for /%s",
    (endpoint) => {
      expect(toUpstream(at(`/api/newsapi/${endpoint}?q=x`), KEYS)).toEqual({
        url: `https://newsapi.org/v2/${endpoint}?q=x`,
        headers: { "X-Api-Key": "newsapi-key", "User-Agent": "NewsLens/1.0" },
      });
    },
  );

  it("replaces a client-supplied api-key with ours", () => {
    const upstream = toUpstream(at("/api/guardian/search?api-key=evil"), KEYS);
    expect(new URL(upstream?.url ?? "").searchParams.getAll("api-key")).toEqual(
      ["guardian-key"],
    );
  });

  it.each([
    "/api/nope",
    "/api/guardian",
    "/api/guardian/search/extra",
    "/api/newsapi/sources",
    "/api/nyt/archive.json",
  ])("does not proxy %s", (path) => {
    expect(toUpstream(at(path), KEYS)).toBeNull();
  });
});

describe("handle", () => {
  it("passes the upstream status, body, and content type through", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"message":"rate limited"}', {
        status: 429,
        headers: { "content-type": "application/json", "set-cookie": "x=1" },
      }),
    );

    const response = await handle(
      new Request("https://newslens.example/api/nyt/articlesearch.json?q=ai", {
        headers: { cookie: "session=1", referer: "https://newslens.example/" },
      }),
      KEYS,
      fetchImpl,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).toBe('{"message":"rate limited"}');
    // Only our headers went upstream: no cookie or referer from the browser.
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.nytimes.com/svc/search/v2/articlesearch.json?q=ai&api-key=nyt-key",
      { headers: {} },
    );
  });

  it("answers 404 without calling upstream for unknown paths", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const response = await handle(
      new Request("https://newslens.example/api/nope"),
      KEYS,
      fetchImpl,
    );
    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("answers 404 to anything but GET", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const response = await handle(
      new Request("https://newslens.example/api/guardian/search", {
        method: "POST",
      }),
      KEYS,
      fetchImpl,
    );
    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
