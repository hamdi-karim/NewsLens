import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_PREFERENCES, type Preferences } from "@/domain/types";
import { renderRoute } from "@/test/render";
import { server } from "@/test/server";

const SAVED: Preferences = {
  sources: ["nyt"],
  categories: ["science"],
  authors: ["Jane Doe"],
};

describe("PreferencesPage", () => {
  it("shows the saved preferences", () => {
    renderRoute("/preferences", { preferences: SAVED });

    expect(
      screen.getByRole("checkbox", { name: "New York Times" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "The Guardian" }),
    ).not.toBeChecked();
    expect(screen.getByRole("button", { name: "science" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const followed = screen.getByRole("list", { name: "Followed authors" });
    expect(within(followed).getByText("Jane Doe")).toBeInTheDocument();
    // Nothing changed yet.
    expect(
      screen.getByRole("button", { name: "Save preferences" }),
    ).toBeDisabled();
  });

  it("saves the draft, shows a toast and returns to the feed", async () => {
    const user = userEvent.setup();
    const { router, preferencesStore } = renderRoute("/preferences");

    await user.click(screen.getByRole("checkbox", { name: "The Guardian" }));
    await user.click(screen.getByRole("button", { name: "technology" }));
    await user.click(screen.getByRole("button", { name: "world" }));
    // Nothing is stored until Save.
    expect(preferencesStore.get()).toEqual(EMPTY_PREFERENCES);

    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(preferencesStore.get()).toEqual({
      sources: ["guardian"],
      categories: ["world", "technology"], // canonical order
      authors: [],
    });
    expect(await screen.findByText("Preferences saved")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("adds authors with Enter, ignores duplicates, and removes them", async () => {
    const user = userEvent.setup();
    renderRoute("/preferences", { preferences: SAVED });
    const input = screen.getByRole("textbox", { name: "Author name" });

    await user.type(input, "  John   Roe {Enter}");
    await user.type(input, "jane doe{Enter}");
    await user.type(input, "   {Enter}");

    const followed = screen.getByRole("list", { name: "Followed authors" });
    expect(
      within(followed)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Jane Doe", "John Roe"]);
    expect(input).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Remove Jane Doe" }));
    expect(within(followed).queryByText("Jane Doe")).toBeNull();
    // The remove button is gone, so focus moves to the input instead of the page.
    expect(input).toHaveFocus();
  });

  it("suggests authors from articles already loaded, without fetching", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/");
    await screen.findByText(/^\d+ articles$/);
    const onRequest = vi.fn();
    server.events.on("request:start", onRequest);

    await router.navigate("/preferences");

    const suggestions = await screen.findByRole("list", {
      name: "Suggested authors",
    });
    expect(onRequest).not.toHaveBeenCalled();
    server.events.removeAllListeners();
    await user.click(
      within(suggestions).getByRole("button", { name: "Follow Fiona Harvey" }),
    );

    const followed = screen.getByRole("list", { name: "Followed authors" });
    expect(within(followed).getByText("Fiona Harvey")).toBeInTheDocument();
    // A followed author is no longer suggested.
    expect(
      within(suggestions).queryByRole("button", {
        name: "Follow Fiona Harvey",
      }),
    ).toBeNull();
  });

  it("shows no suggestions when nothing was loaded", () => {
    renderRoute("/preferences");

    expect(
      screen.queryByRole("list", { name: "Suggested authors" }),
    ).toBeNull();
    expect(screen.getByRole("textbox", { name: "Author name" })).toBeEnabled();
  });

  it("resets the draft to defaults, applied on Save", async () => {
    const user = userEvent.setup();
    const { preferencesStore } = renderRoute("/preferences", {
      preferences: SAVED,
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(
      screen.getByRole("checkbox", { name: "New York Times" }),
    ).not.toBeChecked();
    expect(preferencesStore.get()).toEqual(SAVED);

    await user.click(screen.getByRole("button", { name: "Save preferences" }));
    expect(preferencesStore.get()).toEqual(EMPTY_PREFERENCES);
  });

  it("keeps the draft and shows an error when saving fails", async () => {
    const user = userEvent.setup();
    const { router, preferencesStore } = renderRoute("/preferences");
    vi.spyOn(preferencesStore, "set").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    await user.click(screen.getByRole("button", { name: "health" }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(
      await screen.findByText("Couldn't save your preferences"),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/preferences");
    expect(screen.getByRole("button", { name: "health" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
