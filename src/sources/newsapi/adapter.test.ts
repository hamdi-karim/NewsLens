import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnsupportedQueryError } from "@/domain/errors";
import { makeQuery } from "@/test/query";
import { server } from "@/test/server";
import { buildNewsApiRequests, newsApiSource } from "./adapter";

const TODAY = new Date("2026-10-28T12:00:00Z");

describe("buildNewsApiRequests", () => {
  it("uses /everything for a keyword without categories, with server-side dates", () => {
    expect(
      buildNewsApiRequests(
        makeQuery({
          keyword: "climate",
          from: "2026-10-01",
          to: "2026-10-28",
          page: 2,
        }),
      ),
    ).toEqual([
      {
        path: "/api/newsapi/everything",
        params: {
          q: "climate",
          from: "2026-10-01",
          to: "2026-10-28",
          sortBy: "publishedAt",
          language: "en",
          page: 2,
          pageSize: 20,
        },
      },
    ]);
  });

  it("uses one /top-headlines call without a keyword or categories", () => {
    expect(buildNewsApiRequests(makeQuery({ from: "2026-10-20" }))).toEqual([
      {
        path: "/api/newsapi/top-headlines",
        params: { country: "us", q: undefined, page: 1, pageSize: 20 },
      },
    ]);
  });

  it("uses one /top-headlines call per distinct NewsAPI category, keeping the keyword", () => {
    const requests = buildNewsApiRequests(
      makeQuery({
        keyword: "election",
        categories: ["world", "politics", "sports"],
      }),
    );

    expect(requests).toEqual([
      {
        path: "/api/newsapi/top-headlines",
        params: {
          country: "us",
          q: "election",
          page: 1,
          pageSize: 20,
          category: "general",
        },
        category: "world",
      },
      {
        path: "/api/newsapi/top-headlines",
        params: {
          country: "us",
          q: "election",
          page: 1,
          pageSize: 20,
          category: "sports",
        },
        category: "sports",
      },
    ]);
  });
});

describe("newsApiSource.search", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(TODAY);
  });
  afterEach(() => vi.useRealTimers());

  it("returns the mapped /everything fixture, without [Removed] items", async () => {
    const page = await newsApiSource.search(makeQuery({ keyword: "climate" }));

    expect(page.articles).toHaveLength(5);
    expect(
      page.articles.every((article) => article.id.startsWith("newsapi:")),
    ).toBe(true);
    expect(page.hasMore).toBe(false);
  });

  it("merges per-category calls and tags articles with their category", async () => {
    const categories: string[] = [];
    server.use(
      http.get("/api/newsapi/top-headlines", ({ request }) => {
        const category =
          new URL(request.url).searchParams.get("category") ?? "";
        categories.push(category);
        return HttpResponse.json({
          totalResults: 1,
          articles: [
            {
              title: `${category} story`,
              url: `https://example.com/${category}`,
              publishedAt: "2026-10-28T08:00:00Z",
            },
          ],
        });
      }),
    );

    const page = await newsApiSource.search(
      makeQuery({ categories: ["culture", "science"] }),
    );

    expect(categories.sort()).toEqual(["entertainment", "science"]);
    expect(
      page.articles.map((article) => [article.title, article.category]),
    ).toEqual([
      ["entertainment story", "culture"],
      ["science story", "science"],
    ]);
  });

  it("has more while any call has results left, capped at 100", async () => {
    server.use(
      http.get("/api/newsapi/everything", () =>
        HttpResponse.json({ totalResults: 11_468, articles: [] }),
      ),
    );

    expect(
      (await newsApiSource.search(makeQuery({ keyword: "a", page: 4 })))
        .hasMore,
    ).toBe(true);
    expect(
      (await newsApiSource.search(makeQuery({ keyword: "a", page: 5 })))
        .hasMore,
    ).toBe(false);
  });

  it("throws UnsupportedQueryError for a `from` older than 30 days, without a request", async () => {
    const onRequest = vi.fn();
    server.events.on("request:start", onRequest);

    await expect(
      newsApiSource.search(
        makeQuery({ keyword: "climate", from: "2026-09-01" }),
      ),
    ).rejects.toBeInstanceOf(UnsupportedQueryError);
    expect(onRequest).not.toHaveBeenCalled();

    server.events.removeAllListeners();
  });

  it("accepts a `from` inside the 30-day window", async () => {
    const onRequest = vi.fn();
    server.events.on("request:start", onRequest);

    await expect(
      newsApiSource.search(
        makeQuery({ keyword: "climate", from: "2026-10-01" }),
      ),
    ).resolves.toMatchObject({ hasMore: false });
    expect(onRequest).toHaveBeenCalledTimes(1);

    server.events.removeAllListeners();
  });

  it("rejects when any category call fails", async () => {
    server.use(
      http.get("/api/newsapi/top-headlines", ({ request }) =>
        new URL(request.url).searchParams.get("category") === "sports"
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ totalResults: 0, articles: [] }),
      ),
    );

    await expect(
      newsApiSource.search(makeQuery({ categories: ["business", "sports"] })),
    ).rejects.toMatchObject({ status: 500 });
  });
});
