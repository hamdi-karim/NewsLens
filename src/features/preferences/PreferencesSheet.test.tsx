import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EMPTY_PREFERENCES } from "@/domain/types";
import { renderRoute } from "@/test/render";

async function openSheet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Preferences" }));
  return screen.getByRole("dialog", { name: "Preferences" });
}

describe("PreferencesSheet", () => {
  it("saves from the header, shows the toast, and closes without navigating", async () => {
    const user = userEvent.setup();
    const { router, preferencesStore } = renderRoute("/search");

    const sheet = await openSheet(user);
    await user.click(within(sheet).getByRole("button", { name: "science" }));
    await user.click(
      within(sheet).getByRole("button", { name: "Save preferences" }),
    );

    expect(preferencesStore.get()).toEqual({
      ...EMPTY_PREFERENCES,
      categories: ["science"],
    });
    expect(await screen.findByText("Preferences saved")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(router.state.location.pathname).toBe("/search");
  });

  it("discards an unsaved draft when closed", async () => {
    const user = userEvent.setup();
    const { preferencesStore } = renderRoute("/search");

    let sheet = await openSheet(user);
    await user.click(within(sheet).getByRole("button", { name: "science" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    sheet = await openSheet(user);
    expect(
      within(sheet).getByRole("button", { name: "science" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(preferencesStore.get()).toEqual(EMPTY_PREFERENCES);
  });
});
