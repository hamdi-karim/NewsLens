import type { ArticleQuery } from "@/domain/types";

export function makeQuery(overrides: Partial<ArticleQuery> = {}): ArticleQuery {
  return { categories: [], sources: [], authors: [], page: 1, ...overrides };
}
