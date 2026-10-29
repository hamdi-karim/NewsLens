import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useState } from "react";
import { articleKeys } from "@/features/articles";
import type { AggregatedPage } from "@/services/aggregator";
import { suggestAuthors } from "@/services/authors";

// Names from bylines of articles already in the cache. Read once on mount and never
// fetches: suggestions aren't worth API quota. Empty if nothing was loaded yet.
export function useAuthorSuggestions(): string[] {
  const queryClient = useQueryClient();
  const [suggestions] = useState(() => {
    const cached = queryClient.getQueriesData<InfiniteData<AggregatedPage>>({
      queryKey: articleKeys.all,
    });
    const articles = cached.flatMap(
      ([, data]) => data?.pages.flatMap((page) => page.articles) ?? [],
    );
    return suggestAuthors(articles);
  });
  return suggestions;
}
