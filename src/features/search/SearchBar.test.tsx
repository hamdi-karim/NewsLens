import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "@/test/render";

const searchBox = () =>
  screen.getByRole("searchbox", { name: "Search articles" });

describe("SearchBar", () => {
  it("navigates to /search after typing pauses, and Back returns to the previous page", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    await user.type(searchBox(), "climate");

    await waitFor(() => expect(router.state.location.pathname).toBe("/search"));
    expect(router.state.location.search).toBe("?q=climate");

    await act(() => router.navigate(-1));
    expect(router.state.location.pathname).toBe("/");
    expect(searchBox()).toHaveValue("");
  });

  it("edits the keyword on /search without adding history entries, keeping filters", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/search?q=ai&categories=science");

    await user.clear(searchBox());
    await user.type(searchBox(), "space");

    await waitFor(() =>
      expect(router.state.location.search).toBe("?q=space&categories=science"),
    );
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("submits immediately on Enter", async () => {
    const user = userEvent.setup({ delay: null });
    const { router } = renderRoute("/");

    await user.type(searchBox(), "ai{Enter}");

    expect(router.state.location.search).toBe("?q=ai");
  });

  it("shows the keyword when the URL changes from outside", async () => {
    const { router } = renderRoute("/search?q=ai");
    expect(searchBox()).toHaveValue("ai");

    await act(() => router.navigate("/search?q=climate"));

    expect(searchBox()).toHaveValue("climate");
  });
});
