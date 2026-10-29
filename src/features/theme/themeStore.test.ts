import { describe, expect, it, vi } from "vitest";
import { createThemeStore, DARK_QUERY, THEME_KEY } from "./themeStore";

// A media query we can flip, like the OS switching to dark mode.
function fakeMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches,
    media: DARK_QUERY,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  } as unknown as MediaQueryList;
  const change = (next: boolean) => {
    Object.assign(media, { matches: next });
    listeners.forEach((listener) => listener());
  };
  return { media, change };
}

function memoryStorage(): Storage {
  localStorage.clear();
  return localStorage;
}

const blockedStorage = (): Storage => {
  throw new DOMException("Blocked", "SecurityError");
};

describe("themeStore", () => {
  it("follows the system preference while nothing is stored", () => {
    expect(createThemeStore(memoryStorage, fakeMedia(false).media).get()).toBe(
      "light",
    );
    expect(createThemeStore(memoryStorage, fakeMedia(true).media).get()).toBe(
      "dark",
    );
  });

  it("prefers the stored choice over the system", () => {
    const storage = memoryStorage();
    const store = createThemeStore(() => storage, fakeMedia(true).media);

    store.set("light");

    expect(storage.getItem(THEME_KEY)).toBe("light");
    expect(store.get()).toBe("light");
  });

  it("ignores an invalid stored value", () => {
    const storage = memoryStorage();
    storage.setItem(THEME_KEY, "purple");

    expect(createThemeStore(() => storage, fakeMedia(true).media).get()).toBe(
      "dark",
    );
  });

  it("keeps working for the session when storage is blocked", () => {
    const store = createThemeStore(blockedStorage, fakeMedia(false).media);

    expect(store.get()).toBe("light");
    expect(() => store.set("dark")).not.toThrow();
    expect(store.get()).toBe("dark");
  });

  it("notifies on set, on OS changes, and on other tabs", () => {
    const storage = memoryStorage();
    const { media, change } = fakeMedia(false);
    const store = createThemeStore(() => storage, media);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    change(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toBe("dark");

    store.set("light");
    expect(listener).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY }));
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    change(false);
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
