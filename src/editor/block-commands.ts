import type { EditorView } from "@codemirror/view";
import type { FencedBlockKind } from "@/types";
import { getActiveEditorView } from "./editor-commands";

type InsertableBlockKind = Extract<FencedBlockKind, "math" | "typst" | "latex">;

const skeletons: Record<InsertableBlockKind, string> = {
  math: "```math\n\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}\n```\n",
  typst: "```typst\n#set page(width: auto, height: auto, margin: 8pt)\n$ integral_0^oo e^(-x^2) dif x = sqrt(pi) / 2 $\n```\n",
  latex: "```latex\n\\begin{equation}\nE = mc^2\n\\end{equation}\n```\n",
};

export function insertFencedBlockIntoActiveEditor(kind: InsertableBlockKind): boolean {
  const activeEditorView = getActiveEditorView();
  if (!activeEditorView) return false;
  insertFencedBlock(activeEditorView, kind);
  activeEditorView.focus();
  return true;
}

export function insertFencedBlock(view: EditorView, kind: InsertableBlockKind) {
  const selection = view.state.selection.main;
  const prefix = needsLeadingBreak(view, selection.from) ? "\n" : "";
  const suffix = needsTrailingBreak(view, selection.to) ? "\n" : "";
  const insert = `${prefix}${skeletons[kind]}${suffix}`;
  const cursor = selection.from + prefix.length + firstEditableOffset(kind);

  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert },
    selection: { anchor: cursor },
    scrollIntoView: true,
  });
}

export function maybeExpandSlashTrigger(view: EditorView): boolean {
  const selection = view.state.selection.main;
  if (!selection.empty) return false;

  const line = view.state.doc.lineAt(selection.head);
  const beforeCursor = view.state.sliceDoc(line.from, selection.head);
  const match = beforeCursor.match(/(?:^|\s)\/(math|typst|latex)$/);
  if (!match?.[1]) return false;

  const triggerFrom = selection.head - match[0].trimStart().length;
  const kind = match[1] as InsertableBlockKind;
  const insert = skeletons[kind];
  const cursor = triggerFrom + firstEditableOffset(kind);

  view.dispatch({
    changes: { from: triggerFrom, to: selection.head, insert },
    selection: { anchor: cursor },
    scrollIntoView: true,
  });
  return true;
}

function firstEditableOffset(kind: InsertableBlockKind): number {
  const skeleton = skeletons[kind];
  const firstNewline = skeleton.indexOf("\n");
  return firstNewline === -1 ? skeleton.length : firstNewline + 1;
}

function needsLeadingBreak(view: EditorView, from: number): boolean {
  return from > 0 && view.state.sliceDoc(from - 1, from) !== "\n";
}

function needsTrailingBreak(view: EditorView, to: number): boolean {
  return to < view.state.doc.length && view.state.sliceDoc(to, to + 1) !== "\n";
}
