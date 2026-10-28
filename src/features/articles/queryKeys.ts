import type { ArticleQuery } from "@/domain/types";

// All article query keys come from here, never inline arrays.
export const articleKeys = {
  all: ["articles"] as const,
  // No `page`: an infinite query keeps every page under one key.
  search: (query: ArticleQuery) =>
    [
      ...articleKeys.all,
      "search",
      {
        keyword: query.keyword,
        from: query.from,
        to: query.to,
        categories: query.categories,
        sources: query.sources,
        sort: query.sort,
      },
    ] as const,
};
