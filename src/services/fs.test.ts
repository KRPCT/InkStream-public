import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectVaultPath, openFile, saveFile, promptSaveChanges } from './fs';

const invokeMock = vi.fn();

// Mock Tauri plugins
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  ask: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

describe('fs service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, '__TAURI_INTERNALS__', {
      configurable: true,
      value: { invoke: vi.fn() },
    });
  });

  describe('selectVaultPath', () => {
    it('returns path string when user selects directory', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      vi.mocked(open).mockResolvedValue('/path/to/vault');

      const result = await selectVaultPath();

      expect(result).toBe('/path/to/vault');
      expect(open).toHaveBeenCalledWith({ directory: true, multiple: false });
    });

    it('returns null when user cancels', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      vi.mocked(open).mockResolvedValue(null);

      const result = await selectVaultPath();

      expect(result).toBeNull();
    });
  });

  describe('openFile', () => {
    it('reads file content from path', async () => {
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      invokeMock.mockRejectedValue(new Error('Tauri backend unavailable in browser preview'));
      Reflect.deleteProperty(globalThis, '__TAURI_INTERNALS__');
      vi.mocked(readTextFile).mockResolvedValue('# Test Content');

      const result = await openFile('/path/to/file.md');

      expect(result).toBe('# Test Content');
      expect(readTextFile).toHaveBeenCalledWith('/path/to/file.md');
    });

    it('reads through the backend command in Tauri shell', async () => {
      invokeMock.mockResolvedValue({ ok: true, content: '# Shell Content' });

      const result = await openFile('/path/to/file.md');

      expect(result).toBe('# Shell Content');
      expect(invokeMock).toHaveBeenCalledWith('read_text_document', { path: '/path/to/file.md' });
    });
  });

  describe('saveFile', () => {
    it('writes content to file path', async () => {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      invokeMock.mockRejectedValue(new Error('Tauri backend unavailable in browser preview'));
      Reflect.deleteProperty(globalThis, '__TAURI_INTERNALS__');
      vi.mocked(writeTextFile).mockResolvedValue();

      await saveFile('/path/to/file.md', '# Updated Content');

      expect(writeTextFile).toHaveBeenCalledWith('/path/to/file.md', '# Updated Content');
    });

    it('writes through the backend command in Tauri shell', async () => {
      invokeMock.mockResolvedValue({ ok: true, path: '/path/to/file.md' });

      await saveFile('/path/to/file.md', '# Updated Content');

      expect(invokeMock).toHaveBeenCalledWith('write_text_document', {
        path: '/path/to/file.md',
        content: '# Updated Content',
      });
    });
  });

  describe('promptSaveChanges', () => {
    it('returns "save" when user chooses to save', async () => {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      vi.mocked(ask).mockResolvedValue(true);

      const result = await promptSaveChanges('test.md');

      expect(result).toBe('save');
      expect(ask).toHaveBeenCalledTimes(1);
    });

    it('returns "discard" when user confirms discard', async () => {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      vi.mocked(ask)
        .mockResolvedValueOnce(false) // First dialog: don't save
        .mockResolvedValueOnce(true);  // Second dialog: confirm discard

      const result = await promptSaveChanges('test.md');

      expect(result).toBe('discard');
      expect(ask).toHaveBeenCalledTimes(2);
    });

    it('returns "cancel" when user cancels discard confirmation', async () => {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      vi.mocked(ask)
        .mockResolvedValueOnce(false) // First dialog: don't save
        .mockResolvedValueOnce(false); // Second dialog: cancel discard

      const result = await promptSaveChanges('test.md');

      expect(result).toBe('cancel');
      expect(ask).toHaveBeenCalledTimes(2);
    });
  });
});
