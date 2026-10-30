import { useDebounce } from "@/shared/hooks/useDebounce";
import { FilterPanel } from "./FilterPanel";
import { FilterSheet } from "./FilterSheet";
import { clearFilters } from "./searchParams";
import { SearchResults } from "./SearchResults";
import { useSearchQuery } from "./useSearchQuery";

// Several quick filter clicks make one request per source, not one per click: an
// aborted request has already counted against the providers' quotas.
const RESULTS_DEBOUNCE_MS = 300;

export function SearchPage() {
  const { query, setQuery, hasActiveFilters } = useSearchQuery();
  // The filters show the live query; only the results wait for clicking to pause.
  const resultsQuery = useDebounce(query, RESULTS_DEBOUNCE_MS);
  const heading = query.keyword ? `Results for “${query.keyword}”` : "Search";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      {/* Sidebar from lg; below that the same panel lives in a bottom sheet. */}
      <aside aria-label="Filters" className="hidden shrink-0 lg:block lg:w-56">
        {/* Filter changes push a history entry, so Back undoes them. */}
        <FilterPanel query={query} onQueryChange={setQuery} />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="min-w-0 text-2xl font-semibold wrap-break-word">
            {heading}
          </h1>
          <div className="shrink-0 lg:hidden">
            <FilterSheet query={query} onQueryChange={setQuery} />
          </div>
        </div>
        <SearchResults
          query={resultsQuery}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => setQuery(clearFilters(query))}
        />
      </section>
    </div>
  );
}
