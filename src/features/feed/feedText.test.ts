import { describe, expect, it } from "vitest";
import { EMPTY_PREFERENCES } from "@/domain/types";
import { describePreferences, getGreeting, hasPreferences } from "./feedText";

const at = (hour: number, minute = 0) => new Date(2026, 9, 29, hour, minute);

describe("getGreeting", () => {
  it.each([
    [at(0), "Good morning"],
    [at(11, 59), "Good morning"],
    [at(12), "Good afternoon"],
    [at(17, 59), "Good afternoon"],
    [at(18), "Good evening"],
    [at(23, 59), "Good evening"],
  ])("%s → %s", (date, greeting) => {
    expect(getGreeting(date)).toBe(greeting);
  });
});

describe("hasPreferences", () => {
  it("is false only when every list is empty", () => {
    expect(hasPreferences(EMPTY_PREFERENCES)).toBe(false);
    expect(hasPreferences({ ...EMPTY_PREFERENCES, authors: ["A"] })).toBe(true);
  });
});

describe("describePreferences", () => {
  it("lists categories, sources and the number of authors", () => {
    expect(
      describePreferences({
        sources: ["guardian", "nyt"],
        categories: ["technology", "science"],
        authors: ["Jane Doe", "John Roe"],
      }),
    ).toBe(
      "Technology and Science from The Guardian and New York Times · following 2 authors",
    );
  });

  it("falls back to all topics and all sources", () => {
    expect(
      describePreferences({ ...EMPTY_PREFERENCES, authors: ["Jane Doe"] }),
    ).toBe("All topics from all sources · following 1 author");
  });

  it("uses a serial comma for three items", () => {
    expect(
      describePreferences({
        ...EMPTY_PREFERENCES,
        categories: ["world", "business", "sports"],
      }),
    ).toBe("World, Business, and Sports from all sources");
  });
});
