import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistConfig } from '../services/persist';
import { parseDocumentLanguage } from '../editor/fenced-block-parser';
import type {
  DocumentLanguage,
  EditorMode,
  EditorSettings,
  FencedBlockViewMode,
  FileNode,
  RecentEntry,
  SidebarTab,
  TabState,
  Theme,
  VaultPath,
} from '../types';

export interface ZoteroItem {
  key: string;
  title: string;
  authors: string[];
  year: number;
  resolved: boolean;
}

export interface Scene {
  id: string;
  title: string;
  wordCount: number;
}

export interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
}

export interface Part {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface CreativeNovel {
  title: string;
  parts: Part[];
}

export interface Character {
  id: string;
  name: string;
  role: string;
}

export interface CodexEntry {
  id: string;
  type: 'character' | 'location' | 'setting';
  name: string;
  description: string;
}

export interface AppState {
  tabs: TabState[];
  activeTabId: string | null;
  vaultPath: VaultPath;
  fileTree: FileNode[];
  recentEntries: RecentEntry[];
  mode: EditorMode;
  theme: Theme;
  sidebarTab: SidebarTab;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  settings: EditorSettings;
  wordCount: number;
  cursorLine: number;
  cursorColumn: number;
  currentFile: string;
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  contextMenu: { x: number; y: number } | null;
  statusMessage: string;

  mockAcademicCitations: ZoteroItem[];
  mockCreativeNovel: CreativeNovel;
  mockCreativeCharacters: Character[];
  mockCreativeCodex: CodexEntry[];
  academicCitations: any[];
  wordGoal: number;
  focusMode: boolean;

  setMode: (mode: EditorMode) => void;
  setTheme: (theme: Theme) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  revealSidebarTab: (tab: SidebarTab) => void;
  setVaultPath: (path: VaultPath) => void;
  setFileTree: (tree: FileNode[]) => void;
  addRecentEntry: (entry: Omit<RecentEntry, 'openedAt'>) => void;
  openTab: (path: string, content: string, options?: { untitled?: boolean; title?: string; replace?: boolean }) => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabSaved: (tabId: string, path?: string) => void;
  setCursor: (line: number, column: number) => void;
  setWordCount: (count: number) => void;
  setBlockViewMode: (tabId: string, blockKey: string, mode: FencedBlockViewMode) => void;
  setDocumentLanguage: (tabId: string, language: DocumentLanguage) => void;
  setRenderMode: (tabId: string, renderMode: 'source' | 'live') => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleTheme: () => void;
  toggleFocus: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setContextMenu: (menu: { x: number; y: number } | null) => void;
  setStatusMessage: (message: string) => void;
  updateSettings: (settings: Partial<EditorSettings>) => void;
}

export const defaultSettings: EditorSettings = {
  fontSize: 16,
  defaultMode: 'standard',
  autoSave: false,
  autoSaveInterval: 30,
  lineWidth: 760,
  pandocPath: '',
  defaultExportDirectory: '',
  defaultExportFormat: 'pdf',
  renderMathByDefault: true,
  typstDarkMode: true,
};

const mockAcademicCitations: ZoteroItem[] = [
  { key: 'smith2023', title: 'Deep Learning for NLP', authors: ['Smith, J.'], year: 2023, resolved: true },
  { key: 'li2024', title: '自然语言处理前沿', authors: ['李明'], year: 2024, resolved: true },
  { key: 'brown2020', title: 'Transformer Architecture', authors: ['Brown, T.', 'Mann, B.'], year: 2020, resolved: true },
  { key: 'UNRESOLVED', title: '', authors: [], year: 0, resolved: false },
];

const mockCreativeNovel: CreativeNovel = {
  title: '后续阶段占位',
  parts: [
    {
      id: 'part-1',
      title: 'Creative workspace',
      chapters: [
        {
          id: 'ch-1',
          title: '章节导航将在后续阶段接入',
          scenes: [{ id: 'sc-1-1', title: '当前先完成基础编辑器', wordCount: 0 }],
        },
      ],
    },
  ],
};

const mockCreativeCharacters: Character[] = [
  { id: 'char-1', name: '占位角色', role: '后续阶段' },
];

const mockCreativeCodex: CodexEntry[] = [
  { id: 'codex-1', type: 'character', name: '文献/关系图占位', description: '基础编辑能力完成后继续接入' },
];

function createTab(path: string, content: string, options: { untitled?: boolean; title?: string } = {}): TabState {
  const { language } = parseDocumentLanguage(content);
  return {
    id: crypto.randomUUID(),
    path,
    title: options.title,
    dirty: false,
    stateJSON: { doc: content },
    cursor: { line: 1, col: 1 },
    scroll: 0,
    renderMode: 'live',
    documentLanguage: language,
    blockViewModes: {},
    savedContent: content,
    untitled: options.untitled ?? false,
  };
}

function filename(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      vaultPath: null,
      fileTree: [],
      recentEntries: [],
      mode: 'standard',
      theme: 'light',
      sidebarTab: 'workspace',
      sidebarOpen: true,
      rightPanelOpen: true,
      settings: defaultSettings,
      wordCount: 0,
      cursorLine: 1,
      cursorColumn: 1,
      currentFile: '',
      commandPaletteOpen: false,
      settingsOpen: false,
      contextMenu: null,
      statusMessage: 'Ready',

      mockAcademicCitations,
      mockCreativeNovel,
      mockCreativeCharacters,
      mockCreativeCodex,
      academicCitations: [],
      wordGoal: 0,
      focusMode: false,

      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      revealSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true }),
      setVaultPath: (vaultPath) => set({ vaultPath }),
      setFileTree: (fileTree) => set({ fileTree }),
      addRecentEntry: (entry) =>
        set((state) => {
          const next: RecentEntry = {
            ...entry,
            label: entry.label || filename(entry.path),
            openedAt: new Date().toISOString(),
          };
          return {
            recentEntries: [
              next,
              ...state.recentEntries.filter((item) => item.path !== entry.path || item.kind !== entry.kind),
            ].slice(0, 12),
          };
        }),
      openTab: (path, content, options) => {
        const existing = get().tabs.find((tab) => tab.path === path && !tab.untitled);
        if (existing) {
          const shouldReplace = options?.replace === true;
          set((state) => ({
            tabs: state.tabs.map((tab) =>
              tab.id === existing.id && shouldReplace
                ? {
                    ...tab,
                    dirty: false,
                    stateJSON: { ...tab.stateJSON, doc: content },
                    savedContent: content,
                    documentLanguage: parseDocumentLanguage(content).language,
                    title: options?.title,
                  }
                : tab,
            ),
            activeTabId: existing.id,
            currentFile: existing.path,
            wordCount: countWords(shouldReplace ? content : existing.stateJSON.doc || ''),
          }));
          return;
        }
        const newTab = createTab(path, content, options);
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
          currentFile: path,
          wordCount: countWords(content),
          cursorLine: 1,
          cursorColumn: 1,
        }));
      },
      closeTab: (id) =>
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.id === id);
          const tabs = state.tabs.filter((tab) => tab.id !== id);
          const nextActive = state.activeTabId === id ? tabs[Math.max(0, index - 1)] ?? tabs[0] : tabs.find((tab) => tab.id === state.activeTabId);
          return {
            tabs,
            activeTabId: nextActive?.id ?? null,
            currentFile: nextActive?.path ?? '',
            wordCount: countWords(nextActive?.stateJSON.doc || ''),
          };
        }),
      switchTab: (id) => {
        const tab = get().tabs.find((item) => item.id === id);
        if (!tab) return;
        set({
          activeTabId: id,
          currentFile: tab.path,
          wordCount: countWords(tab.stateJSON.doc || ''),
          cursorLine: tab.cursor.line,
          cursorColumn: tab.cursor.col,
        });
      },
      updateTabContent: (tabId, content) => {
        const { language } = parseDocumentLanguage(content);
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  dirty: content !== (tab.savedContent ?? ''),
                  stateJSON: { ...tab.stateJSON, doc: content },
                  documentLanguage: language,
                }
              : tab,
          ),
          wordCount: state.activeTabId === tabId ? countWords(content) : state.wordCount,
        }));
      },
      markTabSaved: (tabId, path) =>
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id !== tabId) return tab;
            const nextPath = path ?? tab.path;
            return {
              ...tab,
              path: nextPath,
              title: undefined,
              dirty: false,
              savedContent: tab.stateJSON.doc || '',
              untitled: false,
            };
          }),
          currentFile: state.activeTabId === tabId ? path ?? state.currentFile : state.currentFile,
        })),
      setCursor: (line, column) =>
        set((state) => ({
          cursorLine: line,
          cursorColumn: column,
          tabs: state.activeTabId
            ? state.tabs.map((tab) =>
                tab.id === state.activeTabId ? { ...tab, cursor: { line, col: column } } : tab,
              )
            : state.tabs,
        })),
      setWordCount: (wordCount) => set({ wordCount }),
      setBlockViewMode: (tabId, blockKey, mode) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  blockViewModes: {
                    ...(tab.blockViewModes ?? {}),
                    [blockKey]: mode,
                  },
                }
              : tab,
          ),
        })),
      setDocumentLanguage: (tabId, language) =>
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, documentLanguage: language } : tab)),
        })),
      setRenderMode: (tabId, renderMode) =>
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, renderMode } : tab)),
        })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleFocus: () => set((state) => ({ focusMode: !state.focusMode })),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setContextMenu: (contextMenu) => set({ contextMenu }),
      setStatusMessage: (statusMessage) => set({ statusMessage }),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
          mode: settings.defaultMode ?? state.mode,
        })),
    }),
    persistConfig,
  ),
);

export function countWords(content: string): number {
  const matches = content.trim().match(/[\p{L}\p{N}_-]+/gu);
  return matches?.length ?? 0;
}
