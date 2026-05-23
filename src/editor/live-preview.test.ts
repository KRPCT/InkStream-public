import { describe, it, expect, vi } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { createExtensions } from './markdown-extensions';

describe('Live Preview Plugin', () => {
  it('renders inactive headings and inline formatting without Markdown markers', () => {
    const doc = '# Heading\n\nParagraph with **bold**, *italic*, ~~gone~~, `code`, [site](https://example.com), and <!-- note -->.\n\nCursor.';
    const view = viewFor(doc, doc.length);

    expect(view.dom.querySelector('.cm-heading-1')?.textContent).toBe('Heading');
    expect(view.dom.querySelector('.cm-strong')?.textContent).toBe('bold');
    expect(view.dom.querySelector('.cm-em')?.textContent).toBe('italic');
    expect(view.dom.querySelector('.cm-strike')?.textContent).toBe('gone');
    expect(view.dom.querySelector('.cm-inline-code')?.textContent).toBe('code');
    expect(view.dom.querySelector('.cm-link')?.textContent).toBe('site');
    expect(view.dom.querySelector('.cm-inline-comment')?.textContent?.trim()).toBe('note');
    expect(view.dom.textContent).not.toContain('**bold**');
    expect(view.dom.textContent).not.toContain('[site](https://example.com)');
    view.destroy();
  });

  it('keeps the active paragraph in source form for editing', () => {
    const doc = '# Heading\n\nParagraph with **bold**.';
    const view = viewFor(doc, doc.indexOf('bold'));

    expect(view.dom.textContent).toContain('Paragraph with **bold**.');
    expect(view.dom.querySelector('.cm-strong')).toBeNull();
    expect(view.dom.querySelector('.cm-heading-1')?.textContent).toBe('Heading');
    view.destroy();
  });

  it('places the cursor from click coordinates on formatted paragraph clicks', () => {
    const doc = '# Heading\n\nParagraph with **bold** and [site](https://example.com).\n\nCursor.';
    const view = viewFor(doc, doc.length);
    const target = doc.indexOf('bold') + 2;
    const posAtCoords = vi.spyOn(view, 'posAtCoords').mockReturnValue(target);

    const paragraphLine = view.dom.querySelector('.cm-strong')?.closest('.cm-line');
    expect(paragraphLine?.textContent).toContain('Paragraph with bold');

    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 20,
      clientY: 20,
    });
    paragraphLine?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(posAtCoords).toHaveBeenCalledWith({ x: 20, y: 20 }, false);
    expect(view.state.selection.main.head).toBe(target);
    expect(view.state.doc.lineAt(view.state.selection.main.head).text).toContain('Paragraph with **bold**');
    expect(view.dom.textContent).toContain('Paragraph with **bold** and [site](https://example.com).');
    posAtCoords.mockRestore();
    view.destroy();
  });

  it('jumps through in-document heading links without exposing link source', () => {
    const doc = '# Target Heading\n\nSee [target](#target-heading).\n\nCursor.';
    const view = viewFor(doc, doc.length);

    view.dom.querySelector('.cm-link')?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );

    expect(view.state.doc.lineAt(view.state.selection.main.head).text).toBe('# Target Heading');
    expect(view.dom.textContent).not.toContain('[target](#target-heading)');
    view.destroy();
  });

  it('opens external Markdown links without moving the editor into link source', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const doc = '# Heading\n\nOpen [site](https://example.com).\n\nCursor.';
    const view = viewFor(doc, doc.length);

    view.dom.querySelector('.cm-link')?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );

    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    expect(view.state.doc.lineAt(view.state.selection.main.head).text).toBe('Cursor.');
    expect(view.dom.textContent).not.toContain('[site](https://example.com)');
    open.mockRestore();
    view.destroy();
  });

  it('opens table Markdown links without switching the cell into source editing', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const doc = '| Name | Link |\n| --- | --- |\n| Alpha | [site](https://example.com) |\n\nAfter table.';
    const view = viewFor(doc, doc.length);

    const cell = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td:nth-child(2)');
    cell!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, cancelable: true }));
    const link = view.dom.querySelector<HTMLAnchorElement>('.ink-markdown-table a');
    link?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    expect(cell?.querySelector('a')?.textContent).toBe('site');
    expect(cell?.textContent).not.toContain('[site](https://example.com)');
    expect(view.state.doc.lineAt(view.state.selection.main.head).text).toBe('After table.');
    open.mockRestore();
    view.destroy();
  });

  it('jumps table Markdown anchor links without switching the cell into source editing', () => {
    const doc = '# Target\n\n| Name | Link |\n| --- | --- |\n| Alpha | [target](#target) |\n\nAfter table.';
    const view = viewFor(doc, doc.length);

    const cell = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td:nth-child(2)');
    cell!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, cancelable: true }));
    view.dom.querySelector<HTMLAnchorElement>('.ink-markdown-table a')?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );

    expect(view.state.doc.lineAt(view.state.selection.main.head).text).toBe('# Target');
    expect(cell?.querySelector('a')?.textContent).toBe('target');
    expect(cell?.textContent).not.toContain('[target](#target)');
    view.destroy();
  });

  it('renders inactive GitHub Markdown tables as a table preview', () => {
    const doc = '| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n\nAfter table.';
    const view = viewFor(doc, doc.length);

    const table = view.dom.querySelector('.ink-markdown-table');
    expect(table).not.toBeNull();
    expect(table?.querySelectorAll('th')).toHaveLength(2);
    expect(table?.querySelector('tbody')?.textContent).toContain('Alpha');
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it('keeps decoration order stable when a table is followed by a fenced block', () => {
    const doc = [
      '| Name | Value |',
      '| --- | --- |',
      '| Alpha | 1 |',
      '',
      '```math',
      '\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}',
      '```',
      '',
      'After.',
    ].join('\n');

    const view = viewFor(doc, doc.length);

    expect(view.dom.querySelector('.ink-markdown-table')).not.toBeNull();
    expect(view.dom.querySelector('.ink-fenced-block--math')).not.toBeNull();
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it('edits table cells in place while keeping Markdown as source of truth', () => {
    const doc = '| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n\nAfter table.';
    const view = viewFor(doc, doc.length);

    const cell = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td');
    expect(cell).toHaveAttribute('contenteditable', 'true');
    cell!.textContent = 'Beta';
    cell!.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(view.state.doc.toString()).toContain('| Beta | 1 |');
    expect(view.dom.querySelector('.ink-markdown-table')).not.toBeNull();
    view.destroy();
  });

  it('renders inline Markdown inside table cells before in-place editing', () => {
    const doc = '| Name | Note |\n| --- | --- |\n| Alpha | **Bold** and [site](https://example.com) |\n\nAfter table.';
    const view = viewFor(doc, doc.length);

    const note = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td:nth-child(2)');

    expect(note?.querySelector('strong')?.textContent).toBe('Bold');
    expect(note?.querySelector('a')?.textContent).toBe('site');
    expect(note?.textContent).not.toContain('**Bold**');
    expect(view.state.doc.toString()).toBe(doc);
    view.destroy();
  });

  it('reveals table cell Markdown source on content click and edits that source in place', () => {
    const doc = '| Name | Note |\n| --- | --- |\n| Alpha | **Bold** and [site](https://example.com) |\n\nAfter table.';
    const view = viewFor(doc, doc.length);

    const note = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td:nth-child(2)');
    expect(note?.querySelector('strong')?.textContent).toBe('Bold');

    note!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    expect(note?.textContent).toBe('**Bold** and [site](https://example.com)');

    note!.textContent = 'Changed **value**';
    note!.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(view.state.doc.toString()).toContain('| Alpha | Changed **value** |');
    view.destroy();
  });

  it('restores table cell preview after editing Markdown source', async () => {
    const doc = '| Name | Note |\n| --- | --- |\n| Alpha | **Bold** |\n\nAfter table.';
    const view = viewFor(doc, doc.length);

    const cell = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td:nth-child(2)');
    cell!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    cell!.textContent = 'Changed **value**';
    cell!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await Promise.resolve();

    const rebuilt = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td:nth-child(2)');
    rebuilt!.dispatchEvent(new FocusEvent('blur', { bubbles: false }));

    expect(rebuilt?.querySelector('strong')?.textContent).toBe('value');
    expect(rebuilt?.textContent).toBe('Changed value');
    expect(view.state.doc.toString()).toContain('| Alpha | Changed **value** |');
    view.destroy();
  });

  it('restores table cell preview when clicking outside the edited cell', async () => {
    const doc = '| Name | Note |\n| --- | --- |\n| Alpha | **Bold** |\n\nAfter table.';
    const view = viewFor(doc, doc.length);

    const cell = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td:nth-child(2)');
    cell!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    cell!.textContent = 'Changed **value**';
    cell!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await Promise.resolve();

    view.dom.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    const rebuilt = view.dom.querySelector<HTMLTableCellElement>('.ink-markdown-table tbody td:nth-child(2)');
    expect(rebuilt?.querySelector('strong')?.textContent).toBe('value');
    expect(rebuilt?.textContent).toBe('Changed value');
    view.destroy();
  });
});

function viewFor(doc: string, anchor: number) {
  return new EditorView({
    state: EditorState.create({
      doc,
      selection: { anchor },
      extensions: createExtensions('live'),
    }),
  });
}
