import { useContext, useSyncExternalStore } from "react";
import { PreferencesStoreContext } from "./preferencesContext";

// Reads the injected store, never localStorage directly, so the storage can be swapped.
export function usePreferences() {
  const store = useContext(PreferencesStoreContext);
  if (!store) {
    throw new Error(
      "usePreferences must be used inside PreferencesStoreContext",
    );
  }

  const preferences = useSyncExternalStore(store.subscribe, store.get);
  return { preferences, setPreferences: store.set };
}
