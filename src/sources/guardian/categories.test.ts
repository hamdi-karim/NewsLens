import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/domain/types";
import { GUARDIAN_SECTIONS, guardianCategoryOf } from "./categories";

describe("Guardian categories", () => {
  it("maps every category to at least one section", () => {
    for (const category of CATEGORIES) {
      expect(GUARDIAN_SECTIONS[category].length).toBeGreaterThan(0);
    }
  });

  it("maps every mapped section back to its category", () => {
    for (const category of CATEGORIES) {
      for (const section of GUARDIAN_SECTIONS[category]) {
        expect(guardianCategoryOf(section)).toBe(category);
      }
    }
  });

  it("has no category for unknown or missing sections", () => {
    expect(guardianCategoryOf("commentisfree")).toBeUndefined();
    expect(guardianCategoryOf(undefined)).toBeUndefined();
  });
});
