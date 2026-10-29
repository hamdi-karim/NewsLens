import { CATEGORIES, type Category } from "@/domain/types";
import { toggle } from "@/shared/lib/toggle";
import { Button } from "@/shared/ui/button";
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
            <Button
              key={category}
              type="button"
              variant={isSelected ? "default" : "outline"}
              aria-pressed={isSelected}
              className="rounded-full capitalize"
              onClick={() => onChange(toggle(CATEGORIES, selected, category))}
            >
              {category}
            </Button>
          );
        })}
      </div>
    </PreferenceSection>
  );
}
