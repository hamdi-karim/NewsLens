import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it.each([
    ["Fiona Harvey", "FH"],
    ["Madonna", "M"],
    ["Jean-Luc de la Cruz", "JC"],
    ["  sam   sifton ", "SS"],
    ["", ""],
  ])("%j → %j", (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });
});
