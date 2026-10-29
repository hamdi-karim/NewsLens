import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "@/test/render";

describe("app routes", () => {
  it.each([
    ["/", /^Good (morning|afternoon|evening)$/],
    ["/search", "Search"],
    ["/preferences", "Preferences"],
  ])("renders %s", async (path, heading) => {
    renderRoute(path);

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Main" }),
    ).toBeInTheDocument();
  });

  it("renders Not Found for an unknown route", async () => {
    renderRoute("/does-not-exist");

    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });

  it("navigates between pages with the header links", async () => {
    const user = userEvent.setup();
    renderRoute("/");
    const nav = await screen.findByRole("navigation", { name: "Main" });

    await user.click(within(nav).getByRole("link", { name: "Search" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Search" }),
    ).toBeInTheDocument();

    await user.click(within(nav).getByRole("link", { name: "For You" }));
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /^Good (morning|afternoon|evening)$/,
      }),
    ).toBeInTheDocument();
  });
});
