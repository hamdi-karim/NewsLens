import { CATEGORIES, type Category } from "@/domain/types";

export type SectionMap = Record<Category, readonly string[]>;

// Reverse of a category → sections map, derived from it so the two can't drift.
// Unknown or missing sections have no category.
export function createCategoryLookup(
  map: SectionMap,
): (section: string | undefined) => Category | undefined {
  const bySection = new Map<string, Category>();
  for (const category of CATEGORIES) {
    for (const section of map[category]) {
      if (!bySection.has(section)) bySection.set(section, category);
    }
  }
  return (section) => (section ? bySection.get(section) : undefined);
}

// Sections to request for the given categories, without duplicates.
export function sectionsFor(map: SectionMap, categories: Category[]): string[] {
  return [...new Set(categories.flatMap((category) => map[category]))];
}
