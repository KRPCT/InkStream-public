import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createExtensions } from "./markdown-extensions";
import { setFencedBlockViewMode } from "./fenced-block-extension";
import { parseFencedBlocks } from "./fenced-block-parser";

describe("fenced block extension", () => {
  it("keeps the markdown document unchanged when toggling block view modes", () => {
    const doc = "```math\nE=mc^2\n```";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live", {
          path: "/math.md",
          blockViewModes: {},
        }),
      }),
    });
    const key = "/math.md:math:0:2c0b7ef8";

    view.dispatch({ effects: setFencedBlockViewMode.of({ key, mode: "render" }) });
    view.dispatch({ effects: setFencedBlockViewMode.of({ key, mode: "split" }) });
    view.dispatch({ effects: setFencedBlockViewMode.of({ key, mode: "source" }) });

    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("renders mode controls for supported fenced blocks", () => {
    const view = new EditorView({
      state: EditorState.create({
        doc: "```math\nE=mc^2\n```",
        extensions: createExtensions("live", {
          path: "/math.md",
          blockViewModes: {},
        }),
      }),
    });

    expect(view.dom.textContent).toContain("源码");
    expect(view.dom.textContent).toContain("渲染");
    expect(view.dom.textContent).toContain("双栏");
    view.destroy();
  });

  it("replaces supported fenced blocks instead of appending duplicate previews", () => {
    const doc = "```math\nE=mc^2\n```";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live", {
          path: "/math.md",
          blockViewModes: {},
        }),
      }),
    });

    expect(view.dom.querySelector(".ink-fenced-block--math")).not.toBeNull();
    expect(view.dom.textContent).not.toContain("```math");
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("keeps fenced preview widgets out of the editable accessibility tree", () => {
    const doc = "```math\nE=mc^2\n```";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: createExtensions("live", {
          path: "/math.md",
          blockViewModes: {},
        }),
      }),
    });

    const widget = view.dom.querySelector(".ink-fenced-block--math");

    expect(widget).toHaveAttribute("aria-hidden", "true");
    expect(widget).toHaveAttribute("contenteditable", "false");
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("edits a math block inside its own source panel", () => {
    const doc = "```math\nE=mc^2\n```\nAfter";
    const blockKey = parseFencedBlocks(doc, "/math.md")[0].stableKey;
    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: doc.length },
        extensions: createExtensions("live", {
          path: "/math.md",
          blockViewModes: {
            [blockKey]: "split",
          },
        }),
      }),
    });

    const source = view.dom.querySelector<HTMLTextAreaElement>(".ink-fenced-block__source-editor");
    expect(source).not.toBeNull();

    source!.value = "a^2+b^2=c^2";
    source!.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(view.state.doc.toString()).toBe("```math\na^2+b^2=c^2\n```\nAfter");
    view.destroy();
  });

  it("opens an in-place source panel when a rendered math block is clicked", () => {
    const doc = "```math\nE=mc^2\n```\nAfter";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: doc.length },
        extensions: createExtensions("live", {
          path: "/math.md",
          blockViewModes: {},
        }),
      }),
    });

    view.dom.querySelector(".ink-fenced-block--math")?.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );

    expect(view.dom.querySelector(".ink-fenced-block__source-editor")).not.toBeNull();
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("hides ordinary fenced code markers inside an in-place code block", () => {
    const doc = "```ts\nconst answer = 42;\n```\nAfter";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: doc.length },
        extensions: createExtensions("live", {
          path: "/code.md",
          blockViewModes: {},
        }),
      }),
    });

    const widget = view.dom.querySelector(".ink-fenced-block--code");
    const source = widget?.querySelector<HTMLTextAreaElement>(".ink-fenced-block__source-editor");

    expect(widget).not.toBeNull();
    expect(source?.value).toBe("const answer = 42;");
    expect(view.dom.textContent).not.toContain("```ts");
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it("keeps ordinary code blocks in their widget when the selection lands inside the source range", () => {
    const doc = "```ts\nconst answer = 42;\n```\nAfter";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: doc.length },
        extensions: createExtensions("live", {
          path: "/code.md",
          blockViewModes: {},
        }),
      }),
    });

    view.dispatch({ selection: { anchor: doc.indexOf("answer") } });

    expect(view.dom.querySelector(".ink-fenced-block--code")).not.toBeNull();
    expect(view.dom.textContent).not.toContain("```ts");
    view.destroy();
  });

  it("removes an ordinary fenced code block from its header action", () => {
    const doc = "Before\n\n```js\nconsole.log('x');\n```\n\nAfter";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: doc.length },
        extensions: createExtensions("live", {
          path: "/code.md",
          blockViewModes: {},
        }),
      }),
    });

    view.dom.querySelector<HTMLButtonElement>(".ink-fenced-block--code .ink-fenced-block__delete")?.click();

    expect(view.state.doc.toString()).toBe("Before\n\n\nAfter");
    view.destroy();
  });

  it("turns a manually completed fence into a code block widget", () => {
    const draft = "```python\nprint('ready')\n";
    const view = new EditorView({
      state: EditorState.create({
        doc: draft,
        selection: { anchor: draft.length },
        extensions: createExtensions("live", {
          path: "/code.md",
          blockViewModes: {},
        }),
      }),
    });

    view.dispatch({
      changes: { from: draft.length, insert: "```" },
    });

    expect(view.dom.querySelector(".ink-fenced-block--code")).not.toBeNull();
    expect(view.dom.textContent).not.toContain("```python");
    view.destroy();
  });
});
