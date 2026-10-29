export type Theme = "light" | "dark";

// Also read by the inline script in index.html, which runs before the bundle loads.
export const THEME_KEY = "newslens:theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export interface ThemeStore {
  // The reader's choice if there is one, otherwise the system preference.
  get(): Theme;
  set(theme: Theme): void;
  subscribe(listener: () => void): () => void;
}

export function createThemeStore(
  getStorage: () => Storage = () => window.localStorage,
  media: MediaQueryList = window.matchMedia(DARK_QUERY),
): ThemeStore {
  const listeners = new Set<() => void>();
  // Only used when storage is blocked, so the toggle still works for this session.
  let unsavedChoice: Theme | null = null;

  const notify = () => listeners.forEach((listener) => listener());

  // Another tab picked a theme (fires only in other tabs).
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY || event.key === null) notify();
  };

  return {
    get() {
      return (
        readChoice(getStorage) ??
        unsavedChoice ??
        (media.matches ? "dark" : "light")
      );
    },

    set(theme) {
      try {
        getStorage().setItem(THEME_KEY, theme);
      } catch {
        unsavedChoice = theme;
      }
      notify();
    },

    // OS changes only matter while no choice is stored; get() decides.
    subscribe(listener) {
      if (listeners.size === 0) {
        window.addEventListener("storage", handleStorage);
        media.addEventListener("change", notify);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("storage", handleStorage);
          media.removeEventListener("change", notify);
        }
      };
    },
  };
}

// Blocked storage throws on access; invalid values count as "no choice".
function readChoice(getStorage: () => Storage): Theme | null {
  try {
    const value = getStorage().getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

// Presentation only, with no backend to swap in, so a module store rather than an
// injected one (spec 05 §4).
export const themeStore = createThemeStore();
