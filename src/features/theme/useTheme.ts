import { useEffect, useSyncExternalStore } from "react";
import { themeStore } from "./themeStore";

export function useTheme() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get);

  // Idempotent, so it doesn't matter how many components use the hook. color-scheme
  // also themes native controls (date inputs, scrollbars).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => themeStore.set(theme === "dark" ? "light" : "dark");

  return { theme, toggleTheme };
}
