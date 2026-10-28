import type { ArticleQuery } from "@/domain/types";

export function makeQuery(overrides: Partial<ArticleQuery> = {}): ArticleQuery {
  return {
    categories: [],
    sources: [],
    authors: [],
    sort: "newest",
    page: 1,
    ...overrides,
  };
}
