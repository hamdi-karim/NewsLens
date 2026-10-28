import { setupServer } from "msw/node";

// Per-source handlers are added as adapters land (Spec 02).
export const server = setupServer();
