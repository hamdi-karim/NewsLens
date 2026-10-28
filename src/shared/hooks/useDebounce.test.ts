import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("emits the value only after it stops changing for the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: "a" } },
    );
    expect(result.current).toBe("a");

    rerender({ value: "ab" });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: "abc" });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("a"); // timer restarted by "abc"

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });
});
