import type { SourceId } from "@/domain/types";
import { SOURCES } from "@/sources/registry";

// The only place source colors are defined (tokens live in index.css).
const BADGE_CLASS_NAMES: Record<SourceId, string> = {
  guardian: "bg-source-guardian text-white",
  nyt: "bg-source-nyt text-white",
  newsapi: "bg-source-newsapi text-white",
};

export interface SourceDisplay {
  id: SourceId;
  label: string;
  badgeClassName: string;
}

// Registered sources in priority order, with their display details.
export const SOURCE_DISPLAYS: readonly SourceDisplay[] = SOURCES.map(
  (source) => ({
    id: source.id,
    label: source.label,
    badgeClassName: BADGE_CLASS_NAMES[source.id],
  }),
);

export function getSourceDisplay(id: SourceId): SourceDisplay {
  return (
    SOURCE_DISPLAYS.find((source) => source.id === id) ?? {
      id,
      label: id,
      badgeClassName: BADGE_CLASS_NAMES[id],
    }
  );
}
