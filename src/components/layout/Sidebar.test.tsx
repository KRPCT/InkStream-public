import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { useAppStore } from "@/stores/appStore";

describe("Sidebar outline", () => {
  beforeEach(() => {
    useAppStore.setState({
      tabs: [],
      activeTabId: null,
      sidebarTab: "workspace",
      vaultPath: null,
      fileTree: [],
      mode: "standard",
    });
  });

  it("shows active document headings in the left sidebar", () => {
    useAppStore.getState().openTab("/notes/outline.md", "# Title\n\n## Methods\n");

    render(<Sidebar />);
    fireEvent.click(screen.getByRole("tab", { name: "大纲" }));

    expect(screen.getByRole("tabpanel", { name: "大纲" })).toContainElement(
      screen.getByRole("button", { name: "Title" }),
    );
    expect(screen.getByRole("button", { name: "Methods" })).toBeInTheDocument();
  });
});
