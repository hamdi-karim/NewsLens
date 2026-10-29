import type { Preferences, SourceId } from "@/domain/types";
import { SOURCE_DISPLAYS } from "@/features/articles";

const listFormat = new Intl.ListFormat("en", { type: "conjunction" });

// Local time: "Good morning" before 12:00, "Good afternoon" before 18:00.
export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function hasPreferences(preferences: Preferences): boolean {
  return (
    preferences.sources.length > 0 ||
    preferences.categories.length > 0 ||
    preferences.authors.length > 0
  );
}

// "Technology and Science from The Guardian · following 2 authors"
export function describePreferences(preferences: Preferences): string {
  const { sources, categories, authors } = preferences;
  const topics =
    categories.length > 0
      ? listFormat.format(categories.map(capitalize))
      : "All topics";
  const from =
    sources.length > 0
      ? listFormat.format(sources.map(sourceLabel))
      : "all sources";
  const following =
    authors.length > 0
      ? ` · following ${authors.length} ${authors.length === 1 ? "author" : "authors"}`
      : "";
  return `${topics} from ${from}${following}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function sourceLabel(id: SourceId): string {
  return SOURCE_DISPLAYS.find((source) => source.id === id)?.label ?? id;
}
