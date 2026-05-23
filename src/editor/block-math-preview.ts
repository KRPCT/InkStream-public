import { syntaxTree } from "@codemirror/language";
import { EditorState, RangeSetBuilder, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { renderInlineMathHtml } from "./fenced-block-renderers";

export const blockMathPreviewPlugin = StateField.define<DecorationSet>({
  create(state) {
    return buildBlockMathDecorations(state);
  },
  update(value, transaction) {
    if (transaction.docChanged || transaction.selection) {
      return buildBlockMathDecorations(transaction.state);
    }
    return value;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

function buildBlockMathDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = state.doc.toString();
  const cursor = state.selection.main.head;
  const skipRanges = collectSkipRanges(state);
  const pattern = /(^|\n)\$\$\s*\n?([\s\S]*?)\n?\$\$(?=\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(doc)) !== null) {
    const start = match.index + match[1].length;
    const end = start + match[0].length - match[1].length;
    if (cursor >= start && cursor <= end) continue;
    if (skipRanges.some((range) => start < range.to && end > range.from)) continue;

    builder.add(
      start,
      end,
      Decoration.replace({
        block: true,
        widget: new BlockMathWidget(match[2].trim(), start),
      }),
    );
  }

  return builder.finish();
}

function collectSkipRanges(state: EditorState): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = [];
  syntaxTree(state).iterate({
    enter(node) {
      if (node.name === "InlineCode" || node.name === "FencedCode") {
        ranges.push({ from: node.from, to: node.to });
      }
    },
  });
  return ranges;
}

class BlockMathWidget extends WidgetType {
  constructor(
    private readonly source: string,
    private readonly sourceFrom: number,
  ) {
    super();
  }

  eq(other: BlockMathWidget): boolean {
    return other.source === this.source;
  }

  toDOM(view: EditorView): HTMLElement {
    const section = document.createElement("section");
    section.className = "ink-block-math";
    section.setAttribute("contenteditable", "false");
    section.setAttribute("aria-hidden", "true");
    section.setAttribute("role", "presentation");
    section.tabIndex = 0;
    section.title = "Click to edit source";
    section.addEventListener("mousedown", (event) => {
      event.preventDefault();
      view.focus();
      view.dispatch({
        selection: { anchor: this.sourceFrom + 3 },
        scrollIntoView: true,
      });
    });

    const result = renderInlineMathHtml(this.source);
    if (result.status === "ready") {
      section.innerHTML = result.html;
    } else {
      section.classList.add("ink-block-math--error");
      section.innerHTML = `<pre>${escapeHtml(result.message)}</pre>`;
    }
    return section;
  }

  ignoreEvent(event: Event): boolean {
    return event.type !== "mousedown" && event.type !== "click";
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
