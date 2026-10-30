import { CATEGORIES, type Category } from "@/domain/types";
import { getCategoryColorClass } from "@/features/articles";
import { toggle } from "@/shared/lib/toggle";
import { cn } from "@/shared/lib/utils";
import { ChipMark, chipClassName } from "@/shared/ui/chip";
import { PreferenceSection } from "./PreferenceSection";

interface CategoryPreferencesProps {
  selected: Category[];
  onChange: (categories: Category[]) => void;
}

// Toggle chips: buttons with aria-pressed, so their on/off state is announced.
export function CategoryPreferences({
  selected,
  onChange,
}: CategoryPreferencesProps) {
  return (
    <PreferenceSection
      title="Preferred categories"
      hint="None selected means all categories."
    >
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const isSelected = selected.includes(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isSelected}
              className={cn(
                chipClassName,
                "cursor-pointer capitalize",
                getCategoryColorClass(category),
              )}
              onClick={() => onChange(toggle(CATEGORIES, selected, category))}
            >
              <ChipMark />
              {category}
            </button>
          );
        })}
      </div>
    </PreferenceSection>
  );
}
