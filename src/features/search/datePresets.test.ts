import { describe, expect, it } from "vitest";
import { detectDateSelection, presetRange } from "./datePresets";

// Local time, so the expected dates don't depend on the machine's time zone.
const NOW = new Date(2026, 9, 28, 15, 30);

describe("presetRange", () => {
  it.each([
    ["any", {}],
    ["today", { from: "2026-10-28", to: "2026-10-28" }],
    ["week", { from: "2026-10-22", to: "2026-10-28" }],
    ["month", { from: "2026-09-29", to: "2026-10-28" }],
  ] as const)("%s → %j", (preset, expected) => {
    expect(presetRange(preset, NOW)).toEqual(expected);
  });
});

describe("detectDateSelection", () => {
  it("matches each preset's range", () => {
    expect(detectDateSelection({}, NOW)).toBe("any");
    expect(
      detectDateSelection({ from: "2026-10-28", to: "2026-10-28" }, NOW),
    ).toBe("today");
    expect(
      detectDateSelection({ from: "2026-10-22", to: "2026-10-28" }, NOW),
    ).toBe("week");
  });

  it("is custom for any other range, including a preset from another day", () => {
    expect(detectDateSelection({ from: "2026-10-01" }, NOW)).toBe("custom");
    expect(
      detectDateSelection({ from: "2026-10-21", to: "2026-10-27" }, NOW),
    ).toBe("custom");
  });
});
