import { useMemo } from "react";
import { SOURCE_IDS, type ArticleQuery } from "@/domain/types";
import { usePreferences } from "@/features/preferences";

// Turns saved preferences into the feed's query. Authors aren't in the query key
// (they only reorder), so following one costs no request. With no preferences the
// query equals the default /search query, so the two pages share one cache entry.
export function useFeedQuery() {
  const { preferences } = usePreferences();

  const query = useMemo<ArticleQuery>(
    () => ({
      categories: preferences.categories,
      sources:
        preferences.sources.length > 0 ? preferences.sources : [...SOURCE_IDS],
      authors: preferences.authors,
      sort: "newest",
      page: 1,
    }),
    [preferences],
  );

  return { query, preferences };
}
