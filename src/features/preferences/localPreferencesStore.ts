import {
  EMPTY_PREFERENCES,
  type Preferences,
  type PreferencesStore,
} from "@/domain/types";
import { sanitizePreferences } from "./sanitizePreferences";

// Versioned, so a future shape change can migrate or ignore old values.
export const PREFERENCES_KEY = "newslens:preferences:v1";

export function createLocalPreferencesStore(
  storage: Storage = window.localStorage,
): PreferencesStore {
  const listeners = new Set<() => void>();
  // Cached by raw string: get() must return the same object until the value changes,
  // or useSyncExternalStore re-renders forever.
  let cachedRaw: string | null = null;
  let cached: Preferences = EMPTY_PREFERENCES;

  const notify = () => listeners.forEach((listener) => listener());

  // Another tab changed the value (fires only in other tabs, never in the writer).
  const handleStorage = (event: StorageEvent) => {
    if (event.key === PREFERENCES_KEY || event.key === null) notify();
  };

  return {
    get() {
      const raw = readRaw(storage);
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cached = parse(raw);
      }
      return cached;
    },

    set(preferences) {
      storage.setItem(
        PREFERENCES_KEY,
        JSON.stringify(sanitizePreferences(preferences)),
      );
      notify();
    },

    subscribe(listener) {
      if (listeners.size === 0) {
        window.addEventListener("storage", handleStorage);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("storage", handleStorage);
        }
      };
    },
  };
}

// Blocked storage (e.g. some private modes) throws on access: treat it as empty.
function readRaw(storage: Storage): string | null {
  try {
    return storage.getItem(PREFERENCES_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Preferences {
  if (raw === null) return EMPTY_PREFERENCES;
  try {
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    return EMPTY_PREFERENCES;
  }
}
