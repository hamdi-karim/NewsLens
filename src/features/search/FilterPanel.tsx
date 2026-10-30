import { CATEGORIES, type ArticleQuery } from "@/domain/types";
import { getCategoryColorClass, SOURCE_DISPLAYS } from "@/features/articles";
import { toggle } from "@/shared/lib/toggle";
import { Button } from "@/shared/ui/button";
import { ChipCheckbox } from "@/shared/ui/chip";
import { DateFilter } from "./DateFilter";
import { clearFilters, hasActiveFilters } from "./searchParams";

interface FilterPanelProps {
  query: ArticleQuery;
  onQueryChange: (query: ArticleQuery) => void;
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

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Category</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            // The chip's text is its accessible name, so no separate label or id.
            <ChipCheckbox
              key={category}
              className={`capitalize ${getCategoryColorClass(category)}`}
              checked={query.categories.includes(category)}
              onCheckedChange={() =>
                onQueryChange({
                  ...query,
                  categories: toggle(CATEGORIES, query.categories, category),
                })
              }
            >
              {category}
            </ChipCheckbox>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Source</legend>
        <div className="flex flex-wrap gap-2">
          {SOURCE_DISPLAYS.map((source) => {
            const isChecked = query.sources.includes(source.id);
            return (
              <ChipCheckbox
                key={source.id}
                className={source.chipColorClassName}
                checked={isChecked}
                // At least one source must stay selected.
                disabled={isChecked && isLastSource}
                onCheckedChange={() =>
                  onQueryChange({
                    ...query,
                    sources: toggle(sourceIds, query.sources, source.id),
                  })
                }
              >
                {source.label}
              </ChipCheckbox>
            );
          })}
        </div>
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
