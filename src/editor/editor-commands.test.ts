import { describe, expect, it } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { editorCommand } from './editor-commands';

describe('editor commands', () => {
  it('formats paragraph headings and clears paragraph prefix', () => {
    const view = viewFor('plain text');

    editorCommand('formatHeading', '##')(view);

    expect(view.state.doc.toString()).toBe('## plain text');

    editorCommand('formatParagraph')(view);

    expect(view.state.doc.toString()).toBe('plain text');
    view.destroy();
  });

  it('formats bullet ordered and blockquote paragraphs without stacking prefixes', () => {
    const view = viewFor('plain text');

    editorCommand('formatBulletList')(view);
    expect(view.state.doc.toString()).toBe('- plain text');

    editorCommand('formatOrderedList')(view);
    expect(view.state.doc.toString()).toBe('1. plain text');

    editorCommand('formatBlockquote')(view);
    expect(view.state.doc.toString()).toBe('> plain text');

    editorCommand('formatTaskList')(view);
    expect(view.state.doc.toString()).toBe('- [ ] plain text');
    view.destroy();
  });

  it('wraps selected text with font formatting markers', () => {
    const view = viewFor('alpha beta', 6, 10);

    editorCommand('formatStrong')(view);
    expect(view.state.doc.toString()).toBe('alpha **beta**');

    view.destroy();
  });

  it('supports strike inline code and link formatting', () => {
    const view = viewFor('term', 0, 4);

    editorCommand('formatStrike')(view);
    expect(view.state.doc.toString()).toBe('~~term~~');

    const code = viewFor('code', 0, 4);
    editorCommand('formatInlineCode')(code);
    expect(code.state.doc.toString()).toBe('`code`');

    const link = viewFor('site', 0, 4);
    editorCommand('formatLink')(link);
    expect(link.state.doc.toString()).toBe('[site](url)');

    view.destroy();
    code.destroy();
    link.destroy();
  });

  it('supports underline highlight clear format and table insertion', () => {
    const underline = viewFor('word', 0, 4);
    editorCommand('formatUnderline')(underline);
    expect(underline.state.doc.toString()).toBe('<u>word</u>');

    const highlight = viewFor('mark', 0, 4);
    editorCommand('formatHighlight')(highlight);
    expect(highlight.state.doc.toString()).toBe('==mark==');

    const clear = viewFor('## **marked**', 0, '## **marked**'.length);
    editorCommand('formatClear')(clear);
    expect(clear.state.doc.toString()).toBe('marked');

    const table = viewFor('');
    editorCommand('formatTable')(table);
    expect(table.state.doc.toString()).toBe('| Column | Column |\n| --- | --- |\n|  |  |');

    underline.destroy();
    highlight.destroy();
    clear.destroy();
    table.destroy();
  });
});

function viewFor(doc: string, from = 0, to = from): EditorView {
  return new EditorView({
    state: EditorState.create({
      doc,
      selection: { anchor: from, head: to },
    }),
  });
}
