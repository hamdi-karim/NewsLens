import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "@/test/render";

describe("AppLayout", () => {
  it("makes the skip link the first tab stop and moves focus to main", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/search");
    await screen.findByRole("heading", { level: 1, name: "Search" });

    await user.tab();
    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    expect(skipLink).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
    // Focus moved without adding #main to the URL.
    expect(router.state.location.hash).toBe("");
  });

  it("names the icon nav links and marks the current page", async () => {
    renderRoute("/search");
    const nav = await screen.findByRole("navigation", { name: "Main" });

    expect(within(nav).getByRole("link", { name: "For You" })).toBeVisible();
    expect(within(nav).getByRole("link", { name: "Search" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("offers the preferences sheet everywhere except on /preferences", async () => {
    renderRoute("/preferences");
    await screen.findByRole("heading", { level: 1, name: "Preferences" });

    expect(screen.queryByRole("button", { name: "Preferences" })).toBeNull();
  });
});
