import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import {
  EditorState,
  Facet,
  RangeSetBuilder,
  StateEffect,
  StateField,
  Transaction,
  type Extension,
} from "@codemirror/state";
import type { FencedBlockInfo, FencedBlockViewMode } from "@/types";
import { parseFencedBlocks } from "./fenced-block-parser";
import {
  renderBlockError,
  renderLatexBlock,
  renderMathBlock,
  renderTypstBlock,
  type RenderResult,
} from "./fenced-block-renderers";

export interface FencedBlockExtensionConfig {
  path?: string;
  blockViewModes?: Record<string, FencedBlockViewMode>;
  onViewModeChange?: (key: string, mode: FencedBlockViewMode) => void;
  renderMode?: "source" | "live";
}

interface FencedBlockConfigValue {
  path: string;
  blockViewModes: Record<string, FencedBlockViewMode>;
  onViewModeChange?: (key: string, mode: FencedBlockViewMode) => void;
  renderMode: "source" | "live";
}

export const fencedBlockConfig = Facet.define<
  FencedBlockConfigValue,
  FencedBlockConfigValue
>({
  combine(values) {
    return (
      values[0] ?? {
        path: "untitled.md",
        blockViewModes: {},
        renderMode: "source",
      }
    );
  },
});

export const setFencedBlockViewMode = StateEffect.define<{
  key: string;
  mode: FencedBlockViewMode;
}>();

export const fencedBlockViewModesField = StateField.define<Record<string, FencedBlockViewMode>>({
  create(state) {
    return state.facet(fencedBlockConfig).blockViewModes;
  },
  update(value, transaction) {
    let next = value;
    for (const effect of transaction.effects) {
      if (effect.is(setFencedBlockViewMode)) {
        next = { ...next, [effect.value.key]: effect.value.mode };
      }
    }
    return next;
  },
});

const activeFencedBlockField = StateField.define<string | null>({
  create() {
    return null;
  },
  update(value, transaction) {
    if (transaction.docChanged) return null;
    if (!transaction.selection) return value;
    const position = transaction.state.selection.main.head;
    const config = transaction.state.facet(fencedBlockConfig);
    const block = parseFencedBlocks(transaction.state.doc.toString(), config.path).find(
      (item) => position >= item.from && position <= item.to,
    );
    return block?.stableKey ?? null;
  },
});

const fencedBlockDecorationsField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },
  update(value, transaction) {
    if (transaction.docChanged || transaction.selection || hasModeTransactionEffect(transaction)) {
      return buildDecorations(transaction.state);
    }
    return value;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

export function inkstreamFencedBlock(config: FencedBlockExtensionConfig = {}): Extension {
  return [
    fencedBlockConfig.of({
      path: config.path ?? "untitled.md",
      blockViewModes: config.blockViewModes ?? {},
      onViewModeChange: config.onViewModeChange,
      renderMode: config.renderMode ?? "source",
    }),
    fencedBlockViewModesField,
    activeFencedBlockField,
    fencedBlockDecorationsField,
    fencedBlockPlugin,
  ];
}

const fencedBlockPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || hasModeEffect(update)) {
        update.view.requestMeasure();
      }
    }
  },
);

function buildDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const config = state.facet(fencedBlockConfig);
  const modes = state.field(fencedBlockViewModesField, false) ?? config.blockViewModes;
  const activeKey = state.field(activeFencedBlockField, false);
  const blocks = parseFencedBlocks(state.doc.toString(), config.path);

  for (const block of blocks) {
    if (config.renderMode !== "live" || hasMissingClosingFence(block)) continue;
    if (block.kind !== "code" && block.stableKey === activeKey) {
      builder.add(block.from, block.from, Decoration.widget({
        side: -1,
        block: true,
        widget: new FencedBlockToolbarWidget(block, modes[block.stableKey] ?? "split"),
      }));
      continue;
    }
    const mode = modes[block.stableKey] ?? "render";
    builder.add(
      block.from,
      block.to,
      Decoration.replace({
        block: true,
        widget: new FencedBlockWidget(block, mode),
      }),
    );
  }

  return builder.finish();
}

class FencedBlockToolbarWidget extends WidgetType {
  constructor(
    private readonly block: FencedBlockInfo,
    private readonly mode: FencedBlockViewMode,
  ) {
    super();
  }

  eq(other: FencedBlockToolbarWidget): boolean {
    return other.block.stableKey === this.block.stableKey && other.mode === this.mode;
  }

  toDOM(view: EditorView): HTMLElement {
    const root = document.createElement("section");
    root.className = `ink-fenced-block ink-fenced-block--toolbar ink-fenced-block--${this.block.kind}`;
    root.dataset.blockKey = this.block.stableKey;
    preparePreviewWidget(root);
    root.append(createHeader(view, this.block, this.mode));
    return root;
  }

  ignoreEvent(event: Event): boolean {
    return event.type !== "click" && event.type !== "mousedown";
  }
}

class FencedBlockWidget extends WidgetType {
  constructor(
    private readonly block: FencedBlockInfo,
    private readonly mode: FencedBlockViewMode,
  ) {
    super();
  }

  eq(other: FencedBlockWidget): boolean {
    return (
      other.block.stableKey === this.block.stableKey &&
      other.block.content === this.block.content &&
      other.mode === this.mode
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const root = document.createElement("section");
    root.className = `ink-fenced-block ink-fenced-block--${this.block.kind}`;
    root.dataset.blockKey = this.block.stableKey;
    preparePreviewWidget(root);
    root.tabIndex = 0;
    root.title = "Edit inside block";
    root.addEventListener("mousedown", (event) => {
      if ((event.target as HTMLElement).closest("button, textarea")) return;
      event.preventDefault();
      if (this.mode === "render") {
        view.dispatch({
          effects: setFencedBlockViewMode.of({ key: this.block.stableKey, mode: "split" }),
        });
        view.state.facet(fencedBlockConfig).onViewModeChange?.(this.block.stableKey, "split");
      }
      queueMicrotask(() => {
        view.dom
          .querySelector<HTMLTextAreaElement>(
            `[data-block-key="${this.block.stableKey}"] .ink-fenced-block__source-editor`,
          )
          ?.focus();
      });
    });
    root.addEventListener("focus", () => {
      if (this.block.kind === "code" || this.mode !== "render") return;
      view.dispatch({
        effects: setFencedBlockViewMode.of({ key: this.block.stableKey, mode: "split" }),
      });
      view.state.facet(fencedBlockConfig).onViewModeChange?.(this.block.stableKey, "split");
    });

    root.append(createHeader(view, this.block, this.mode));

    const body = document.createElement("div");
    body.className = `ink-fenced-block__body ink-fenced-block__body--${this.mode}`;
    if (this.block.kind === "code" || this.mode === "source" || this.mode === "split") {
      body.append(createSourcePanel(view, this.block));
    }
    if (this.block.kind !== "code" && (this.mode === "render" || this.mode === "split")) {
      body.append(createRenderPanel(this.block));
    }
    root.append(body);

    return root;
  }

  ignoreEvent(event: Event): boolean {
    return event.type !== "click" && event.type !== "mousedown";
  }
}

function createHeader(view: EditorView, block: FencedBlockInfo, mode: FencedBlockViewMode): HTMLElement {
  const header = document.createElement("div");
  header.className = "ink-fenced-block__header";

  const title = document.createElement("span");
  title.className = "ink-fenced-block__title";
  title.textContent = block.kind === "code" ? block.language || "code" : block.kind;
  header.append(title);

  const controls = document.createElement("div");
  controls.className = "ink-fenced-block__controls";
  if (block.kind !== "code") {
    for (const nextMode of ["source", "render", "split"] as const) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `ink-fenced-block__mode${
        nextMode === mode ? " ink-fenced-block__mode--active" : ""
      }`;
      button.textContent = modeLabel(nextMode);
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        view.dispatch({ effects: setFencedBlockViewMode.of({ key: block.stableKey, mode: nextMode }) });
        view.state.facet(fencedBlockConfig).onViewModeChange?.(block.stableKey, nextMode);
      });
      controls.append(button);
    }
  }

  controls.append(createDeleteButton(view, block));
  header.append(controls);

  return header;
}

function createDeleteButton(view: EditorView, block: FencedBlockInfo): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ink-fenced-block__delete";
  button.title = "删除代码块";
  button.setAttribute("aria-label", "删除代码块");
  button.textContent = "删除";
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    view.dispatch({
      changes: { from: block.from, to: block.to, insert: "" },
      selection: { anchor: block.from },
      scrollIntoView: true,
    });
    view.focus();
  });
  return button;
}

function createSourcePanel(view: EditorView, block: FencedBlockInfo): HTMLElement {
  const source = document.createElement("textarea");
  source.className = "ink-fenced-block__source ink-fenced-block__source-editor";
  source.value = block.content;
  source.spellcheck = false;
  source.rows = Math.max(2, block.content.split(/\r?\n/).length);
  source.setAttribute("aria-label", `${block.kind} source`);
  source.addEventListener("mousedown", (event) => {
    event.stopPropagation();
  });
  source.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });
  source.addEventListener("input", () => {
    const selectionStart = source.selectionStart;
    const selectionEnd = source.selectionEnd;
    view.dispatch({
      changes: {
        from: block.contentFrom,
        to: block.contentTo,
        insert: source.value,
      },
    });
    queueMicrotask(() => {
      const nextSource = view.dom.querySelector<HTMLTextAreaElement>(
        `[data-block-key="${block.stableKey}"] .ink-fenced-block__source-editor`,
      );
      nextSource?.focus();
      nextSource?.setSelectionRange(selectionStart, selectionEnd);
    });
  });
  return source;
}

function createRenderPanel(block: FencedBlockInfo): HTMLElement {
  const render = document.createElement("div");
  render.className = "ink-fenced-block__render";

  if (block.diagnostics.length > 0) {
    render.innerHTML = renderBlockError(block.diagnostics.map((item) => item.message).join("\n"));
    return render;
  }

  render.textContent = "Rendering...";
  renderBlock(block).then((result) => applyRenderResult(render, result));
  return render;
}

function preparePreviewWidget(element: HTMLElement) {
  element.setAttribute("contenteditable", "false");
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("role", "presentation");
}

async function renderBlock(block: FencedBlockInfo): Promise<RenderResult> {
  if (block.kind === "math") return renderMathBlock(block.content);
  if (block.kind === "latex") return renderLatexBlock(block.content);
  if (block.kind === "typst") return renderTypstBlock(block.content);
  return { status: "ready", html: "" };
}

function hasMissingClosingFence(block: FencedBlockInfo): boolean {
  return block.diagnostics.some((item) => item.message === "Fenced block is missing a closing delimiter");
}

function applyRenderResult(target: HTMLElement, result: RenderResult) {
  if (!target.isConnected) return;
  if (result.status === "ready") {
    target.innerHTML = result.html;
  } else if (result.status === "error") {
    target.innerHTML = renderBlockError(result.message);
  } else {
    target.textContent = result.message;
  }
}

function modeLabel(mode: FencedBlockViewMode): string {
  if (mode === "source") return "源码";
  if (mode === "render") return "渲染";
  return "双栏";
}

function hasModeEffect(update: ViewUpdate): boolean {
  return update.transactions.some((transaction) =>
    transaction.effects.some((effect) => effect.is(setFencedBlockViewMode)),
  );
}

function hasModeTransactionEffect(transaction: Transaction): boolean {
  return transaction.effects.some((effect) => effect.is(setFencedBlockViewMode));
}

export function getFencedBlockViewModes(state: EditorState) {
  return state.field(fencedBlockViewModesField, false) ?? {};
}
