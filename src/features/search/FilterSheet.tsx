import { SlidersHorizontal } from "lucide-react";
import type { ArticleQuery } from "@/domain/types";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { FilterPanel } from "./FilterPanel";
import { countActiveFilters } from "./searchParams";

interface FilterSheetProps {
  query: ArticleQuery;
  onQueryChange: (query: ArticleQuery) => void;
}

// Mobile home of the filter panel. Changes apply live, like the desktop sidebar, so
// "Show results" only closes the sheet. Radix handles focus trap, Esc, and focus return.
export function FilterSheet({ query, onQueryChange }: FilterSheetProps) {
  const count = countActiveFilters(query);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          aria-label={count > 0 ? `Filters, ${count} active` : "Filters"}
        >
          <SlidersHorizontal aria-hidden="true" />
          Filters
          {count > 0 && (
            <span className="ml-0.5 rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85svh] gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Results update as you change them.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 overflow-y-auto p-4">
          <FilterPanel query={query} onQueryChange={onQueryChange} />
        </div>
        <SheetFooter className="border-t">
          <SheetClose asChild>
            <Button size="lg">Show results</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
