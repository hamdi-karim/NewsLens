import { describe, expect, it, vi } from "vitest";
import { EMPTY_PREFERENCES, type Preferences } from "@/domain/types";
import {
  createLocalPreferencesStore,
  PREFERENCES_KEY,
} from "./localPreferencesStore";

const PREFS: Preferences = {
  sources: ["guardian"],
  categories: ["technology"],
  authors: ["Jane Doe"],
};

// Minimal in-memory Storage, so each test starts clean.
function createStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

function throwingStorage(): Storage {
  const storage = createStorage();
  const fail = () => {
    throw new DOMException("Blocked", "SecurityError");
  };
  storage.getItem = fail;
  storage.setItem = fail;
  return storage;
}

describe("createLocalPreferencesStore", () => {
  it("returns empty preferences when nothing is stored", () => {
    expect(createLocalPreferencesStore(createStorage()).get()).toEqual(
      EMPTY_PREFERENCES,
    );
  });

  it("round-trips preferences through storage", () => {
    const storage = createStorage();
    createLocalPreferencesStore(storage).set(PREFS);

    // A new store (e.g. after a reload) reads the same value.
    expect(createLocalPreferencesStore(storage).get()).toEqual(PREFS);
  });

  it("returns the same object until the value changes", () => {
    const store = createLocalPreferencesStore(createStorage());
    store.set(PREFS);
    const first = store.get();

    expect(store.get()).toBe(first);
    store.set({ ...PREFS, authors: [] });
    expect(store.get()).not.toBe(first);
  });

  it("sanitizes on write and on read", () => {
    const storage = createStorage({
      [PREFERENCES_KEY]: JSON.stringify({ sources: ["bbc", "nyt"] }),
    });
    const store = createLocalPreferencesStore(storage);

    expect(store.get()).toEqual({ ...EMPTY_PREFERENCES, sources: ["nyt"] });

    store.set({ ...EMPTY_PREFERENCES, authors: [" a ", "A"] });
    expect(JSON.parse(storage.getItem(PREFERENCES_KEY) ?? "")).toEqual({
      ...EMPTY_PREFERENCES,
      authors: ["a"],
    });
  });

  it("falls back to empty preferences on corrupt JSON", () => {
    const storage = createStorage({ [PREFERENCES_KEY]: "{bad" });

    expect(createLocalPreferencesStore(storage).get()).toEqual(
      EMPTY_PREFERENCES,
    );
  });

  it("falls back to empty preferences when storage is blocked, and rethrows on write", () => {
    const store = createLocalPreferencesStore(throwingStorage());

    expect(store.get()).toEqual(EMPTY_PREFERENCES);
    expect(() => store.set(PREFS)).toThrow("Blocked");
  });

  it("notifies listeners on set until they unsubscribe", () => {
    const store = createLocalPreferencesStore(createStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set(PREFS);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.set(EMPTY_PREFERENCES);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies listeners when another tab changes the key", () => {
    const storage = createStorage();
    const store = createLocalPreferencesStore(storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    // The other tab writes, then the browser fires `storage` here.
    storage.setItem(PREFERENCES_KEY, JSON.stringify(PREFS));
    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    window.dispatchEvent(new StorageEvent("storage", { key: PREFERENCES_KEY }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toEqual(PREFS);
    unsubscribe();
  });
});
