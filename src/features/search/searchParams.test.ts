import { describe, expect, it } from "vitest";
import { SOURCE_IDS } from "@/domain/types";
import { makeQuery } from "@/test/query";
import {
  clearFilters,
  hasActiveFilters,
  parseSearchParams,
  toSearchParams,
} from "./searchParams";

const parse = (search: string) =>
  parseSearchParams(new URLSearchParams(search));

describe("parseSearchParams", () => {
  it("returns defaults for an empty URL", () => {
    expect(parse("")).toEqual(makeQuery({ sources: [...SOURCE_IDS] }));
  });

  it("reads every param", () => {
    expect(
      parse(
        "?q=climate&from=2026-10-01&to=2026-10-28&categories=science&categories=world&sources=nyt",
      ),
    ).toEqual(
      makeQuery({
        keyword: "climate",
        from: "2026-10-01",
        to: "2026-10-28",
        categories: ["world", "science"], // canonical order
        sources: ["nyt"],
        sort: "relevance",
      }),
    );
  });

  it("sorts by relevance with a keyword and newest without one", () => {
    expect(parse("?q=ai").sort).toBe("relevance");
    expect(parse("?categories=world").sort).toBe("newest");
    expect(parse("?q=%20").sort).toBe("newest");
  });

  it("drops unknown and duplicate list values", () => {
    const query = parse(
      "?categories=foo&categories=technology&categories=technology&sources=bbc",
    );

    expect(query.categories).toEqual(["technology"]);
    expect(query.sources).toEqual([...SOURCE_IDS]);
  });

  it.each(["2026-13-40", "2026-02-30", "yesterday", "2026-1-5", ""])(
    "ignores the invalid date %j",
    (value) => {
      expect(parse(`?from=${value}&to=${value}`)).toMatchObject({
        from: undefined,
        to: undefined,
      });
    },
  );

  it("drops the range when from is after to", () => {
    expect(parse("?from=2026-10-28&to=2026-10-01")).toMatchObject({
      from: undefined,
      to: undefined,
    });
  });

  it("treats a whitespace keyword as none and trims the rest", () => {
    expect(parse("?q=%20%20").keyword).toBeUndefined();
    expect(parse("?q=%20ai%20").keyword).toBe("ai");
  });
});

describe("toSearchParams", () => {
  it("serializes the default query to an empty string", () => {
    expect(
      toSearchParams(makeQuery({ sources: [...SOURCE_IDS] })).toString(),
    ).toBe("");
  });

  it("uses repeated keys for lists and omits sources when all are selected", () => {
    const params = toSearchParams(
      makeQuery({
        keyword: "ai",
        categories: ["world", "technology"],
        sources: [...SOURCE_IDS],
      }),
    );

    expect(params.toString()).toBe(
      "q=ai&categories=world&categories=technology",
    );
  });

  it("round-trips through parseSearchParams", () => {
    const query = makeQuery({
      keyword: "election",
      from: "2026-10-22",
      to: "2026-10-28",
      categories: ["politics"],
      sources: ["guardian", "newsapi"],
      sort: "relevance",
    });

    expect(parseSearchParams(toSearchParams(query))).toEqual(query);
  });
});

describe("hasActiveFilters", () => {
  const all = [...SOURCE_IDS];

  it("counts dates, categories, and a source subset as active filters, not the keyword", () => {
    expect(hasActiveFilters(makeQuery({ keyword: "ai", sources: all }))).toBe(
      false,
    );
    expect(
      hasActiveFilters(makeQuery({ to: "2026-10-01", sources: all })),
    ).toBe(true);
    expect(
      hasActiveFilters(makeQuery({ categories: ["health"], sources: all })),
    ).toBe(true);
    expect(hasActiveFilters(makeQuery({ sources: ["nyt"] }))).toBe(true);
  });
});

describe("clearFilters", () => {
  it("resets dates, categories, and sources but keeps the keyword", () => {
    const query = makeQuery({
      keyword: "ai",
      from: "2026-10-01",
      categories: ["world"],
      sources: ["nyt"],
    });

    expect(clearFilters(query)).toEqual(
      makeQuery({ keyword: "ai", sources: [...SOURCE_IDS] }),
    );
  });
});
