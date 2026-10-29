import type { SourceId } from "@/domain/types";
import { SOURCE_DISPLAYS } from "@/features/articles";
import { toggle } from "@/shared/lib/toggle";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SOURCE_DISPLAYS.map((source) => (
          <Label
            key={source.id}
            htmlFor={`pref-source-${source.id}`}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted/50"
          >
            <Checkbox
              id={`pref-source-${source.id}`}
              checked={selected.includes(source.id)}
              onCheckedChange={() =>
                onChange(toggle(SOURCE_IDS, selected, source.id))
              }
            />
            <span
              aria-hidden="true"
              className={cn("size-2.5 rounded-full", source.badgeClassName)}
            />
            {source.label}
          </Label>
        ))}
      </div>
    </PreferenceSection>
  );
}
