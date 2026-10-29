import { describe, expect, it } from "vitest";
import { EMPTY_PREFERENCES } from "@/domain/types";
import {
  MAX_AUTHOR_LENGTH,
  MAX_AUTHORS,
  normalizeAuthor,
  sanitizePreferences,
} from "./sanitizePreferences";

describe("sanitizePreferences", () => {
  it.each([null, undefined, 42, "text", [], ["guardian"]])(
    "returns empty preferences for %j",
    (value) => {
      expect(sanitizePreferences(value)).toEqual(EMPTY_PREFERENCES);
    },
  );

  it("fills in missing or non-array fields", () => {
    expect(sanitizePreferences({ sources: "nyt" })).toEqual(EMPTY_PREFERENCES);
  });

  it("keeps known ids in canonical order without duplicates", () => {
    expect(
      sanitizePreferences({
        sources: ["newsapi", "bbc", "guardian", "newsapi"],
        categories: ["sports", 3, "world", "gaming"],
        authors: [],
      }),
    ).toEqual({
      sources: ["guardian", "newsapi"],
      categories: ["world", "sports"],
      authors: [],
    });
  });

  it("normalizes authors and dedupes them case-insensitively", () => {
    expect(
      sanitizePreferences({
        authors: [" Jane  Doe ", "jane doe", "", "   ", 7, "John Smith"],
      }).authors,
    ).toEqual(["Jane Doe", "John Smith"]);
  });

  it("caps the number and length of authors", () => {
    const many = Array.from({ length: MAX_AUTHORS + 5 }, (_, i) => `A ${i}`);
    const long = "x".repeat(MAX_AUTHOR_LENGTH + 50);

    expect(sanitizePreferences({ authors: many }).authors).toHaveLength(
      MAX_AUTHORS,
    );
    expect(sanitizePreferences({ authors: [long] }).authors[0]).toHaveLength(
      MAX_AUTHOR_LENGTH,
    );
  });
});

describe("normalizeAuthor", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeAuthor("  Jane \t Doe\n")).toBe("Jane Doe");
  });
});
