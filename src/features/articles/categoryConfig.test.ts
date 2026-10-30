import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/domain/types";
import { getCategoryColorClass } from "./categoryConfig";

describe("getCategoryColorClass", () => {
  it.each(CATEGORIES)("points %s at its own color token", (category) => {
    expect(getCategoryColorClass(category)).toBe(
      `[--chip-color:var(--color-category-${category})]`,
    );
  });
});
