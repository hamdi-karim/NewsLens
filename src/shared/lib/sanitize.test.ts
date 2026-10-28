import { describe, expect, it } from "vitest";
import { toHttpUrl, toIsoDate, toPlainText } from "./sanitize";

describe("toPlainText", () => {
  it("strips tags and decodes entities", () => {
    expect(toPlainText("<strong>Analysis:</strong> rates &amp; jobs ")).toBe(
      "Analysis: rates & jobs",
    );
  });

  it("returns undefined for empty input", () => {
    expect(toPlainText(undefined)).toBeUndefined();
    expect(toPlainText(null)).toBeUndefined();
    expect(toPlainText("<p> </p>")).toBeUndefined();
  });
});

describe("toHttpUrl", () => {
  it("keeps absolute http(s) URLs", () => {
    expect(toHttpUrl("https://example.com/a?b=1")).toBe(
      "https://example.com/a?b=1",
    );
    expect(toHttpUrl("http://example.com")).toBe("http://example.com");
  });

  it("rejects other protocols, relative and invalid URLs", () => {
    expect(toHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(toHttpUrl("/relative/path")).toBeUndefined();
    expect(toHttpUrl("not a url")).toBeUndefined();
    expect(toHttpUrl(null)).toBeUndefined();
  });
});

describe("toIsoDate", () => {
  it("normalizes parseable dates to ISO strings", () => {
    expect(toIsoDate("2026-10-28T10:59:57+0000")).toBe(
      "2026-10-28T10:59:57.000Z",
    );
  });

  it("returns undefined for missing or invalid dates", () => {
    expect(toIsoDate(undefined)).toBeUndefined();
    expect(toIsoDate("yesterday")).toBeUndefined();
  });
});
