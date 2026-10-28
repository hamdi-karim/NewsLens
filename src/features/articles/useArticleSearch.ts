import {
  keepPreviousData,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import type { Article, ArticleQuery, SourceId } from "@/domain/types";
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

interface UseArticleSearchOptions {
  enabled?: boolean;
}

export function useArticleSearch(
  query: ArticleQuery,
  { enabled = true }: UseArticleSearchOptions = {},
) {
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
    select: combinePages,
    placeholderData: keepPreviousData,
    enabled,
  });
}

// Merges every loaded page again, so duplicates across pages are removed too.
function combinePages(
  data: InfiniteData<AggregatedPage, PageParam>,
): ArticleSearchResult {
  const failed = new Set<SourceId>();
  const skipped = new Map<SourceId, SkippedSource>();
  for (const page of data.pages) {
    page.failedSources.forEach((id) => failed.add(id));
    page.skippedSources.forEach((source) => skipped.set(source.id, source));
  }

  return {
    articles: mergeArticles(data.pages.flatMap((page) => page.articles)),
    failedSources: [...failed],
    skippedSources: [...skipped.values()],
  };
}
