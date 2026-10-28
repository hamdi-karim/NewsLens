import { format, subDays } from "date-fns";

export const DATE_PRESETS = ["any", "today", "week", "month"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];
// "custom" is any range that isn't a preset; it's derived, never stored.
export type DateSelection = DatePreset | "custom";

export interface DateRange {
  from?: string;
  to?: string;
}

// Days back from today (inclusive) per preset.
const PRESET_DAYS: Record<Exclude<DatePreset, "any">, number> = {
  today: 0,
  week: 6,
  month: 29,
};

const toDateString = (date: Date) => format(date, "yyyy-MM-dd");

// Absolute dates in the reader's local calendar, written to the URL as `from` / `to`.
export function presetRange(preset: DatePreset, now = new Date()): DateRange {
  if (preset === "any") return {};
  return {
    from: toDateString(subDays(now, PRESET_DAYS[preset])),
    to: toDateString(now),
  };
}

// Which radio is checked: the preset whose range matches today, otherwise "custom".
export function detectDateSelection(
  range: DateRange,
  now = new Date(),
): DateSelection {
  const match = DATE_PRESETS.find((preset) => {
    const candidate = presetRange(preset, now);
    return candidate.from === range.from && candidate.to === range.to;
  });
  return match ?? "custom";
}
