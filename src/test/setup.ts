import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

// jsdom has no matchMedia; the theme store reads it at import. Light unless a test overrides it.
vi.stubGlobal(
  "matchMedia",
  (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList,
);

// Any request without a handler fails the test: no real network calls in tests.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  // RTL only auto-cleans when Vitest globals are on.
  cleanup();
  localStorage.clear(); // theme choice (the module theme store reads it live)
  server.resetHandlers();
});

afterAll(() => server.close());
