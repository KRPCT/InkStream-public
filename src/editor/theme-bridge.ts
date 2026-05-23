import { EditorView } from '@codemirror/view';

/**
 * InkStream Theme Bridge for CodeMirror 6
 *
 * Bridges ORACLE §5 CSS variables to CM6 theme system:
 * - All colors reference CSS variables (--text-normal, --background-primary, etc.)
 * - Supports theme switching via CSS variable updates (no JS theme reload needed)
 * - Defines Live Preview decoration styles (.cm-heading-N, .cm-strong, etc.)
 *
 * CSS variables defined in inkstream/public/theme.css:
 * - --text-normal, --text-muted, --text-faint
 * - --background-primary, --background-secondary
 * - --background-modifier-active, --background-modifier-border
 * - --accent (changes per mode: Standard/Academic/Creative)
 * - --font-text, --font-mono
 */
export const inkstreamTheme = EditorView.theme({
  // Base editor styles
  '&': {
    color: 'var(--text-normal)',
    backgroundColor: 'var(--background-primary)',
    fontSize: '14px',
    fontFamily: 'var(--font-text)',
    height: '100%',
  },
  '.cm-content': {
    caretColor: 'var(--accent)',
    fontFamily: 'var(--font-text)',
    padding: '16px',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--background-modifier-active)',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--background-modifier-active)',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--background-primary)',
    color: 'var(--text-muted)',
    border: 'none',
  },

  // Live Preview decoration styles (8 types per D-01)

  // 1. Headings H1-H6
  '.cm-heading-1': {
    fontSize: '2em',
    fontWeight: 'bold',
    color: 'var(--text-normal)',
    lineHeight: '1.3',
  },
  '.cm-heading-2': {
    fontSize: '1.5em',
    fontWeight: 'bold',
    color: 'var(--text-normal)',
    lineHeight: '1.3',
  },
  '.cm-heading-3': {
    fontSize: '1.25em',
    fontWeight: 'bold',
    color: 'var(--text-normal)',
    lineHeight: '1.3',
  },
  '.cm-heading-4': {
    fontSize: '1.1em',
    fontWeight: 'bold',
    color: 'var(--text-normal)',
    lineHeight: '1.3',
  },
  '.cm-heading-5': {
    fontSize: '1em',
    fontWeight: 'bold',
    color: 'var(--text-normal)',
    lineHeight: '1.3',
  },
  '.cm-heading-6': {
    fontSize: '0.9em',
    fontWeight: 'bold',
    color: 'var(--text-muted)',
    lineHeight: '1.3',
  },

  // 2. Bold **text**
  '.cm-strong': {
    fontWeight: 'bold',
  },

  // 3. Italic *text*
  '.cm-em': {
    fontStyle: 'italic',
  },

  // 4. Links [text](url)
  '.cm-link': {
    color: 'var(--accent)',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  '.cm-inline-comment': {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },

  // 5. Inline code `code`
  '.cm-inline-code': {
    fontFamily: 'var(--font-mono)',
    backgroundColor: 'var(--background-secondary)',
    padding: '1px 4px',
    borderRadius: '2px',
    fontSize: '0.9em',
  },

  // 6. Blockquote > text
  '.cm-quote': {
    borderLeft: '3px solid var(--accent)',
    paddingLeft: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },

  // 7. Horizontal rule ---
  '.cm-hr': {
    borderTop: '2px solid var(--background-modifier-border)',
    margin: '16px 0',
    display: 'block',
  },

  // 8. Lists (bullet/ordered)
  '.cm-list': {
    paddingLeft: '24px',
  },
  '.ink-markdown-table': {
    width: 'calc(100% - 32px)',
    margin: '8px 16px 16px',
    borderCollapse: 'collapse',
    border: '1px solid var(--background-modifier-border)',
    color: 'var(--text-normal)',
    backgroundColor: 'var(--background-primary)',
    cursor: 'text',
    fontFamily: 'var(--font-text)',
  },
  '.ink-markdown-table th, .ink-markdown-table td': {
    border: '1px solid var(--background-modifier-border)',
    padding: '6px 10px',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  '.ink-markdown-table th': {
    backgroundColor: 'var(--background-secondary)',
    fontWeight: '600',
  },
  '.ink-markdown-table [contenteditable="true"]:focus': {
    outline: '2px solid var(--accent)',
    outlineOffset: '-2px',
    backgroundColor: 'var(--background-primary)',
  },

  '.ink-fenced-block': {
    border: '1px solid var(--background-modifier-border)',
    borderRadius: 'var(--radius-s)',
    margin: '8px 16px 16px',
    backgroundColor: 'var(--background-secondary)',
    overflow: 'hidden',
    fontFamily: 'var(--font-ui)',
  },
  '.ink-fenced-block__header': {
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '4px 8px',
    borderBottom: '1px solid var(--background-modifier-border)',
  },
  '.ink-fenced-block__title': {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
  },
  '.ink-fenced-block__controls': {
    display: 'inline-flex',
    gap: '4px',
  },
  '.ink-fenced-block__mode': {
    minWidth: '44px',
    minHeight: '24px',
    padding: '0 8px',
    border: '1px solid var(--background-modifier-border)',
    borderRadius: 'var(--radius-s)',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--background-primary)',
    fontSize: '12px',
    lineHeight: '22px',
    cursor: 'pointer',
  },
  '.ink-fenced-block__mode--active': {
    color: 'var(--text-normal)',
    borderColor: 'var(--accent)',
  },
  '.ink-fenced-block__delete': {
    minWidth: '42px',
    minHeight: '24px',
    padding: '0 8px',
    border: '1px solid var(--background-modifier-border)',
    borderRadius: 'var(--radius-s)',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--background-primary)',
    fontSize: '12px',
    lineHeight: '22px',
    cursor: 'pointer',
  },
  '.ink-fenced-block__delete:hover': {
    color: 'var(--text-error)',
    borderColor: 'var(--text-error)',
  },
  '.ink-fenced-block__body': {
    display: 'grid',
    gap: '0',
  },
  '.ink-fenced-block__body--split': {
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  },
  '.ink-fenced-block__source': {
    minHeight: '56px',
    margin: '0',
    padding: '12px',
    overflow: 'auto',
    color: 'var(--code-normal)',
    backgroundColor: 'var(--code-background)',
    borderRight: '1px solid var(--background-modifier-border)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    whiteSpace: 'pre-wrap',
  },
  '.ink-fenced-block__render': {
    minHeight: '56px',
    padding: '12px',
    overflow: 'auto',
    color: 'var(--text-normal)',
    backgroundColor: 'var(--background-primary)',
    fontSize: '14px',
  },
  '.ink-fenced-block__render svg': {
    maxWidth: '100%',
  },
  '.ink-inline-math': {
    color: 'var(--text-normal)',
  },
  '.ink-inline-math .katex': {
    color: 'inherit',
  },
  '.ink-inline-math--error': {
    color: 'var(--text-error)',
    fontFamily: 'var(--font-mono)',
  },
  '.ink-fenced-block__source-editor': {
    width: '100%',
    resize: 'vertical',
    border: '0',
    outline: '0',
    lineHeight: '1.55',
    boxSizing: 'border-box',
  },
  '.ink-fenced-block--typst .ink-fenced-block__render .typst-doc': {
    color: 'var(--text-normal)',
    backgroundColor: 'transparent',
  },
  '.ink-fenced-block--typst .ink-fenced-block__render svg': {
    color: 'var(--text-normal)',
  },
  '.ink-fenced-block--typst .ink-fenced-block__render .typst-doc [fill="#000"], .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [fill="#000000"], .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [fill="black"]': {
    fill: 'currentColor',
  },
  '.ink-fenced-block--typst .ink-fenced-block__render .typst-doc [stroke="#000"], .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [stroke="#000000"], .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [stroke="black"]': {
    stroke: 'currentColor',
  },
  'body.theme-dark & .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [fill="#fff"], body.theme-dark & .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [fill="#ffffff"], body.theme-dark & .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [fill="white"]': {
    fill: 'var(--background-primary)',
  },
  'body.theme-dark & .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [stroke="#fff"], body.theme-dark & .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [stroke="#ffffff"], body.theme-dark & .ink-fenced-block--typst .ink-fenced-block__render .typst-doc [stroke="white"]': {
    stroke: 'var(--background-primary)',
  },
  '.ink-fenced-block__error': {
    margin: '0',
    color: 'var(--text-error)',
    whiteSpace: 'pre-wrap',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
  },
});
