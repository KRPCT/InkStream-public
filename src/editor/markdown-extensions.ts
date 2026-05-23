import { Extension } from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
} from '@codemirror/view';
import { history } from '@codemirror/commands';
import { search } from '@codemirror/search';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { LanguageDescription, LanguageSupport, StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { livePreviewExtensions, livePreviewPlugin } from './live-preview';
import { inlineMathPreviewPlugin } from './inline-math-preview';
import { blockMathPreviewPlugin } from './block-math-preview';
import { inkstreamTheme } from './theme-bridge';
import { maybeExpandSlashTrigger } from './block-commands';
import { inkstreamFencedBlock, type FencedBlockExtensionConfig } from './fenced-block-extension';
import { inkstreamKeymapExtension } from './editor-commands';

export const fencedCodeLanguages = [
  LanguageDescription.of({
    name: 'Markdown',
    alias: ['markdown', 'md'],
    support: markdown({ addKeymap: false }),
  }),
  LanguageDescription.of({
    name: 'LaTeX',
    alias: ['latex', 'tex'],
    support: new LanguageSupport(StreamLanguage.define(stex)),
  }),
  LanguageDescription.of({
    name: 'Typst',
    alias: ['typst'],
    support: new LanguageSupport(StreamLanguage.define(stex)),
  }),
  LanguageDescription.of({
    name: 'JavaScript',
    alias: ['javascript', 'js'],
    support: javascript(),
  }),
  LanguageDescription.of({
    name: 'TypeScript',
    alias: ['typescript', 'ts'],
    support: javascript({ typescript: true }),
  }),
  LanguageDescription.of({
    name: 'Python',
    alias: ['python', 'py'],
    support: python(),
  }),
  LanguageDescription.of({
    name: 'Rust',
    alias: ['rust', 'rs'],
    support: rust(),
  }),
  LanguageDescription.of({
    name: 'JSON',
    alias: ['json'],
    support: json(),
  }),
  LanguageDescription.of({
    name: 'YAML',
    alias: ['yaml', 'yml'],
    support: yaml(),
  }),
  LanguageDescription.of({
    name: 'HTML',
    alias: ['html'],
    support: html(),
  }),
  LanguageDescription.of({
    name: 'CSS',
    alias: ['css'],
    support: css(),
  }),
  LanguageDescription.of({
    name: 'Shell',
    alias: ['shell', 'sh', 'bash', 'zsh'],
    support: new LanguageSupport(StreamLanguage.define(shell)),
  }),
];

/**
 * Create CodeMirror 6 extensions configuration
 *
 * Factory function that returns appropriate extensions based on render mode:
 * - 'source': Raw Markdown source (no Live Preview decorations)
 * - 'live': Live Preview mode (with decorations for headings, bold, italic, etc.)
 *
 * All modes include:
 * - Markdown language support (@codemirror/lang-markdown)
 * - Default keymap (Ctrl+Z undo, Ctrl+Y redo, etc.)
 * - InkStream theme (CSS variable bridge)
 *
 * @param renderMode - 'source' or 'live'
 * @returns Array of CodeMirror 6 extensions
 */
export function createExtensions(
  renderMode: 'source' | 'live',
  fencedBlockConfig: FencedBlockExtensionConfig = {},
): Extension[] {
  const extensions: Extension[] = [
    markdown({ base: markdownLanguage, codeLanguages: fencedCodeLanguages }),
    history(),
    search({ top: true }),
    dropCursor(),
    drawSelection(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    keymap.of([
      {
        key: 'Space',
        run: maybeExpandSlashTrigger,
      },
      {
        key: 'Enter',
        run: maybeExpandSlashTrigger,
      },
    ]),
    inkstreamKeymapExtension,
    inkstreamTheme,
    inkstreamFencedBlock({ ...fencedBlockConfig, renderMode }),
  ];

  if (renderMode === 'live') {
    extensions.push(livePreviewExtensions);
    extensions.push(inlineMathPreviewPlugin);
    extensions.push(blockMathPreviewPlugin);
  }

  return extensions;
}
