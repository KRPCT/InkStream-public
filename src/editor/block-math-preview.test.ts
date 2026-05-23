import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createExtensions } from "./markdown-extensions";

describe("block math preview", () => {
  it("renders dollar block math without changing source", () => {
    const doc = "$$\nE=mc^2\n$$\n";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.length },
      }),
    });

    expect(view.dom.querySelector(".ink-block-math .katex")).not.toBeNull();
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("keeps dollar block source visible while cursor is inside it", () => {
    const doc = "$$\nE=mc^2\n$$\n";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.indexOf("mc") },
      }),
    });

    expect(view.dom.querySelector(".ink-block-math")).toBeNull();
    expect(view.dom.textContent).toContain("$$");
    view.destroy();
  });

  it("keeps dollar block preview out of editable text", () => {
    const doc = "$$\nE=mc^2\n$$\n";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.length },
      }),
    });

    const widget = view.dom.querySelector(".ink-block-math");

    expect(widget).toHaveAttribute("aria-hidden", "true");
    expect(widget).toHaveAttribute("contenteditable", "false");
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });
});
