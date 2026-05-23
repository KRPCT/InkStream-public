import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { createExtensions } from "./markdown-extensions";

describe("inline math preview", () => {
  it("renders inline dollar math with KaTeX without changing source", () => {
    const doc = "Inline $E=mc^2$ stays editable.";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.length },
      }),
    });

    expect(view.dom.querySelector(".ink-inline-math .katex")).not.toBeNull();
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("keeps inline math source visible while the cursor is inside it", () => {
    const doc = "Inline $E=mc^2$ stays editable.";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.indexOf("mc") },
      }),
    });

    expect(view.dom.querySelector(".ink-inline-math")).toBeNull();
    expect(view.dom.textContent).toContain("$E=mc^2$");
    view.destroy();
  });

  it("does not render escaped dollar text as inline math", () => {
    const doc = "Price \\$5 is plain text.";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.length },
      }),
    });

    expect(view.dom.querySelector(".ink-inline-math")).toBeNull();
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("does not render dollar math inside inline code", () => {
    const doc = "Inline code `$E=mc^2$` stays source.";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.length },
      }),
    });

    expect(view.dom.querySelector(".ink-inline-math")).toBeNull();
    expect(view.dom.textContent).toContain("`$E=mc^2$`");
    view.destroy();
  });

  it("keeps inline math preview out of editable text", () => {
    const doc = "Inline $E=mc^2$ stays editable.";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.length },
      }),
    });

    const widget = view.dom.querySelector(".ink-inline-math");

    expect(widget).toHaveAttribute("aria-hidden", "true");
    expect(widget).toHaveAttribute("contenteditable", "false");
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("moves the cursor back into source when clicking inline math preview", () => {
    const doc = "Inline $E=mc^2$ stays editable.";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: doc.length },
      }),
    });

    view.dom.querySelector(".ink-inline-math")?.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );

    expect(view.state.selection.main.head).toBe(doc.indexOf("$E=mc^2$") + 1);
    expect(view.dom.querySelector(".ink-inline-math")).toBeNull();
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("moves the cursor into an inline math paragraph when clicking beside the preview", () => {
    const doc = "# Heading\n\nInline $E=mc^2$ paragraph.";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live"),
        selection: { anchor: 0 },
      }),
    });

    const paragraphLine = view.dom.querySelector(".ink-inline-math")?.closest(".cm-line");
    expect(paragraphLine?.textContent).toContain("Inline");
    paragraphLine?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(view.state.doc.lineAt(view.state.selection.main.head).text).toContain("Inline $E=mc^2$");
    view.destroy();
  });
});
