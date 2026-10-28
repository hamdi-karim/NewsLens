import { describe, expect, it } from "vitest";
import { newsApiCategoryCalls } from "./categories";

describe("newsApiCategoryCalls", () => {
  it("makes one call per distinct NewsAPI category, tagged with the first app category", () => {
    expect(newsApiCategoryCalls(["politics", "culture", "world"])).toEqual([
      { category: "general", appCategory: "politics" },
      { category: "entertainment", appCategory: "culture" },
    ]);
  });

  it("makes no category calls without categories", () => {
    expect(newsApiCategoryCalls([])).toEqual([]);
  });
});
