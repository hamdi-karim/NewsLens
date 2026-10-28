import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "./index.css";

// Dev mock mode: serve /api/* from fixtures. Both checks are static, so production
// builds drop the mock code entirely.
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== "true") return;
  const { worker } = await import("@/test/browser");
  await worker.start({ onUnhandledFrame: "bypass" });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

await enableMocking();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
