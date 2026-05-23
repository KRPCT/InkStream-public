import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createExtensions } from "./markdown-extensions";
import { insertFencedBlock, maybeExpandSlashTrigger } from "./block-commands";

describe("block commands", () => {
  it("inserts a math fenced block skeleton", () => {
    const view = new EditorView({
      state: EditorState.create({
        doc: "Before\n",
        selection: { anchor: 7 },
        extensions: createExtensions("source"),
      }),
    });

    insertFencedBlock(view, "math");

    expect(view.state.doc.toString()).toContain("```math");
    expect(view.state.doc.toString()).toContain("\\int_0^\\infty");
    view.destroy();
  });

  it("expands slash triggers into block skeletons", () => {
    const view = new EditorView({
      state: EditorState.create({
        doc: "/typst",
        selection: { anchor: 6 },
        extensions: createExtensions("source"),
      }),
    });

    expect(maybeExpandSlashTrigger(view)).toBe(true);

    expect(view.state.doc.toString()).toContain("```typst");
    expect(view.state.doc.toString()).not.toContain("/typst");
    view.destroy();
  });
});
