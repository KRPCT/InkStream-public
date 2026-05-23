import {
  create,
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import { ask, open, save } from '@tauri-apps/plugin-dialog';
import type { FileNode, PandocExportOptions, PandocImportOptions, PandocJobResult, PandocProbeResult } from '@/types';
import { pandocExport, pandocImport, pandocProbe } from './pandoc';
import { invokeBackend } from './tauri';

const textExtensions = new Set([
  '.md',
  '.markdown',
  '.mdown',
  '.txt',
  '.tex',
  '.typ',
  '.typst',
  '.json',
  '.yaml',
  '.yml',
  '.html',
  '.css',
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.rs',
  '.py',
  '.sh',
]);

export async function selectVaultPath(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false });
  return typeof selected === 'string' ? selected : null;
}

export async function selectFilePath(): Promise<string | null> {
  const selected = await open({
    directory: false,
    multiple: false,
    filters: [
      { name: 'Documents', extensions: ['md', 'markdown', 'txt', 'tex', 'typ', 'typst', 'docx', 'rtf', 'epub'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return typeof selected === 'string' ? selected : null;
}

export async function selectImportPath(): Promise<string | null> {
  const selected = await open({
    directory: false,
    multiple: false,
    filters: [
      { name: 'Importable documents', extensions: ['docx', 'rtf', 'tex', 'latex', 'epub', 'html', 'md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return typeof selected === 'string' ? selected : null;
}

export async function selectSavePath(defaultPath?: string): Promise<string | null> {
  const selected = await save({
    defaultPath,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return typeof selected === 'string' ? selected : null;
}

export async function selectExportPath(defaultPath?: string): Promise<string | null> {
  const selected = await save({
    defaultPath,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Word', extensions: ['docx'] },
      { name: 'HTML', extensions: ['html'] },
      { name: 'EPUB', extensions: ['epub'] },
      { name: 'RTF', extensions: ['rtf'] },
      { name: 'LaTeX', extensions: ['tex'] },
      { name: 'Typst', extensions: ['typ'] },
      { name: 'Markdown', extensions: ['md'] },
    ],
  });
  return typeof selected === 'string' ? selected : null;
}

export async function openFile(path: string): Promise<string> {
  try {
    const result = await invokeBackend<{ ok: boolean; content?: string; error?: string }>('read_text_document', { path });
    if (!result.ok) throw new Error(result.error ?? `Unable to read ${path}`);
    return result.content ?? '';
  } catch (error) {
    if (isBackendPreviewError(error)) return await readTextFile(path);
    throw error;
  }
}

export async function saveFile(path: string, content: string): Promise<void> {
  try {
    const result = await invokeBackend<{ ok: boolean; error?: string }>('write_text_document', { path, content });
    if (!result.ok) throw new Error(result.error ?? `Unable to write ${path}`);
  } catch (error) {
    if (isBackendPreviewError(error)) {
      await writeTextFile(path, content);
      return;
    }
    throw error;
  }
}

export async function readWorkspaceTree(rootPath: string): Promise<FileNode[]> {
  return readDirectory(rootPath, rootPath, 0);
}

export async function createWorkspaceFile(path: string, content = ''): Promise<void> {
  if (await exists(path)) return;
  await create(path);
  if (content) await writeTextFile(path, content);
}

export async function createWorkspaceFolder(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function renameWorkspaceEntry(from: string, to: string): Promise<void> {
  await rename(from, to);
}

export async function deleteWorkspaceEntry(path: string): Promise<void> {
  await remove(path, { recursive: true });
}

export async function promptSaveChanges(filename: string): Promise<'save' | 'discard' | 'cancel'> {
  const saveChoice = await ask(`文件 "${filename}" 有未保存的更改。`, {
    title: '保存更改',
    okLabel: '保存',
    cancelLabel: '不保存',
  });

  if (saveChoice) return 'save';

  const discardConfirm = await ask(`确定丢弃对 "${filename}" 的更改吗？此操作无法撤销。`, {
    title: '确认丢弃',
    okLabel: '丢弃更改',
    cancelLabel: '取消',
  });

  return discardConfirm ? 'discard' : 'cancel';
}

export async function probePandoc(path?: string): Promise<PandocProbeResult> {
  return pandocProbe(path);
}

export async function exportWithPandoc(options: PandocExportOptions): Promise<PandocJobResult> {
  return pandocExport(options);
}

export async function importWithPandoc(options: PandocImportOptions): Promise<PandocJobResult> {
  return pandocImport(options);
}

async function readDirectory(path: string, rootPath: string, depth: number): Promise<FileNode[]> {
  if (depth > 6) return [];
  const entries = await readDir(path);
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.obsidian') continue;
    const fullPath = joinPath(path, entry.name);
    if (entry.isDirectory) {
      const children = await readDirectory(fullPath, rootPath, depth + 1);
      nodes.push({
        id: fullPath,
        name: entry.name,
        path: fullPath,
        type: 'directory',
        children,
      });
      continue;
    }

    if (!isTextFile(entry.name)) continue;
    nodes.push({
      id: fullPath,
      name: entry.name,
      path: fullPath,
      type: 'file',
    });
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function isTextFile(name: string): boolean {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot === -1) return false;
  return textExtensions.has(lower.slice(dot));
}

export function joinPath(base: string, name: string): string {
  const separator = base.includes('\\') ? '\\' : '/';
  return `${base.replace(/[\\/]+$/, '')}${separator}${name}`;
}

function isBackendPreviewError(error: unknown): boolean {
  return error instanceof Error && error.message === 'Tauri backend unavailable in browser preview';
}
