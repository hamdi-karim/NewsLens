import { createCategoryLookup, type SectionMap } from "../categoryLookup";

// App category → Guardian section ids. Arts articles mostly live in their own
// sections (film, music, books…), not under `culture`.
export const GUARDIAN_SECTIONS: SectionMap = {
  world: ["world"],
  business: ["business"],
  technology: ["technology"],
  science: ["science"],
  health: ["society"],
  sports: ["sport"],
  culture: [
    "culture",
    "film",
    "music",
    "books",
    "tv-and-radio",
    "artanddesign",
    "stage",
  ],
  politics: ["politics"],
};

export const guardianCategoryOf = createCategoryLookup(GUARDIAN_SECTIONS);
