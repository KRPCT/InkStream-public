import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useAppStore } from "./stores/appStore";

describe("App shell navigation", () => {
  beforeEach(() => {
    useAppStore.setState({
      tabs: [],
      activeTabId: null,
      vaultPath: null,
      mode: "standard",
      theme: "light",
      sidebarTab: "workspace",
      sidebarOpen: true,
      rightPanelOpen: true,
    });
  });

  it("opens Git Graph inside the left sidebar and keeps the editor in the main view", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: "视图" }));
    await user.click(screen.getByRole("button", { name: "Git Graph" }));

    expect(screen.getByRole("tabpanel", { name: "Git" })).toContainElement(
      screen.getByRole("region", { name: "Git Graph" }),
    );
    expect(document.querySelector(".ink-editor-area .ink-sidebar__git-graph")).not.toBeInTheDocument();
    expect(document.querySelector(".ink-editor-area .ink-welcome, .ink-editor-area .ink-editor-container")).toBeInTheDocument();
  });
});
