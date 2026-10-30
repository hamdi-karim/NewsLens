import { useMemo, type ReactNode } from "react";
import type { ArticleQuery, SortOrder } from "@/domain/types";
import { boostByAuthors } from "@/services/authors";
import { Button } from "@/shared/ui/button";
import { ArticleGrid } from "./ArticleGrid";
import { ArticleGridSkeleton } from "./ArticleGridSkeleton";
import { SourceNotice } from "./SourceNotice";
import { StateMessage } from "./StateMessage";
import { useArticleSearch } from "./useArticleSearch";

// Search derives sort from the keyword, the feed is always newest, so we say which applies.
const SORT_LABELS: Record<SortOrder, string> = {
  relevance: "Most relevant first",
  newest: "Newest first",
};

const NO_AUTHORS: string[] = [];

interface EmptyState {
  title: string;
  description: string;
  action?: ReactNode;
}

interface ArticleResultsProps {
  query: ArticleQuery;
  emptyState: EmptyState;
  // Moved to the top and labelled, never filtered (overview §5B).
  followedAuthors?: string[];
}

// Loading, empty, error, partial and "Load more" states, shared by search and the feed.
export function ArticleResults({
  query,
  emptyState,
  followedAuthors = NO_AUTHORS,
}: ArticleResultsProps) {
  const search = useArticleSearch(query);
  const loaded = search.data?.articles;
  const boosted = useMemo(
    () => loaded && boostByAuthors(loaded, followedAuthors),
    [loaded, followedAuthors],
  );

  // Data first: a failed "Load more" keeps the results already shown.
  if (search.data && boosted) {
    const { failedSources, skippedSources } = search.data;
    const { articles, followedIds } = boosted;
    const countText = `${articles.length} ${articles.length === 1 ? "article" : "articles"}`;

    return (
      <div className="flex flex-col gap-4">
        <SourceNotice
          failedSources={failedSources}
          skippedSources={skippedSources}
        />
        {articles.length === 0 ? (
          <StateMessage {...emptyState} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <p aria-live="polite">{countText}</p>
              <p>{SORT_LABELS[query.sort]}</p>
            </div>
            <ArticleGrid
              articles={articles}
              followedIds={followedIds}
              hasNextPage={search.hasNextPage}
              isFetchingNextPage={search.isFetchingNextPage}
              isLoadMoreError={search.isFetchNextPageError}
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
