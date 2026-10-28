import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/domain/types";
import { NYT_SECTIONS, nytCategoryOf } from "./categories";

describe("NYT categories", () => {
  it("maps every category to at least one section", () => {
    for (const category of CATEGORIES) {
      expect(NYT_SECTIONS[category].length).toBeGreaterThan(0);
    }
  });

  it("maps every mapped section back to its category", () => {
    for (const category of CATEGORIES) {
      for (const section of NYT_SECTIONS[category]) {
        expect(nytCategoryOf(section)).toBe(category);
      }
    }
  });

  it("has no category for unknown or missing sections", () => {
    expect(nytCategoryOf("Briefing")).toBeUndefined();
    expect(nytCategoryOf(undefined)).toBeUndefined();
  });
});
