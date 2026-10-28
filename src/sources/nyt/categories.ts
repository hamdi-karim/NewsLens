import { createCategoryLookup, type SectionMap } from "../categoryLookup";

// App category → NYT `section.name` values. NYT has no politics section; U.S. is the closest.
export const NYT_SECTIONS: SectionMap = {
  world: ["World"],
  business: ["Business"],
  technology: ["Technology"],
  science: ["Science"],
  health: ["Health"],
  sports: ["Sports"],
  culture: ["Arts"],
  politics: ["U.S."],
};

export const nytCategoryOf = createCategoryLookup(NYT_SECTIONS);
