import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { ArticleQuery } from "@/domain/types";
import {
  hasActiveFilters,
  isIdleQuery,
  parseSearchParams,
  toSearchParams,
} from "./searchParams";

interface SetQueryOptions {
  // Keyword edits replace the history entry; filter changes push one (the default).
  replace?: boolean;
}

// Reads and writes the search state in the URL.
export function useSearchQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.toString();

  const query = useMemo(
    () => parseSearchParams(new URLSearchParams(search)),
    [search],
  );

  const setQuery = useCallback(
    (next: ArticleQuery, options: SetQueryOptions = {}) =>
      setSearchParams(toSearchParams(next), { replace: options.replace }),
    [setSearchParams],
  );

  return {
    query,
    setQuery,
    isIdle: isIdleQuery(query),
    hasActiveFilters: hasActiveFilters(query),
  };
}
