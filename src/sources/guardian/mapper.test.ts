import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/guardian/search.json";
import { mapGuardianResult } from "./mapper";
import type { GuardianResult } from "./types";

const [first, withoutThumbnail, withHtml] = fixture.response.results;

describe("mapGuardianResult", () => {
  it("maps a real result to an Article", () => {
    expect(mapGuardianResult(first as GuardianResult)).toEqual({
      id: "guardian:australia-news/2026/oct/28/menindee-lakes-water-levels-drop-mass-fish-death-fears",
      source: "guardian",
      title:
        "Menindee Lakes water levels drop to lowest in five years as experts warn of mass fish deaths",
      description:
        "NSW government imposes water restrictions after Menindee water volumes fall below 2021 levels",
      url: "https://www.theguardian.com/australia-news/2026/oct/28/menindee-lakes-water-levels-drop-mass-fish-death-fears",
      imageUrl:
        "https://media.guim.co.uk/c3335a7db319a4242e148d1c0c6a6d1d24937c4c/144_0_1410_1128/500.jpg",
      author: "Lisa Cox Environment and climate correspondent",
      category: undefined,
      publishedAt: "2026-10-28T14:00:07.000Z",
    });
  });

  it("omits the image when there is no thumbnail", () => {
    expect(
      mapGuardianResult(withoutThumbnail as GuardianResult)?.imageUrl,
    ).toBeUndefined();
  });

  it("turns HTML trail text into plain text", () => {
    expect(mapGuardianResult(withHtml as GuardianResult)?.description).toMatch(
      /^Analysis: The author believes .* & more$/,
    );
  });

  it("maps a known section to its category", () => {
    expect(mapGuardianResult({ ...first, sectionId: "sport" })?.category).toBe(
      "sports",
    );
  });

  it.each([
    ["title", { webTitle: "  " }],
    ["URL", { webUrl: "javascript:alert(1)" }],
    ["date", { webPublicationDate: "not a date" }],
    ["id", { id: undefined }],
  ])("drops results without a valid %s", (_, override) => {
    expect(mapGuardianResult({ ...first, ...override })).toBeUndefined();
  });

  it("does not crash on an empty object", () => {
    expect(mapGuardianResult({})).toBeUndefined();
  });
});
