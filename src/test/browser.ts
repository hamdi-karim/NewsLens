import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Dev mock mode (VITE_USE_MOCKS=true): same handlers and fixtures as the tests.
export const worker = setupWorker(...handlers);
