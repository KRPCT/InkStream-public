import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { createExtensions, fencedCodeLanguages } from './markdown-extensions';
import { livePreviewPlugin } from './live-preview';

describe('Markdown Extensions Factory', () => {
  it('should export createExtensions function', () => {
    expect(createExtensions).toBeDefined();
    expect(typeof createExtensions).toBe('function');
  });

  it('should return an array of extensions', () => {
    const extensions = createExtensions('source');
    expect(Array.isArray(extensions)).toBe(true);
    expect(extensions.length).toBeGreaterThan(0);
  });

  it('should include markdown language support', () => {
    const extensions = createExtensions('source');
    // Create a state to verify extensions work
    const state = EditorState.create({
      doc: '# Test',
      extensions,
    });
    expect(state).toBeDefined();
  });

  it('should expose Phase 3 fenced code languages', () => {
    const names = fencedCodeLanguages.map((language) => language.name);

    expect(names).toEqual([
      'Markdown',
      'LaTeX',
      'Typst',
      'JavaScript',
      'TypeScript',
      'Python',
      'Rust',
      'JSON',
      'YAML',
      'HTML',
      'CSS',
      'Shell',
    ]);
  });

  it('should NOT include livePreviewPlugin in source mode', () => {
    const extensions = createExtensions('source');
    // Check that extensions array doesn't include livePreviewPlugin
    const hasLivePreview = extensions.some((ext: any) =>
      Array.isArray(ext) ? ext.includes(livePreviewPlugin) : ext === livePreviewPlugin,
    );
    expect(hasLivePreview).toBe(false);
  });

  it('should include livePreviewPlugin in live mode', () => {
    const extensions = createExtensions('live');
    // Check that extensions array includes livePreviewPlugin
    const hasLivePreview = extensions.some((ext: any) =>
      Array.isArray(ext) ? ext.includes(livePreviewPlugin) : ext === livePreviewPlugin,
    );
    expect(hasLivePreview).toBe(true);
  });

  it('should create working EditorView with source mode extensions', () => {
    const state = EditorState.create({
      doc: '# Hello World',
      extensions: createExtensions('source'),
    });

    const view = new EditorView({ state });
    expect(view).toBeDefined();
    expect(view.state.doc.toString()).toBe('# Hello World');

    view.destroy();
  });

  it('should create working EditorView with live mode extensions', () => {
    const state = EditorState.create({
      doc: '# Hello World',
      extensions: createExtensions('live'),
    });

    const view = new EditorView({ state });
    expect(view).toBeDefined();
    expect(view.state.doc.toString()).toBe('# Hello World');

    view.destroy();
  });
});
