import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GitGraphView from "./GitGraphView";

describe("GitGraphView", () => {
  it("renders the sidebar git graph regions", () => {
    render(<GitGraphView />);

    expect(screen.getByRole("region", { name: "Git Graph" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Commit history" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Commit detail" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "File diff preview" })).toBeTruthy();
  });

  it("updates commit detail when a history row is selected", async () => {
    const user = userEvent.setup();
    render(<GitGraphView />);

    await user.click(screen.getByRole("button", { name: /align syntax orange/i }));

    expect(screen.getAllByText(/763f179/).length).toBeGreaterThan(0);
    expect(screen.getByText("../UI-SPEC.md")).toBeTruthy();
  });
});
