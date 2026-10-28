import { describe, expect, it } from "vitest";
import { SOURCE_IDS } from "@/domain/types";
import { SOURCES } from "./registry";

describe("SOURCES", () => {
  it("registers every source id exactly once, in dedupe priority order", () => {
    expect(SOURCES.map((source) => source.id)).toEqual([...SOURCE_IDS]);
  });
});
