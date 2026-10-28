import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import {
  DATE_PRESETS,
  detectDateSelection,
  presetRange,
  type DateRange,
  type DateSelection,
} from "./datePresets";

const SELECTION_LABELS: Record<DateSelection, string> = {
  any: "Any time",
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
  custom: "Custom range",
};

const SELECTIONS: readonly DateSelection[] = [...DATE_PRESETS, "custom"];

interface DateFilterProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

export function DateFilter({ range, onRangeChange }: DateFilterProps) {
  // "Custom" can be picked before any date is set, so we remember the range it was
  // picked for. Once the range changes (typing a date, Clear all, Back), this no longer
  // matches and the URL decides again.
  const rangeKey = `${range.from ?? ""}|${range.to ?? ""}`;
  const [customPickedFor, setCustomPickedFor] = useState<string | null>(null);
  const selection =
    customPickedFor === rangeKey ? "custom" : detectDateSelection(range);

  const handleSelectionChange = (value: string) => {
    const next = SELECTIONS.find((item) => item === value);
    if (!next) return;
    if (next === "custom") {
      setCustomPickedFor(rangeKey);
    } else {
      setCustomPickedFor(null);
      onRangeChange(presetRange(next));
    }
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-semibold">Date</legend>
      <RadioGroup value={selection} onValueChange={handleSelectionChange}>
        {SELECTIONS.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <RadioGroupItem value={item} id={`date-${item}`} />
            <Label htmlFor={`date-${item}`} className="font-normal">
              {SELECTION_LABELS[item]}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selection === "custom" && (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-from">From</Label>
            <Input
              id="date-from"
              type="date"
              value={range.from ?? ""}
              max={range.to}
              onChange={(event) =>
                onRangeChange({
                  ...range,
                  from: event.target.value || undefined,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-to">To</Label>
            <Input
              id="date-to"
              type="date"
              value={range.to ?? ""}
              min={range.from}
              onChange={(event) =>
                onRangeChange({ ...range, to: event.target.value || undefined })
              }
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
