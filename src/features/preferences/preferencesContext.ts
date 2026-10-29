import { createContext } from "react";
import type { PreferencesStore } from "@/domain/types";

// No default: the app passes the localStorage store, tests an in-memory one.
export const PreferencesStoreContext = createContext<PreferencesStore | null>(
  null,
);
