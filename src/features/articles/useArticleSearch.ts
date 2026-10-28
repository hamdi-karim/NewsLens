import {
  keepPreviousData,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { useCallback } from "react";
import type {
  Article,
  ArticleQuery,
  SortOrder,
  SourceId,
} from "@/domain/types";
import {
  fetchArticles,
  mergeArticles,
  type AggregatedPage,
  type SkippedSource,
} from "@/services/aggregator";
import { articleKeys } from "./queryKeys";

// Page n only calls the sources that still had more on page n-1.
interface PageParam {
  page: number;
  sources: SourceId[];
}

export interface ArticleSearchResult {
  articles: Article[];
  failedSources: SourceId[];
  skippedSources: SkippedSource[];
}

export function useArticleSearch(query: ArticleQuery) {
  // Memoized so TanStack Query only re-runs `select` when the data or sort changes.
  const select = useCallback(
    (data: InfiniteData<AggregatedPage, PageParam>) =>
      combinePages(data, query.sort),
    [query.sort],
  );

  return useInfiniteQuery({
    queryKey: articleKeys.search(query),
    queryFn: ({ pageParam, signal }) =>
      fetchArticles({ ...query, ...pageParam }, signal),
    initialPageParam: { page: 1, sources: query.sources } as PageParam,
    getNextPageParam: (
      lastPage,
      _allPages,
      lastPageParam,
    ): PageParam | undefined =>
      lastPage.sourcesWithMore.length > 0
        ? { page: lastPageParam.page + 1, sources: lastPage.sourcesWithMore }
        : undefined,
    select,
    placeholderData: keepPreviousData,
  });
}

// Merges every loaded page again, so duplicates across pages are removed too.
function combinePages(
  data: InfiniteData<AggregatedPage, PageParam>,
  sort: SortOrder,
): ArticleSearchResult {
  const failed = new Set<SourceId>();
  const skipped = new Map<SourceId, SkippedSource>();
  for (const page of data.pages) {
    page.failedSources.forEach((id) => failed.add(id));
    page.skippedSources.forEach((source) => skipped.set(source.id, source));
  }

  return {
    articles: mergeArticles(
      data.pages.flatMap((page) => page.articles),
      sort,
    ),
    failedSources: [...failed],
    skippedSources: [...skipped.values()],
  };
}
