import { describe, expect, it } from "vitest";
import type { Article } from "@/domain/types";
import {
  boostByAuthors,
  matchesAuthor,
  splitByline,
  suggestAuthors,
} from "./authors";

function makeArticle(id: string, author?: string): Article {
  return {
    id,
    source: "guardian",
    title: id,
    url: `https://example.com/${id}`,
    author,
    publishedAt: "2026-10-29T10:00:00Z",
  };
}

describe("splitByline", () => {
  it.each([
    ["Jane Doe", ["Jane Doe"]],
    ["By Jane Doe and John Roe", ["Jane Doe", "John Roe"]],
    ["Jane Doe, John Roe & Ann Lee", ["Jane Doe", "John Roe", "Ann Lee"]],
    ["Jane Doe; John Roe", ["Jane Doe", "John Roe"]],
    ["  ,  ", []],
  ])("splits %j", (byline, names) => {
    expect(splitByline(byline)).toEqual(names);
  });

  it("doesn't split inside a name containing 'and'", () => {
    expect(splitByline("Alexandra Anderson")).toEqual(["Alexandra Anderson"]);
  });
});

describe("matchesAuthor", () => {
  it.each([
    ["Jane Doe", "Jane Doe", true],
    ["By Jane Doe and John Roe", "jane doe", true],
    ["Lisa Cox Environment and climate correspondent", "Lisa Cox", true],
    ["O'Brien, Kate", "o brien", true],
    ["Alice Smith", "Ali", false],
    ["Jane Doer", "Jane Doe", false],
    ["Jane Doe", "", false],
    ["V (formerly Eve Ensler)", "V", true],
  ])("%j / %j → %s", (byline, name, expected) => {
    expect(matchesAuthor(byline, name)).toBe(expected);
  });
});

describe("suggestAuthors", () => {
  it("returns names from bylines, most frequent first", () => {
    const articles = [
      makeArticle("a", "Ann Lee"),
      makeArticle("b", "By Jane Doe and Ann Lee"),
      makeArticle("c", "jane doe"), // not capitalized: skipped
      makeArticle("d"),
      makeArticle("e", "Seán O’Neill"),
    ];

    expect(suggestAuthors(articles)).toEqual([
      "Ann Lee",
      "Jane Doe",
      "Seán O’Neill",
    ]);
  });

  it("skips fragments that don't look like a name", () => {
    const articles = [
      makeArticle(
        "a",
        "Annika Surmeier, Senior lecturer, University of Cape Town",
      ),
      makeArticle("b", "ET Online"),
      makeArticle("c", "Madonna"),
      makeArticle("d", "Lisa Cox Environment and climate correspondent"),
    ];

    expect(suggestAuthors(articles)).toEqual([
      "Annika Surmeier",
      "ET Online",
      "Lisa Cox Environment",
    ]);
  });
});

describe("boostByAuthors", () => {
  const articles = [
    makeArticle("a", "Ann Lee"),
    makeArticle("b", "By Jane Doe and John Roe"),
    makeArticle("c"),
    makeArticle("d", "JANE DOE"),
  ];

  it("moves followed authors first and keeps each group's order", () => {
    const result = boostByAuthors(articles, ["Jane Doe"]);

    expect(result.articles.map((a) => a.id)).toEqual(["b", "d", "a", "c"]);
    expect([...result.followedIds]).toEqual(["b", "d"]);
  });

  it("returns the input unchanged with no followed authors", () => {
    const result = boostByAuthors(articles, []);

    expect(result.articles).toBe(articles);
    expect(result.followedIds.size).toBe(0);
  });
});
