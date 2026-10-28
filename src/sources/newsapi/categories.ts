import type { Category } from "@/domain/types";
import type { NewsApiCategory } from "./types";

// App category → NewsAPI `/top-headlines` category. world and politics both map to
// `general`, so their NewsAPI results overlap (known trade-off).
export const NEWSAPI_CATEGORY: Record<Category, NewsApiCategory> = {
  world: "general",
  business: "business",
  technology: "technology",
  science: "science",
  health: "health",
  sports: "sports",
  culture: "entertainment",
  politics: "general",
};

// One call per distinct NewsAPI category. Each is tagged with the first app category
// that maps to it, so its articles get a category the aggregator can filter on.
export function newsApiCategoryCalls(
  categories: Category[],
): { category: NewsApiCategory; appCategory: Category }[] {
  const calls = new Map<NewsApiCategory, Category>();
  for (const appCategory of categories) {
    const category = NEWSAPI_CATEGORY[appCategory];
    if (!calls.has(category)) calls.set(category, appCategory);
  }
  return [...calls].map(([category, appCategory]) => ({
    category,
    appCategory,
  }));
}
