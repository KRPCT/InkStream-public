import { useAppStore } from '@/stores/appStore';
import type { PandocFormat } from '@/types';
import {
  exportWithPandoc,
  importWithPandoc,
  openFile,
  probePandoc,
  readWorkspaceTree,
  saveFile,
  selectExportPath,
  selectFilePath,
  selectImportPath,
  selectSavePath,
  selectVaultPath,
} from './fs';

const markdownTemplate = '# Untitled\n\n';

export async function newUntitledDocument() {
  const state = useAppStore.getState();
  const index = state.tabs.filter((tab) => tab.untitled).length + 1;
  state.openTab(`Untitled-${index}.md`, markdownTemplate, { untitled: true, title: `Untitled-${index}.md` });
}

export async function openDocumentFromDialog(path?: string) {
  const target = path ?? (await selectFilePath());
  if (!target) return;
  const content = await openFile(target);
  const state = useAppStore.getState();
  state.openTab(target, content, { replace: true });
  state.addRecentEntry({ path: target, kind: 'file', label: filename(target) });
}

export async function openWorkspaceFromDialog(path?: string) {
  const target = path ?? (await selectVaultPath());
  if (!target) return;
  const tree = await readWorkspaceTree(target);
  const state = useAppStore.getState();
  state.setVaultPath(target);
  state.setFileTree(tree);
  state.revealSidebarTab('workspace');
  state.addRecentEntry({ path: target, kind: 'workspace', label: filename(target) || target });
}

export async function saveActiveDocument() {
  const state = useAppStore.getState();
  const tab = state.tabs.find((item) => item.id === state.activeTabId);
  if (!tab) return;

  let target = tab.untitled ? null : tab.path;
  if (!target) {
    target = await selectSavePath(tab.path.endsWith('.md') ? tab.path : `${tab.path}.md`);
    if (!target) return;
  }
  await saveFile(target, tab.stateJSON.doc || '');
  state.markTabSaved(tab.id, target);
  state.addRecentEntry({ path: target, kind: 'file', label: filename(target) });
  state.setStatusMessage(`已保存 ${filename(target)}`);
}

export async function saveActiveDocumentAs() {
  const state = useAppStore.getState();
  const tab = state.tabs.find((item) => item.id === state.activeTabId);
  if (!tab) return;
  const target = await selectSavePath(tab.path.endsWith('.md') ? tab.path : `${tab.path}.md`);
  if (!target) return;
  await saveFile(target, tab.stateJSON.doc || '');
  state.markTabSaved(tab.id, target);
  state.addRecentEntry({ path: target, kind: 'file', label: filename(target) });
  state.setStatusMessage(`已另存为 ${filename(target)}`);
}

export async function importDocumentFromDialog(format?: PandocFormat) {
  const target = await selectImportPath();
  if (!target) return;
  const from = format ?? formatFromPath(target);
  const state = useAppStore.getState();
  const result = await importWithPandoc({
    inputPath: target,
    from,
    pandocPath: state.settings.pandocPath || undefined,
  });
  if (!result.ok || typeof result.content !== 'string') {
    state.openTab(`Import failed.md`, `# Import failed\n\n${result.error ?? 'Pandoc import failed'}\n`, {
      untitled: true,
    });
    return;
  }
  state.openTab(`${filename(target)}.md`, result.content, { untitled: true });
}

export async function exportActiveDocument(format?: PandocFormat) {
  const state = useAppStore.getState();
  const tab = state.tabs.find((item) => item.id === state.activeTabId);
  if (!tab) return;
  const to = format ?? state.settings.defaultExportFormat;
  const probe = await probePandoc(state.settings.pandocPath || undefined);
  if (!probe.ok) {
    state.setSettingsOpen(true);
    state.openTab('Pandoc export error.md', `# Pandoc export unavailable\n\n${probe.error ?? 'Pandoc was not found.'}\n`, {
      untitled: true,
    });
    return;
  }
  const basePath = defaultExportBasePath(tab.path, state.settings.defaultExportDirectory);
  const defaultPath = withExtension(basePath, to);
  const outputPath = await selectExportPath(defaultPath);
  if (!outputPath) return;
  const result = await exportWithPandoc({
    outputPath,
    from: 'markdown',
    to,
    content: tab.stateJSON.doc || '',
    pandocPath: state.settings.pandocPath || undefined,
    standalone: true,
  });
  if (!result.ok) {
    state.openTab('Pandoc export error.md', `# Pandoc export failed\n\n${result.error ?? ''}\n\n${result.stderr ?? ''}\n`, {
      untitled: true,
    });
    state.setStatusMessage('导出失败');
    return;
  }
  state.setStatusMessage(`已导出 ${filename(outputPath)}`);
}

function filename(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

function withExtension(path: string, format: PandocFormat): string {
  const extension = format === 'latex' ? 'tex' : format === 'typst' ? 'typ' : format;
  if (/\.[^.\\/]+$/.test(path)) return path.replace(/\.[^.\\/]+$/, `.${extension}`);
  return `${path}.${extension}`;
}

function defaultExportBasePath(tabPath: string, directory: string): string {
  const defaultName = tabPath.replace(/^Untitled-\d+\.md$/, 'export.md');
  if (!directory.trim()) return defaultName;
  return `${directory.replace(/[\\/]+$/, '')}/${filename(defaultName)}`;
}

function formatFromPath(path: string): PandocFormat {
  const lower = path.toLowerCase();
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.rtf')) return 'rtf';
  if (lower.endsWith('.tex') || lower.endsWith('.latex')) return 'latex';
  if (lower.endsWith('.typ') || lower.endsWith('.typst')) return 'typst';
  if (lower.endsWith('.epub')) return 'epub';
  if (lower.endsWith('.html')) return 'html';
  return 'markdown';
}
