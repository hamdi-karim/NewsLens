import { createCategoryLookup, type SectionMap } from "../categoryLookup";

// App category → Guardian section ids.
export const GUARDIAN_SECTIONS: SectionMap = {
  world: ["world"],
  business: ["business"],
  technology: ["technology"],
  science: ["science"],
  health: ["society"],
  sports: ["sport"],
  culture: ["culture"],
  politics: ["politics"],
};

export const guardianCategoryOf = createCategoryLookup(GUARDIAN_SECTIONS);
