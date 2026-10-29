import type { ArticleQuery } from "@/domain/types";
import { ArticleResults } from "@/features/articles";
import { Button } from "@/shared/ui/button";

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
  return (
    <ArticleResults
      query={query}
      emptyState={{
        title: "No articles match your search",
        description:
          "Try a different keyword, a wider date range, or fewer filters.",
        action: hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear all filters
          </Button>
        ),
      }}
    />
  );
}
