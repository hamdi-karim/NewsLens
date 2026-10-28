import type { ArticleQuery, SortOrder } from "@/domain/types";
import {
  ArticleGrid,
  ArticleGridSkeleton,
  SourceNotice,
  StateMessage,
  useArticleSearch,
} from "@/features/articles";
import { Button } from "@/shared/ui/button";

// Sort is derived from the keyword (see parseSearchParams), so we say which one applies.
const SORT_LABELS: Record<SortOrder, string> = {
  relevance: "Most relevant first",
  newest: "Newest first",
};

interface SearchResultsProps {
  query: ArticleQuery;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

// With no keyword or filters this shows the latest articles from every source.
export function SearchResults({
  query,
  hasActiveFilters,
  onClearFilters,
}: SearchResultsProps) {
  const search = useArticleSearch(query);
  const clearAction = hasActiveFilters && (
    <Button variant="outline" onClick={onClearFilters}>
      Clear all filters
    </Button>
  );

  // Data first: a failed "Load more" keeps the results already shown.
  if (search.data) {
    const { articles, failedSources, skippedSources } = search.data;
    const countText = `${articles.length} ${articles.length === 1 ? "article" : "articles"}`;

    return (
      <div className="flex flex-col gap-4">
        <SourceNotice
          failedSources={failedSources}
          skippedSources={skippedSources}
        />
        {articles.length === 0 ? (
          <StateMessage
            title="No articles match your search"
            description="Try a different keyword, a wider date range, or fewer filters."
            action={clearAction}
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <p aria-live="polite">{countText}</p>
              <p>{SORT_LABELS[query.sort]}</p>
            </div>
            <ArticleGrid
              articles={articles}
              hasNextPage={search.hasNextPage}
              isFetchingNextPage={search.isFetchingNextPage}
              isUpdating={search.isPlaceholderData}
              onLoadMore={() => void search.fetchNextPage()}
            />
          </>
        )}
      </div>
    );
  }

  if (search.isError) {
    return (
      <StateMessage
        role="alert"
        title="Couldn't load articles"
        description="None of the selected sources responded. Please try again in a moment."
        action={
          <Button variant="outline" onClick={() => void search.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return <ArticleGridSkeleton />;
}
