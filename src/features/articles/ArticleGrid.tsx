import type { Article } from "@/domain/types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ArticleCard } from "./ArticleCard";

interface ArticleGridProps {
  articles: Article[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  // True while new filters load over the previous results.
  isUpdating: boolean;
  onLoadMore: () => void;
}

export function ArticleGrid({
  articles,
  hasNextPage,
  isFetchingNextPage,
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
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => {
          // The first result leads: full row on tablet, two of three columns on desktop.
          const isFeatured = index === 0;
          return (
            <li key={article.id} className={cn(isFeatured && "md:col-span-2")}>
              <ArticleCard article={article} isFeatured={isFeatured} />
            </li>
          );
        })}
      </ul>

      {hasNextPage && (
        <div className="flex justify-center">
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
