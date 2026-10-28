import { CATEGORIES, type ArticleQuery } from "@/domain/types";
import { SOURCE_DISPLAYS } from "@/features/articles";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { DateFilter } from "./DateFilter";
import { clearFilters, hasActiveFilters } from "./searchParams";

interface FilterPanelProps {
  query: ArticleQuery;
  onQueryChange: (query: ArticleQuery) => void;
}

// Adds or removes `item`, keeping the canonical order of `allowed`.
function toggle<T>(allowed: readonly T[], selected: T[], item: T): T[] {
  const isSelected = selected.includes(item);
  return allowed.filter((value) =>
    value === item ? !isSelected : selected.includes(value),
  );
}

export function FilterPanel({ query, onQueryChange }: FilterPanelProps) {
  const sourceIds = SOURCE_DISPLAYS.map((source) => source.id);
  const isLastSource = query.sources.length === 1;

  return (
    <div className="flex flex-col gap-6">
      <DateFilter
        range={{ from: query.from, to: query.to }}
        // Both fields explicitly: "Any time" is `{}`, and spreading it would keep the old dates.
        onRangeChange={(range) =>
          onQueryChange({ ...query, from: range.from, to: range.to })
        }
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-3 text-sm font-semibold">Category</legend>
        {CATEGORIES.map((category) => (
          <div key={category} className="flex items-center gap-2">
            <Checkbox
              id={`category-${category}`}
              checked={query.categories.includes(category)}
              onCheckedChange={() =>
                onQueryChange({
                  ...query,
                  categories: toggle(CATEGORIES, query.categories, category),
                })
              }
            />
            <Label
              htmlFor={`category-${category}`}
              className="font-normal capitalize"
            >
              {category}
            </Label>
          </div>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-3 text-sm font-semibold">Source</legend>
        {SOURCE_DISPLAYS.map((source) => {
          const isChecked = query.sources.includes(source.id);
          return (
            <div key={source.id} className="flex items-center gap-2">
              <Checkbox
                id={`source-${source.id}`}
                checked={isChecked}
                // At least one source must stay selected.
                disabled={isChecked && isLastSource}
                onCheckedChange={() =>
                  onQueryChange({
                    ...query,
                    sources: toggle(sourceIds, query.sources, source.id),
                  })
                }
              />
              <Label htmlFor={`source-${source.id}`} className="font-normal">
                <span
                  aria-hidden="true"
                  className={cn("size-2.5 rounded-full", source.badgeClassName)}
                />
                {source.label}
              </Label>
            </div>
          );
        })}
      </fieldset>

      {hasActiveFilters(query) && (
        <Button
          variant="link"
          className="self-start px-0"
          onClick={() => onQueryChange(clearFilters(query))}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}
