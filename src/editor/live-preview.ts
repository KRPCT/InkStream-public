import { RangeSetBuilder, StateField, type Extension, type EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { extractMarkdownOutline } from "./outline";

interface PreviewRange {
  from: number;
  to: number;
}

interface TableCell {
  from: number;
  to: number;
  text: string;
}

interface TableRow {
  from: number;
  to: number;
  cells: TableCell[];
}

interface TablePreview {
  from: number;
  to: number;
  header: TableRow;
  rows: TableRow[];
}

export const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (update.viewportChanged) {
        update.view.requestMeasure();
      }
    }
  },
  {
    eventHandlers: {
      mousedown(event, view) {
        const target = event.target as HTMLElement | null;
        restoreTableCellPreviews(view.dom, target?.closest<HTMLTableCellElement>(".ink-markdown-table [data-table-cell]") ?? null);

        const link = target?.closest<HTMLElement>(".cm-link");
        const href = link?.dataset.inkLinkHref;
        if (href) {
          event.preventDefault();
          event.stopPropagation();
          followPreviewLink(href, view);
          return true;
        }

        const lineElement = target?.closest<HTMLElement>(".cm-line");
        if (!lineElement || !lineElementHasPreview(lineElement)) return false;

        const position = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
        if (position === null) return false;

        event.preventDefault();
        view.focus();
        view.dispatch({
          selection: { anchor: position },
          scrollIntoView: true,
        });
        return true;
      },
    },
  },
);

export const livePreviewDecorations = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },
  update(value, transaction) {
    if (transaction.docChanged || transaction.selection) {
      return buildDecorations(transaction.state);
    }
    return value;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

export const livePreviewExtensions: Extension[] = [livePreviewDecorations, livePreviewPlugin];

function buildDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const activeLine = state.doc.lineAt(state.selection.main.head);
  const activeRange = { from: activeLine.from, to: activeLine.to };

  syntaxTree(state).iterate({
    enter(node) {
      if (overlapsActiveLine(node.from, node.to, activeRange)) return;

      if (node.name.startsWith("ATXHeading")) {
        addHeadingPreview(builder, state, node.name, node.from, node.to);
      } else if (node.name === "StrongEmphasis") {
        addDelimitedInlinePreview(builder, node.from, node.to, 2, "cm-strong");
      } else if (node.name === "Emphasis") {
        addDelimitedInlinePreview(builder, node.from, node.to, 1, "cm-em");
      } else if (node.name === "Strikethrough") {
        addDelimitedInlinePreview(builder, node.from, node.to, 2, "cm-strike");
      } else if (node.name === "InlineCode") {
        addDelimitedInlinePreview(builder, node.from, node.to, 1, "cm-inline-code");
      } else if (node.name === "Link") {
        addLinkPreview(builder, state, node.from, node.to);
      } else if (node.name === "Comment") {
        addCommentPreview(builder, state, node.from, node.to);
      } else if (node.name === "Blockquote") {
        builder.add(node.from, node.to, Decoration.mark({
          attributes: previewAttributes(node.from),
          class: "cm-quote",
        }));
      } else if (node.name === "HorizontalRule") {
        builder.add(node.from, node.to, Decoration.mark({
          attributes: previewAttributes(node.from),
          class: "cm-hr",
        }));
      } else if (node.name === "BulletList" || node.name === "OrderedList") {
        builder.add(node.from, node.to, Decoration.mark({
          attributes: previewAttributes(node.from),
          class: "cm-list",
        }));
      } else if (node.name === "FencedCode") {
        return false;
      } else if (node.name === "Table") {
        const table = readTablePreview(state, node.from, node.to);
        builder.add(
          table.from,
          table.to,
          Decoration.replace({
            block: true,
            widget: new MarkdownTableWidget(table),
          }),
        );
        return false;
      }
    },
  });

  return builder.finish();
}

function addHeadingPreview(
  builder: RangeSetBuilder<Decoration>,
  state: EditorState,
  name: string,
  from: number,
  to: number,
) {
  const marker = state.sliceDoc(from, to).match(/^(#{1,6})\s+/);
  if (!marker) return;

  const contentFrom = from + marker[0].length;
  builder.add(from, contentFrom, Decoration.replace({}));
  builder.add(contentFrom, to, Decoration.mark({
    attributes: previewAttributes(from),
    class: `cm-heading-${name.slice(-1)}`,
  }));
}

function addDelimitedInlinePreview(
  builder: RangeSetBuilder<Decoration>,
  from: number,
  to: number,
  markerLength: number,
  className: string,
) {
  if (to - from <= markerLength * 2) return;
  builder.add(from, from + markerLength, Decoration.replace({}));
  builder.add(
    from + markerLength,
    to - markerLength,
    Decoration.mark({
      attributes: previewAttributes(from),
      class: className,
    }),
  );
  builder.add(to - markerLength, to, Decoration.replace({}));
}

function addLinkPreview(
  builder: RangeSetBuilder<Decoration>,
  state: EditorState,
  from: number,
  to: number,
) {
  const source = state.sliceDoc(from, to);
  const match = source.match(/^(!?)\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
  if (!match || match[1]) {
    builder.add(from, to, Decoration.mark({ class: "cm-link" }));
    return;
  }

  const labelFrom = from + 1;
  const labelTo = labelFrom + match[2].length;
  builder.add(from, labelFrom, Decoration.replace({}));
  builder.add(
    labelFrom,
    labelTo,
      Decoration.mark({
      attributes: { title: match[3], "data-ink-link-href": match[3] },
      class: "cm-link",
    }),
  );
  builder.add(labelTo, to, Decoration.replace({}));
}

function addCommentPreview(
  builder: RangeSetBuilder<Decoration>,
  state: EditorState,
  from: number,
  to: number,
) {
  const source = state.sliceDoc(from, to);
  if (!source.startsWith("<!--") || !source.endsWith("-->")) return;
  builder.add(from, from + 4, Decoration.replace({}));
  builder.add(from + 4, to - 3, Decoration.mark({
    attributes: previewAttributes(from),
    class: "cm-inline-comment",
  }));
  builder.add(to - 3, to, Decoration.replace({}));
}

function readTablePreview(state: EditorState, from: number, to: number): TablePreview {
  const header: TableRow = { from, to: from, cells: [] };
  const rows: TableRow[] = [];
  let activeRow: TableRow | null = null;

  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      if (node.name === "TableHeader") {
        activeRow = { from: node.from, to: node.to, cells: [] };
        header.from = node.from;
        header.to = node.to;
        header.cells = activeRow.cells;
      } else if (node.name === "TableRow") {
        activeRow = { from: node.from, to: node.to, cells: [] };
        rows.push(activeRow);
      } else if (node.name === "TableCell" && activeRow) {
        activeRow.cells.push({
          from: node.from,
          to: node.to,
          text: state.sliceDoc(node.from, node.to).trim(),
        });
      }
    },
    leave(node) {
      if (node.name === "TableHeader" || node.name === "TableRow") {
        activeRow = null;
      }
    },
  });

  return { from, to, header, rows };
}

class MarkdownTableWidget extends WidgetType {
  constructor(private readonly table: TablePreview) {
    super();
  }

  eq(other: MarkdownTableWidget) {
    return (
      other.table.from === this.table.from &&
      other.table.to === this.table.to &&
      JSON.stringify(other.table) === JSON.stringify(this.table)
    );
  }

  toDOM(view: EditorView) {
    const table = document.createElement("table");
    table.className = "ink-markdown-table";
    preparePreviewWidget(table);
    table.removeAttribute("aria-hidden");
    table.title = "Edit table cells in place";

    const head = table.createTHead();
    const headerRow = head.insertRow();
    for (const [index, cell] of this.table.header.cells.entries()) {
      const th = document.createElement("th");
      prepareEditableCell(th, cell, view, `header-${index}`);
      headerRow.append(th);
    }

    const body = table.createTBody();
    for (const [rowIndex, row] of this.table.rows.entries()) {
      const tr = body.insertRow();
      for (const [cellIndex, cell] of row.cells.entries()) {
        const td = tr.insertCell();
        prepareEditableCell(td, cell, view, `body-${rowIndex}-${cellIndex}`);
      }
    }

    return table;
  }

  ignoreEvent(event: Event) {
    return event.target instanceof HTMLElement && Boolean(event.target.closest("[contenteditable='true']"));
  }
}

function preparePreviewWidget(element: HTMLElement) {
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("contenteditable", "false");
  element.setAttribute("role", "presentation");
}

function prepareEditableCell(
  cellElement: HTMLTableCellElement,
  cell: TableCell,
  view: EditorView,
  cellKey: string,
) {
  cellElement.innerHTML = renderTableCellMarkdown(cell.text);
  cellElement.contentEditable = "true";
  cellElement.setAttribute("contenteditable", "true");
  cellElement.dataset.tableCell = cellKey;
  cellElement.dataset.markdownSource = cell.text;
  cellElement.spellcheck = true;
  cellElement.addEventListener("mouseleave", () => {
    if (document.activeElement !== cellElement) showTableCellPreview(cellElement);
  });
  cellElement.addEventListener("mousedown", (event) => {
    const target = event.target as HTMLElement | null;
    const href = target?.closest<HTMLAnchorElement>("a[data-ink-table-link]")?.dataset.inkTableLink;
    if (href) {
      event.preventDefault();
      followPreviewLink(href, view);
      return;
    }
    event.stopPropagation();
    showTableCellSource(cellElement);
  });
  cellElement.addEventListener("focus", () => {
    showTableCellSource(cellElement);
  });
  cellElement.addEventListener("blur", () => {
    showTableCellPreview(cellElement);
  });
  cellElement.addEventListener("input", () => {
    const next = sanitizeTableCell(cellElement.textContent ?? "");
    view.dispatch({
      changes: { from: cell.from, to: cell.to, insert: next },
    });
    queueMicrotask(() => {
      const nextCell = view.dom.querySelector<HTMLElement>(`[data-table-cell="${cellKey}"]`);
      nextCell?.focus();
      placeCaretAtEnd(nextCell);
    });
  });
}

function showTableCellSource(cellElement: HTMLTableCellElement) {
  const source = cellElement.dataset.markdownSource;
  if (source === undefined || cellElement.textContent === source) return;
  cellElement.textContent = source;
}

function showTableCellPreview(cellElement: HTMLTableCellElement) {
  const source = cellElement.dataset.markdownSource;
  if (source === undefined || cellElement.textContent !== source) return;
  cellElement.innerHTML = renderTableCellMarkdown(source);
}

function restoreTableCellPreviews(root: HTMLElement, except: HTMLTableCellElement | null) {
  for (const cell of root.querySelectorAll<HTMLTableCellElement>(".ink-markdown-table [data-table-cell]")) {
    if (except && cell === except) continue;
    showTableCellPreview(cell);
  }
}

function sanitizeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n+/g, " ").trim();
}

function renderTableCellMarkdown(value: string): string {
  const stash: string[] = [];
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, (_match, text: string) => stashHtml(stash, `<code>${text}</code>`));
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"&quot;[^"]*&quot;")?\)/g, (_match, label: string, href: string) =>
    stashHtml(stash, `<a href="${escapeAttribute(href)}" data-ink-table-link="${escapeAttribute(href)}">${label}</a>`),
  );
  html = html
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
  return html.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => stash[Number(index)] ?? "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function stashHtml(stash: string[], html: string): string {
  stash.push(html);
  return `\u0000${stash.length - 1}\u0000`;
}

function placeCaretAtEnd(element: HTMLElement | null | undefined) {
  if (!element) return;
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function overlapsActiveLine(from: number, to: number, activeRange: PreviewRange) {
  return from < activeRange.to && to > activeRange.from;
}

function lineElementHasPreview(lineElement: HTMLElement): boolean {
  return Boolean(
    lineElement.querySelector(
      [
        ".cm-heading-1",
        ".cm-heading-2",
        ".cm-heading-3",
        ".cm-heading-4",
        ".cm-heading-5",
        ".cm-heading-6",
        ".cm-strong",
        ".cm-em",
        ".cm-strike",
        ".cm-inline-code",
        ".cm-inline-comment",
        ".cm-quote",
        ".cm-list",
        ".cm-hr",
      ].join(","),
    ),
  );
}

function previewAttributes(from: number): Record<string, string> {
  return { "data-ink-preview-from": String(from) };
}

function readPreviewSourceFrom(lineElement: HTMLElement): number | null {
  const preview = lineElement.querySelector<HTMLElement>("[data-ink-preview-from]");
  const value = preview?.dataset.inkPreviewFrom;
  if (!value) return null;
  const sourceFrom = Number(value);
  return Number.isFinite(sourceFrom) ? sourceFrom : null;
}

function followPreviewLink(href: string, view: EditorView) {
  if (href.startsWith("#")) {
    const anchor = decodeURIComponent(href.slice(1));
    const heading = extractMarkdownOutline(view.state.doc.toString()).find((item) => item.anchor === anchor);
    if (!heading) return;
    view.focus();
    view.dispatch({
      selection: { anchor: heading.from },
      scrollIntoView: true,
    });
    return;
  }

  if (/^(?:https?:|mailto:)/i.test(href)) {
    if (isTauriRuntime()) {
      void import("@tauri-apps/plugin-opener").then(({ openUrl }) => openUrl(href));
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }
}

function isTauriRuntime(): boolean {
  return Boolean((globalThis as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
}
