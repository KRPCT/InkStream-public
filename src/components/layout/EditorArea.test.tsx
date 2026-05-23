import { describe, expect, it, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { EditorView } from "@codemirror/view";
import EditorArea from "./EditorArea";
import { useAppStore } from "@/stores/appStore";

interface CodeMirrorContent extends HTMLElement {
  cmTile?: { view: EditorView };
}

describe("EditorArea", () => {
  beforeEach(() => {
    useAppStore.setState({
      tabs: [],
      activeTabId: null,
      wordCount: 0,
      cursorLine: 1,
      cursorColumn: 1,
      settings: {
        fontSize: 16,
        defaultMode: "standard",
        autoSave: false,
        autoSaveInterval: 30,
        lineWidth: 760,
        pandocPath: "",
        defaultExportDirectory: "",
        defaultExportFormat: "pdf",
        renderMathByDefault: true,
        typstDarkMode: true,
      },
    });
  });

  it("keeps the same CodeMirror view after doc changes sync to the store", async () => {
    useAppStore.getState().openTab("Untitled.md", "Plain paragraph.", { untitled: true });

    const { container } = render(<EditorArea />);
    const editorBefore = container.querySelector(".cm-editor");
    const view = (container.querySelector(".cm-content") as CodeMirrorContent | null)?.cmTile?.view;

    expect(view).toBeDefined();

    view!.dispatch({
      changes: { from: view!.state.doc.length, insert: " More" },
      selection: { anchor: view!.state.doc.length + 5 },
    });

    expect(container.querySelector(".cm-editor")).toBe(editorBefore);
    expect(useAppStore.getState().tabs[0].stateJSON.doc).toContain("More");
  });

  it("loads an opened markdown tab into CodeMirror when switching from another tab", () => {
    useAppStore.getState().openTab("Untitled.md", "# Draft", { untitled: true });
    useAppStore.getState().openTab("D:/vault/imported.md", "# Imported\n\n**saved**");

    const { container } = render(<EditorArea />);
    const view = (container.querySelector(".cm-content") as CodeMirrorContent | null)?.cmTile?.view;

    expect(view?.state.doc.toString()).toBe("# Imported\n\n**saved**");

    view!.dispatch({
      changes: { from: view!.state.doc.length, insert: "\nEdited" },
      selection: { anchor: view!.state.doc.length + 7 },
    });

    expect(useAppStore.getState().tabs[1].stateJSON.doc).toContain("Edited");
    expect(useAppStore.getState().tabs[1].dirty).toBe(true);
  });
});
