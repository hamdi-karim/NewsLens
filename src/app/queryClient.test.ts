import { describe, expect, it } from "vitest";
import { AllSourcesFailedError } from "@/services/aggregator";
import { HttpError, RateLimitError } from "@/shared/lib/http";
import { shouldRetry } from "./queryClient";

describe("shouldRetry", () => {
  it("never retries a rate limit or every source failing", () => {
    expect(shouldRetry(0, new RateLimitError("429"))).toBe(false);
    expect(shouldRetry(0, new AllSourcesFailedError(["nyt"]))).toBe(false);
  });

  it("retries other errors once", () => {
    expect(shouldRetry(0, new HttpError(500, "500"))).toBe(true);
    expect(shouldRetry(1, new HttpError(500, "500"))).toBe(false);
  });
});
