import { FilterPanel } from "./FilterPanel";
import { clearFilters } from "./searchParams";
import { SearchResults } from "./SearchResults";
import { useSearchQuery } from "./useSearchQuery";

export function SearchPage() {
  const { query, setQuery, hasActiveFilters } = useSearchQuery();
  const heading = query.keyword ? `Results for “${query.keyword}”` : "Search";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <aside aria-label="Filters" className="shrink-0 lg:w-56">
        {/* Filter changes push a history entry, so Back undoes them. */}
        <FilterPanel query={query} onQueryChange={setQuery} />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <SearchResults
          query={query}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => setQuery(clearFilters(query))}
        />
      </section>
    </div>
  );
}
