import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pandocExport, pandocImport, pandocProbe } from './pandoc';

const invokeMock = vi.fn();
const tauriInternals = { invoke: vi.fn() };

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

describe('pandoc service', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    Object.defineProperty(globalThis, '__TAURI_INTERNALS__', {
      configurable: true,
      value: tauriInternals,
    });
  });

  it('probes configured pandoc path', async () => {
    invokeMock.mockResolvedValue({ ok: true, path: 'pandoc', source: 'bundled', version: 'pandoc 3.7' });

    const result = await pandocProbe('C:/tools/pandoc.exe');

    expect(invokeMock).toHaveBeenCalledWith('pandoc_probe', { path: 'C:/tools/pandoc.exe' });
    expect(result.ok).toBe(true);
    expect(result.source).toBe('bundled');
  });

  it('exports through backend command', async () => {
    invokeMock.mockResolvedValue({ ok: true, outputPath: 'out.pdf', format: 'pdf' });

    const result = await pandocExport({
      outputPath: 'out.pdf',
      from: 'markdown',
      to: 'pdf',
      content: '# Title',
    });

    expect(invokeMock).toHaveBeenCalledWith('pandoc_export', {
      options: {
        outputPath: 'out.pdf',
        from: 'markdown',
        to: 'pdf',
        content: '# Title',
      },
    });
    expect(result.outputPath).toBe('out.pdf');
  });

  it('imports into markdown content', async () => {
    invokeMock.mockResolvedValue({ ok: true, content: '# Imported', format: 'markdown' });

    const result = await pandocImport({ inputPath: 'paper.docx', from: 'docx' });

    expect(invokeMock).toHaveBeenCalledWith('pandoc_import', {
      options: { inputPath: 'paper.docx', from: 'docx' },
    });
    expect(result.content).toBe('# Imported');
  });

  it('reports a structured backend unavailable error in browser preview', async () => {
    Reflect.deleteProperty(globalThis, '__TAURI_INTERNALS__');

    const result = await pandocProbe();

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Tauri backend unavailable in browser preview');
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
