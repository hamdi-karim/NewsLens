import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { HttpError } from "@/shared/lib/http";
import { makeQuery } from "@/test/query";
import { server } from "@/test/server";
import { buildNytParams, nytSource } from "./adapter";

function withHits(hits: number) {
  server.use(
    http.get("/api/nyt/articlesearch.json", () =>
      HttpResponse.json({ response: { docs: null, metadata: { hits } } }),
    ),
  );
}

describe("buildNytParams", () => {
  it("maps keyword, dates, categories and a 0-based page", () => {
    expect(
      buildNytParams(
        makeQuery({
          keyword: "climate",
          from: "2026-10-01",
          to: "2026-10-28",
          categories: ["business", "politics"],
          page: 2,
        }),
      ),
    ).toEqual({
      q: "climate",
      begin_date: "20261001",
      end_date: "20261028",
      fq: 'section.name:("Business" "U.S.")',
      page: 1,
      sort: "newest",
    });
  });

  it("sends no filter without categories", () => {
    expect(buildNytParams(makeQuery())).toMatchObject({
      q: undefined,
      begin_date: undefined,
      fq: undefined,
      page: 0,
    });
  });
});

describe("nytSource.search", () => {
  it("returns the mapped fixture page", async () => {
    const page = await nytSource.search(makeQuery({ keyword: "climate" }));

    expect(page.articles).toHaveLength(5);
    expect(
      page.articles.every((article) => article.id.startsWith("nyt:")),
    ).toBe(true);
    expect(page.hasMore).toBe(false);
  });

  it("handles `docs: null` when nothing matches", async () => {
    withHits(0);

    expect(await nytSource.search(makeQuery())).toEqual({
      articles: [],
      hasMore: false,
    });
  });

  it("has more while hits remain", async () => {
    withHits(25);

    expect((await nytSource.search(makeQuery({ page: 2 }))).hasMore).toBe(true);
    expect((await nytSource.search(makeQuery({ page: 3 }))).hasMore).toBe(
      false,
    );
  });

  it("stops after the API's last page (0-based 100)", async () => {
    withHits(10_000);

    expect((await nytSource.search(makeQuery({ page: 100 }))).hasMore).toBe(
      true,
    );
    expect((await nytSource.search(makeQuery({ page: 101 }))).hasMore).toBe(
      false,
    );
  });

  it("rejects with HttpError on 500", async () => {
    server.use(
      http.get(
        "/api/nyt/articlesearch.json",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    await expect(nytSource.search(makeQuery())).rejects.toMatchObject({
      status: 500,
    });
    await expect(nytSource.search(makeQuery())).rejects.toBeInstanceOf(
      HttpError,
    );
  });
});
