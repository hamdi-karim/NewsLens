import type { SourceId } from "@/domain/types";
import { SOURCE_DISPLAYS } from "@/features/articles";
import { toggle } from "@/shared/lib/toggle";
import { cn } from "@/shared/lib/utils";
import { ChipCheckbox } from "@/shared/ui/chip";
import { PreferenceSection } from "./PreferenceSection";

const SOURCE_IDS = SOURCE_DISPLAYS.map((source) => source.id);

interface SourcePreferencesProps {
  selected: SourceId[];
  onChange: (sources: SourceId[]) => void;
}

export function SourcePreferences({
  selected,
  onChange,
}: SourcePreferencesProps) {
  return (
    <PreferenceSection
      title="Preferred sources"
      hint="None selected means all sources."
    >
      <div className="flex flex-wrap gap-2">
        {SOURCE_DISPLAYS.map((source) => (
          <ChipCheckbox
            key={source.id}
            className={cn("cursor-pointer", source.chipColorClassName)}
            checked={selected.includes(source.id)}
            onCheckedChange={() =>
              onChange(toggle(SOURCE_IDS, selected, source.id))
            }
          >
            {source.label}
          </ChipCheckbox>
        ))}
      </div>
    </PreferenceSection>
  );
}
