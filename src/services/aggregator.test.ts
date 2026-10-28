import { describe, expect, it, vi } from "vitest";
import { UnsupportedQueryError } from "@/domain/errors";
import type {
  Article,
  ArticleQuery,
  FilterCapabilities,
  NewsSource,
  SourceId,
  SourcePage,
} from "@/domain/types";
import { HttpError, RateLimitError } from "@/shared/lib/http";
import { makeQuery } from "@/test/query";
import {
  AllSourcesFailedError,
  fetchArticles,
  mergeArticles,
  normalizeUrl,
  SOURCE_TIMEOUT_MS,
} from "./aggregator";

const ALL_CAPABILITIES: FilterCapabilities = {
  keyword: true,
  dateRange: true,
  category: true,
  author: false,
};

function makeArticle(
  source: SourceId,
  overrides: Partial<Article> = {},
): Article {
  const slug = overrides.title ?? "story";
  return {
    id: `${source}:${slug}`,
    source,
    title: slug,
    url: `https://example.com/${source}/${slug}`,
    publishedAt: "2026-10-28T10:00:00.000Z",
    ...overrides,
  };
}

function makeSource(
  id: SourceId,
  result: SourcePage | Error,
  capabilities: Partial<FilterCapabilities> = {},
): NewsSource {
  return {
    id,
    label: id,
    capabilities: { ...ALL_CAPABILITIES, ...capabilities },
    search: vi.fn(() =>
      result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve(result),
    ),
  };
}

// Never resolves on its own; rejects when its signal aborts, like a fetch would.
function makeHangingSource(id: SourceId): NewsSource {
  return {
    id,
    label: id,
    capabilities: ALL_CAPABILITIES,
    search: vi.fn(
      (_query: ArticleQuery, signal?: AbortSignal) =>
        new Promise<SourcePage>((_resolve, reject) => {
          signal?.addEventListener("abort", () => reject(signal.reason));
        }),
    ),
  };
}

const ALL_SOURCES: SourceId[] = ["guardian", "nyt", "newsapi"];

describe("fetchArticles", () => {
  it("calls only the selected sources", async () => {
    const guardian = makeSource("guardian", { articles: [], hasMore: false });
    const nyt = makeSource("nyt", { articles: [], hasMore: false });

    await fetchArticles(makeQuery({ sources: ["nyt"] }), undefined, [
      guardian,
      nyt,
    ]);

    expect(guardian.search).not.toHaveBeenCalled();
    expect(nyt.search).toHaveBeenCalledOnce();
  });

  it("forwards the query and aborts sources when the caller cancels", async () => {
    const guardian = makeHangingSource("guardian");
    const query = makeQuery({ keyword: "ai", sources: ["guardian"] });
    const controller = new AbortController();

    const result = fetchArticles(query, controller.signal, [guardian]);
    controller.abort();

    await expect(result).rejects.toBeInstanceOf(AllSourcesFailedError);
    expect(guardian.search).toHaveBeenCalledWith(
      query,
      expect.any(AbortSignal),
    );
  });

  it("reports a source slower than the timeout as failed, keeping the others", async () => {
    vi.useFakeTimers();
    try {
      const sources = [
        makeSource("guardian", {
          articles: [makeArticle("guardian")],
          hasMore: false,
        }),
        makeHangingSource("nyt"),
      ];

      const result = fetchArticles(
        makeQuery({ sources: ["guardian", "nyt"] }),
        undefined,
        sources,
      );
      await vi.advanceTimersByTimeAsync(SOURCE_TIMEOUT_MS);
      const page = await result;

      expect(page.articles).toHaveLength(1);
      expect(page.failedSources).toEqual(["nyt"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("merges results and lists the sources that have more", async () => {
    const sources = [
      makeSource("guardian", {
        articles: [
          makeArticle("guardian", {
            title: "a",
            publishedAt: "2026-10-27T00:00:00Z",
          }),
        ],
        hasMore: true,
      }),
      makeSource("nyt", {
        articles: [
          makeArticle("nyt", {
            title: "b",
            publishedAt: "2026-10-28T00:00:00Z",
          }),
        ],
        hasMore: false,
      }),
    ];

    const page = await fetchArticles(
      makeQuery({ sources: ["guardian", "nyt"] }),
      undefined,
      sources,
    );

    expect(page.articles.map((a) => a.id)).toEqual(["nyt:b", "guardian:a"]);
    expect(page.sourcesWithMore).toEqual(["guardian"]);
    expect(page.failedSources).toEqual([]);
    expect(page.skippedSources).toEqual([]);
  });

  it("reports failed and skipped sources while keeping healthy results", async () => {
    const sources = [
      makeSource("guardian", {
        articles: [makeArticle("guardian")],
        hasMore: false,
      }),
      makeSource("nyt", new RateLimitError("429")),
      makeSource(
        "newsapi",
        new UnsupportedQueryError("NewsAPI only covers the last 30 days"),
      ),
    ];

    const page = await fetchArticles(
      makeQuery({ sources: ALL_SOURCES }),
      undefined,
      sources,
    );

    expect(page.articles).toHaveLength(1);
    expect(page.failedSources).toEqual(["nyt"]);
    expect(page.skippedSources).toEqual([
      { id: "newsapi", reason: "NewsAPI only covers the last 30 days" },
    ]);
  });

  it("throws AllSourcesFailedError when every called source fails", async () => {
    const sources = [
      makeSource("guardian", new HttpError(500, "500")),
      makeSource("nyt", new TypeError("network")),
      makeSource("newsapi", new UnsupportedQueryError("old range")),
    ];

    const result = fetchArticles(
      makeQuery({ sources: ALL_SOURCES }),
      undefined,
      sources,
    );

    await expect(result).rejects.toBeInstanceOf(AllSourcesFailedError);
    await expect(result).rejects.toMatchObject({
      failedSources: ["guardian", "nyt"],
    });
  });

  it("returns an empty page when every source is skipped", async () => {
    const sources = [
      makeSource("newsapi", new UnsupportedQueryError("old range")),
    ];

    const page = await fetchArticles(
      makeQuery({ sources: ["newsapi"] }),
      undefined,
      sources,
    );

    expect(page.articles).toEqual([]);
    expect(page.skippedSources).toHaveLength(1);
  });

  describe("client-side filters", () => {
    it("filters the date range only for sources without the capability", async () => {
      const inRange = makeArticle("newsapi", {
        title: "in",
        publishedAt: "2026-10-20T23:59:00Z",
      });
      const tooOld = makeArticle("newsapi", {
        title: "old",
        publishedAt: "2026-10-09T12:00:00Z",
      });
      const tooNew = makeArticle("newsapi", {
        title: "new",
        publishedAt: "2026-10-26T00:00:00Z",
      });
      const nativeOld = makeArticle("guardian", {
        title: "native",
        publishedAt: "2026-10-01T00:00:00Z",
      });
      const sources = [
        makeSource("guardian", { articles: [nativeOld], hasMore: false }),
        makeSource(
          "newsapi",
          { articles: [inRange, tooOld, tooNew], hasMore: false },
          { dateRange: false },
        ),
      ];

      const page = await fetchArticles(
        makeQuery({
          from: "2026-10-10",
          to: "2026-10-25",
          sources: ["guardian", "newsapi"],
        }),
        undefined,
        sources,
      );

      expect(page.articles.map((a) => a.title)).toEqual(["in", "native"]);
    });

    it("filters categories for sources without the capability, dropping uncategorized items", async () => {
      const sources = [
        makeSource(
          "newsapi",
          {
            articles: [
              makeArticle("newsapi", { title: "tech", category: "technology" }),
              makeArticle("newsapi", { title: "sport", category: "sports" }),
              makeArticle("newsapi", { title: "none" }),
            ],
            hasMore: false,
          },
          { category: false },
        ),
      ];

      const page = await fetchArticles(
        makeQuery({ categories: ["technology"], sources: ["newsapi"] }),
        undefined,
        sources,
      );

      expect(page.articles.map((a) => a.title)).toEqual(["tech"]);
    });

    it("matches the keyword case-insensitively in title or description", async () => {
      const sources = [
        makeSource(
          "nyt",
          {
            articles: [
              makeArticle("nyt", { title: "Climate deal" }),
              makeArticle("nyt", {
                title: "other",
                description: "on CLIMATE policy",
              }),
              makeArticle("nyt", { title: "unrelated" }),
            ],
            hasMore: false,
          },
          { keyword: false },
        ),
      ];

      const page = await fetchArticles(
        makeQuery({ keyword: "climate", sources: ["nyt"] }),
        undefined,
        sources,
      );

      expect(page.articles.map((a) => a.title).sort()).toEqual([
        "Climate deal",
        "other",
      ]);
    });

    it("never filters by author", async () => {
      const sources = [
        makeSource("nyt", {
          articles: [makeArticle("nyt", { author: "Jane" })],
          hasMore: false,
        }),
      ];

      const page = await fetchArticles(
        makeQuery({ authors: ["Someone else"], sources: ["nyt"] }),
        undefined,
        sources,
      );

      expect(page.articles).toHaveLength(1);
    });
  });
});

describe("mergeArticles", () => {
  const sources = [
    makeSource("guardian", { articles: [], hasMore: false }),
    makeSource("nyt", { articles: [], hasMore: false }),
    makeSource("newsapi", { articles: [], hasMore: false }),
  ];

  it("keeps the copy from the higher-priority source on a URL collision", () => {
    const fromNewsApi = makeArticle("newsapi", {
      url: "https://WWW.theguardian.com/world/story/?utm_source=x#top",
      publishedAt: "2026-10-28T12:00:00Z",
    });
    const fromGuardian = makeArticle("guardian", {
      url: "https://www.theguardian.com/world/story",
      publishedAt: "2026-10-28T11:00:00Z",
    });

    const merged = mergeArticles([fromNewsApi, fromGuardian], sources);

    expect(merged).toEqual([fromGuardian]);
  });

  it("sorts newest first", () => {
    const older = makeArticle("guardian", {
      title: "older",
      publishedAt: "2026-10-01T00:00:00Z",
    });
    const newer = makeArticle("newsapi", {
      title: "newer",
      publishedAt: "2026-10-28T00:00:00Z",
    });

    expect(mergeArticles([older, newer], sources)).toEqual([newer, older]);
  });
});

describe("normalizeUrl", () => {
  it.each([
    ["https://Example.COM/a/b/", "example.com/a/b"],
    ["https://example.com/a/b?x=1#y", "example.com/a/b"],
    ["http://example.com/a/b", "example.com/a/b"],
    ["https://example.com/", "example.com"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });

  it("returns the input unchanged when it isn't a URL", () => {
    expect(normalizeUrl("not a url")).toBe("not a url");
  });
});
