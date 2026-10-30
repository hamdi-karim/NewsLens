import type { Category } from "@/domain/types";

// The only place category colors are mapped (tokens live in index.css). Each class sets
// --chip-color, which chips and tags read, so their styles are written once.
const CATEGORY_COLOR_CLASS_NAMES: Record<Category, string> = {
  world: "[--chip-color:var(--color-category-world)]",
  business: "[--chip-color:var(--color-category-business)]",
  technology: "[--chip-color:var(--color-category-technology)]",
  science: "[--chip-color:var(--color-category-science)]",
  health: "[--chip-color:var(--color-category-health)]",
  sports: "[--chip-color:var(--color-category-sports)]",
  culture: "[--chip-color:var(--color-category-culture)]",
  politics: "[--chip-color:var(--color-category-politics)]",
};

export function getCategoryColorClass(category: Category): string {
  return CATEGORY_COLOR_CLASS_NAMES[category];
}
