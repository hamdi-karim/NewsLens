import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "@/test/render";
import { THEME_KEY } from "./themeStore";

describe("ThemeToggle", () => {
  it("switches the theme, stores the choice, and flips its label", async () => {
    const user = userEvent.setup();
    renderRoute("/search");
    const root = document.documentElement;

    const toDark = await screen.findByRole("button", {
      name: "Switch to dark theme",
    });
    expect(root).not.toHaveClass("dark");

    await user.click(toDark);

    expect(root).toHaveClass("dark");
    expect(root.style.colorScheme).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");

    await user.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(root).not.toHaveClass("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });
});
