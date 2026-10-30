import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderRoute } from "@/test/render";

// A page that throws while rendering. Mocked in its own file, since vi.mock is per file.
vi.mock("@/features/feed/FeedHeader", () => ({
  FeedHeader: () => {
    throw new Error("Boom");
  },
}));

describe("route errors", () => {
  it("shows a page error inside the layout, so the nav keeps working", async () => {
    // React and RouteErrorBoundary both log the error.
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Main" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { name: "Something went wrong" }),
    );
  });
});
