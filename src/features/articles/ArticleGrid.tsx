import type { Article } from "@/domain/types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ArticleCard } from "./ArticleCard";

interface ArticleGridProps {
  articles: Article[];
  // Articles by authors the reader follows get a label.
  followedIds: ReadonlySet<string>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  // The last "Load more" failed; the results already shown stay.
  isLoadMoreError: boolean;
  // True while new filters load over the previous results.
  isUpdating: boolean;
  onLoadMore: () => void;
}

export function ArticleGrid({
  articles,
  followedIds,
  hasNextPage,
  isFetchingNextPage,
  isLoadMoreError,
  isUpdating,
  onLoadMore,
}: ArticleGridProps) {
  return (
    <div
      aria-busy={isUpdating}
      className={cn(
        "flex flex-col gap-6 transition-opacity",
        isUpdating && "opacity-60",
      )}
    >
      {/* Explicit grid-cols-1: an implicit column would grow to fit long unbreakable text. */}
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => {
          // The first result leads and takes the whole first row at every width.
          const isFeatured = index === 0;
          return (
            <li key={article.id} className={cn(isFeatured && "col-span-full")}>
              <ArticleCard
                article={article}
                isFeatured={isFeatured}
                isFromFollowedAuthor={followedIds.has(article.id)}
              />
            </li>
          );
        })}
      </ul>

      {hasNextPage && (
        <div className="flex flex-col items-center gap-2">
          {isLoadMoreError && !isFetchingNextPage && (
            <p role="alert" className="text-sm text-destructive">
              Couldn't load more articles. Please try again.
            </p>
          )}
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
