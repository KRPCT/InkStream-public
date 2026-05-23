import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { renderInlineMathHtml } from "./fenced-block-renderers";

export const inlineMathPreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildInlineMathDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildInlineMathDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
    eventHandlers: {
      mousedown(event, view) {
        const line = (event.target as HTMLElement | null)?.closest(".cm-line");
        if (!line?.querySelector(".ink-inline-math")) return false;

        const preview = line.querySelector<HTMLElement>(".ink-inline-math");
        const sourceFrom = Number(preview?.dataset.sourceFrom);
        if (!Number.isFinite(sourceFrom)) return false;

        view.focus();
        view.dispatch({
          selection: { anchor: view.state.doc.lineAt(sourceFrom).from },
          scrollIntoView: true,
        });
        return false;
      },
    },
  },
);

function buildInlineMathDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const cursor = view.state.selection.main.head;
  const skipRanges = collectSkipRanges(view);

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    const pattern = /(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const start = from + match.index;
      const end = start + match[0].length;
      if (cursor >= start && cursor <= end) continue;
      if (skipRanges.some((range) => start < range.to && end > range.from)) continue;

      builder.add(
        start,
        end,
        Decoration.replace({
          widget: new InlineMathWidget(match[1], start),
        }),
      );
    }
  }

  return builder.finish();
}

function collectSkipRanges(view: EditorView): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = [];
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter(node) {
        if (node.name === "InlineCode" || node.name === "FencedCode") {
          ranges.push({ from: node.from, to: node.to });
        }
      },
    });
  }
  return ranges;
}

class InlineMathWidget extends WidgetType {
  constructor(
    private readonly source: string,
    private readonly sourceFrom: number,
  ) {
    super();
  }

  eq(other: InlineMathWidget): boolean {
    return other.source === this.source && other.sourceFrom === this.sourceFrom;
  }

  toDOM(view: EditorView): HTMLElement {
    const span = document.createElement("span");
    span.className = "ink-inline-math";
    span.setAttribute("contenteditable", "false");
    span.setAttribute("aria-hidden", "true");
    span.setAttribute("role", "presentation");
    span.dataset.sourceFrom = String(this.sourceFrom);
    span.title = "Click to edit source";
    span.addEventListener("mousedown", (event) => {
      event.preventDefault();
      view.focus();
      view.dispatch({
        selection: { anchor: this.sourceFrom + 1 },
        scrollIntoView: true,
      });
    });
    const result = renderInlineMathHtml(this.source);
    if (result.status === "ready") {
      span.innerHTML = result.html;
    } else {
      span.classList.add("ink-inline-math--error");
      span.textContent = `$${this.source}$`;
      span.title = result.message;
    }
    return span;
  }

  ignoreEvent(event: Event): boolean {
    return event.type !== "mousedown" && event.type !== "click";
  }
}
