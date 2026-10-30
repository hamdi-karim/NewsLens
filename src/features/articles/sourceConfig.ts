import type { SourceId } from "@/domain/types";
import { SOURCES } from "@/sources/registry";

// The only place source colors are defined (tokens live in index.css).
const BADGE_CLASS_NAMES: Record<SourceId, string> = {
  guardian: "bg-source-guardian text-white",
  nyt: "bg-source-nyt text-white",
  newsapi: "bg-source-newsapi text-white",
};

// Sets --chip-color for filter and preference chips (see shared/ui/chip).
const CHIP_COLOR_CLASS_NAMES: Record<SourceId, string> = {
  guardian: "[--chip-color:var(--color-source-guardian-accent)]",
  nyt: "[--chip-color:var(--color-source-nyt-accent)]",
  newsapi: "[--chip-color:var(--color-source-newsapi-accent)]",
};

export interface SourceDisplay {
  id: SourceId;
  label: string;
  badgeClassName: string;
  chipColorClassName: string;
}

// Registered sources in priority order, with their display details.
export const SOURCE_DISPLAYS: readonly SourceDisplay[] = SOURCES.map(
  (source) => ({
    id: source.id,
    label: source.label,
    badgeClassName: BADGE_CLASS_NAMES[source.id],
    chipColorClassName: CHIP_COLOR_CLASS_NAMES[source.id],
  }),
);

export function getSourceDisplay(id: SourceId): SourceDisplay {
  return (
    SOURCE_DISPLAYS.find((source) => source.id === id) ?? {
      id,
      label: id,
      badgeClassName: BADGE_CLASS_NAMES[id],
      chipColorClassName: CHIP_COLOR_CLASS_NAMES[id],
    }
  );
}
