import {
  EMPTY_PREFERENCES,
  type Preferences,
  type PreferencesStore,
} from "@/domain/types";

// In-memory store for tests: no shared state between tests.
export function createMemoryPreferencesStore(
  initial: Preferences = EMPTY_PREFERENCES,
): PreferencesStore {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(preferences) {
      current = preferences;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
