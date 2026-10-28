import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { RateLimitError } from "@/shared/lib/http";
import { makeQuery } from "@/test/query";
import { server } from "@/test/server";
import { buildGuardianParams, guardianSource } from "./adapter";

describe("buildGuardianParams", () => {
  it("maps keyword, dates, categories and page", () => {
    expect(
      buildGuardianParams(
        makeQuery({
          keyword: "climate",
          from: "2026-10-01",
          to: "2026-10-28",
          categories: ["sports", "health"],
          page: 2,
        }),
      ),
    ).toEqual({
      q: "climate",
      "from-date": "2026-10-01",
      "to-date": "2026-10-28",
      section: "sport|society",
      page: 2,
      "page-size": 20,
      "order-by": "newest",
      "show-fields": "trailText,thumbnail,byline",
    });
  });

  it("orders by relevance when asked", () => {
    expect(
      buildGuardianParams(makeQuery({ keyword: "ai", sort: "relevance" })),
    ).toMatchObject({ "order-by": "relevance" });
  });

  it("leaves optional filters empty", () => {
    expect(buildGuardianParams(makeQuery())).toMatchObject({
      q: undefined,
      "from-date": undefined,
      "to-date": undefined,
      section: "",
      page: 1,
    });
  });
});

describe("guardianSource.search", () => {
  it("returns the mapped fixture page", async () => {
    const page = await guardianSource.search(makeQuery({ keyword: "climate" }));

    expect(page.articles).toHaveLength(5);
    expect(
      page.articles.every((article) => article.id.startsWith("guardian:")),
    ).toBe(true);
    expect(page.hasMore).toBe(false);
  });

  it("has more while the current page is before the last", async () => {
    server.use(
      http.get("/api/guardian/search", () =>
        HttpResponse.json({
          response: { results: [], currentPage: 1, pages: 3 },
        }),
      ),
    );

    expect(await guardianSource.search(makeQuery())).toEqual({
      articles: [],
      hasMore: true,
    });
  });

  it("returns an empty page for an unexpected body", async () => {
    server.use(http.get("/api/guardian/search", () => HttpResponse.json({})));

    expect(await guardianSource.search(makeQuery())).toEqual({
      articles: [],
      hasMore: false,
    });
  });

  it("rejects with RateLimitError on 429", async () => {
    server.use(
      http.get(
        "/api/guardian/search",
        () => new HttpResponse(null, { status: 429 }),
      ),
    );

    await expect(guardianSource.search(makeQuery())).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });
});
