import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

// Any request without a handler fails the test: no real network calls in tests.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  // RTL only auto-cleans when Vitest globals are on.
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
