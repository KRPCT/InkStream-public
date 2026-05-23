import {
  defaultKeymap,
  historyKeymap,
  indentMore,
  redo,
  selectAll,
  undo,
} from '@codemirror/commands';
import { openSearchPanel, searchKeymap } from '@codemirror/search';
import { keymap, type EditorView, type KeyBinding } from '@codemirror/view';

export type EditorCommandName =
  | 'copy'
  | 'cut'
  | 'find'
  | 'formatBulletList'
  | 'formatBlockquote'
  | 'formatCodeBlock'
  | 'formatClear'
  | 'formatHighlight'
  | 'formatInlineCode'
  | 'formatOrderedList'
  | 'formatParagraph'
  | 'formatHeading'
  | 'formatItalic'
  | 'formatLink'
  | 'formatStrike'
  | 'formatStrong'
  | 'formatTable'
  | 'formatTaskList'
  | 'formatUnderline'
  | 'indent'
  | 'paste'
  | 'redo'
  | 'save'
  | 'selectAll'
  | 'undo';

let activeEditorView: EditorView | null = null;
let activeSaveHandler: (() => void | Promise<void>) | null = null;

export function registerEditorView(view: EditorView | null) {
  activeEditorView = view;
}

export function getActiveEditorView() {
  return activeEditorView;
}

export function jumpToEditorPosition(position: number): boolean {
  if (!activeEditorView) return false;

  const anchor = Math.min(Math.max(0, position), activeEditorView.state.doc.length);
  activeEditorView.focus();
  activeEditorView.dispatch({
    selection: { anchor },
    scrollIntoView: true,
  });
  return true;
}

export function registerEditorSaveHandler(handler: (() => void | Promise<void>) | null) {
  activeSaveHandler = handler;
}

export function runEditorCommand(command: EditorCommandName, value?: string): boolean {
  if (command === 'save') {
    void activeSaveHandler?.();
    return Boolean(activeSaveHandler);
  }

  if (!activeEditorView) return false;
  activeEditorView.focus();
  return editorCommand(command, value)(activeEditorView);
}

export function editorCommand(command: EditorCommandName, value?: string) {
  return (view: EditorView): boolean => {
    if (command === 'copy' || command === 'cut' || command === 'paste') {
      document.execCommand(command);
      return true;
    }
    if (command === 'find') return openSearchPanel(view);
    if (command === 'formatBulletList') return applyLinePrefix(view, '- ');
    if (command === 'formatBlockquote') return applyLinePrefix(view, '> ');
    if (command === 'formatClear') return clearFormat(view);
    if (command === 'formatCodeBlock') return wrapSelection(view, '```\n', '\n```');
    if (command === 'formatHighlight') return wrapSelection(view, '==', '==');
    if (command === 'formatInlineCode') return wrapSelection(view, '`', '`');
    if (command === 'formatOrderedList') return applyLinePrefix(view, '1. ');
    if (command === 'formatParagraph') return applyParagraph(view);
    if (command === 'formatHeading') return applyLinePrefix(view, `${value || '#'} `);
    if (command === 'formatItalic') return wrapSelection(view, '*', '*');
    if (command === 'formatLink') return wrapSelection(view, '[', '](url)');
    if (command === 'formatStrike') return wrapSelection(view, '~~', '~~');
    if (command === 'formatStrong') return wrapSelection(view, '**', '**');
    if (command === 'formatTable') return insertTable(view);
    if (command === 'formatTaskList') return applyLinePrefix(view, '- [ ] ');
    if (command === 'formatUnderline') return wrapSelection(view, '<u>', '</u>');
    if (command === 'indent') return indentMore(view);
    if (command === 'redo') return redo(view);
    if (command === 'selectAll') return selectAll(view);
    if (command === 'undo') return undo(view);
    if (command === 'save') {
      void activeSaveHandler?.();
      return Boolean(activeSaveHandler);
    }
    return false;
  };
}

export const inkstreamKeymap: readonly KeyBinding[] = [
  { key: 'Mod-s', preventDefault: true, run: editorCommand('save') },
  { key: 'Mod-b', preventDefault: true, run: editorCommand('formatStrong') },
  { key: 'Mod-i', preventDefault: true, run: editorCommand('formatItalic') },
  { key: 'Mod-Alt-1', preventDefault: true, run: editorCommand('formatHeading', '#') },
  { key: 'Mod-Alt-2', preventDefault: true, run: editorCommand('formatHeading', '##') },
  { key: 'Mod-Alt-3', preventDefault: true, run: editorCommand('formatHeading', '###') },
  { key: 'Mod-Alt-0', preventDefault: true, run: editorCommand('formatParagraph') },
  { key: 'Mod-Shift-x', preventDefault: true, run: editorCommand('formatStrike') },
  { key: 'Mod-u', preventDefault: true, run: editorCommand('formatUnderline') },
  { key: 'Tab', preventDefault: true, run: editorCommand('indent') },
  ...searchKeymap,
  ...historyKeymap,
  ...defaultKeymap,
];

export const inkstreamKeymapExtension = keymap.of(inkstreamKeymap);

function wrapSelection(view: EditorView, before: string, after: string): boolean {
  const range = view.state.selection.main;
  const selected = view.state.sliceDoc(range.from, range.to);
  const insert = `${before}${selected || ''}${after}`;
  const anchor = selected ? range.from + insert.length : range.from + before.length;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: { anchor },
    scrollIntoView: true,
  });
  return true;
}

function applyLinePrefix(view: EditorView, prefix: string): boolean {
  const range = view.state.selection.main;
  const line = view.state.doc.lineAt(range.from);
  const text = view.state.sliceDoc(line.from, line.to);
  const stripped = stripParagraphPrefix(text);
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: `${prefix}${stripped}` },
    selection: { anchor: line.from + prefix.length + Math.min(stripped.length, range.from - line.from) },
    scrollIntoView: true,
  });
  return true;
}

function applyParagraph(view: EditorView): boolean {
  const range = view.state.selection.main;
  const line = view.state.doc.lineAt(range.from);
  const text = view.state.sliceDoc(line.from, line.to);
  const stripped = stripParagraphPrefix(text);
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: stripped },
    selection: { anchor: line.from + Math.min(stripped.length, range.from - line.from) },
    scrollIntoView: true,
  });
  return true;
}

function insertTable(view: EditorView): boolean {
  const range = view.state.selection.main;
  const table = '| Column | Column |\n| --- | --- |\n|  |  |';
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: table },
    selection: { anchor: range.from + 2, head: range.from + 8 },
    scrollIntoView: true,
  });
  return true;
}

function clearFormat(view: EditorView): boolean {
  const range = view.state.selection.main;
  if (!range.empty) {
    const selected = view.state.sliceDoc(range.from, range.to);
    const cleaned = cleanInlineFormatting(stripParagraphPrefix(selected));
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: cleaned },
      selection: { anchor: range.from, head: range.from + cleaned.length },
      scrollIntoView: true,
    });
    return true;
  }

  const line = view.state.doc.lineAt(range.from);
  const text = view.state.sliceDoc(line.from, line.to);
  const cleaned = cleanInlineFormatting(stripParagraphPrefix(text));
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: cleaned },
    selection: { anchor: line.from + Math.min(cleaned.length, range.from - line.from) },
    scrollIntoView: true,
  });
  return true;
}

function stripParagraphPrefix(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, '')
    .replace(/^>\s?/, '')
    .replace(/^[-*+]\s+\[[ xX]\]\s+/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+[.)]\s+/, '');
}

function cleanInlineFormatting(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~~([^~\n]+)~~/g, '$1')
    .replace(/==([^=\n]+)==/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/<u>(.*?)<\/u>/gi, '$1')
    .replace(/\[([^\]\n]+)\]\([^)]+\)/g, '$1');
}
