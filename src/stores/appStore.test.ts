import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      tabs: [],
      activeTabId: null,
      vaultPath: null,
      mode: 'standard',
      theme: 'light',
      sidebarTab: 'workspace',
      sidebarOpen: true,
      rightPanelOpen: true,
      fileTree: [],
      recentEntries: [],
      settings: {
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
      },
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useAppStore.getState();

      expect(state.tabs).toEqual([]);
      expect(state.activeTabId).toBeNull();
      expect(state.vaultPath).toBeNull();
      expect(state.mode).toBe('standard');
      expect(state.theme).toBe('light');
      expect(state.sidebarTab).toBe('workspace');
      expect(state.sidebarOpen).toBe(true);
      expect(state.rightPanelOpen).toBe(true);
    });
  });

  describe('setMode', () => {
    it('updates mode', () => {
      useAppStore.getState().setMode('academic');
      expect(useAppStore.getState().mode).toBe('academic');

      useAppStore.getState().setMode('creative');
      expect(useAppStore.getState().mode).toBe('creative');
    });
  });

  describe('setTheme', () => {
    it('updates theme', () => {
      useAppStore.getState().setTheme('dark');
      expect(useAppStore.getState().theme).toBe('dark');

      useAppStore.getState().setTheme('light');
      expect(useAppStore.getState().theme).toBe('light');
    });
  });

  describe('setSidebarTab', () => {
    it('switches sidebar tab', () => {
      useAppStore.getState().setSidebarTab('git');
      expect(useAppStore.getState().sidebarTab).toBe('git');

      useAppStore.getState().setSidebarTab('workspace');
      expect(useAppStore.getState().sidebarTab).toBe('workspace');
    });
  });

  describe('revealSidebarTab', () => {
    it('opens the sidebar and selects the requested tab', () => {
      useAppStore.setState({ sidebarOpen: false, sidebarTab: 'workspace' });

      useAppStore.getState().revealSidebarTab('git');

      expect(useAppStore.getState().sidebarOpen).toBe(true);
      expect(useAppStore.getState().sidebarTab).toBe('git');
    });
  });

  describe('setVaultPath', () => {
    it('updates vault path', () => {
      useAppStore.getState().setVaultPath('/path/to/vault');
      expect(useAppStore.getState().vaultPath).toBe('/path/to/vault');
    });

    it('can set vault path to null', () => {
      useAppStore.getState().setVaultPath('/path/to/vault');
      useAppStore.getState().setVaultPath(null);
      expect(useAppStore.getState().vaultPath).toBeNull();
    });
  });

  describe('openTab', () => {
    it('creates new tab and sets as active', () => {
      useAppStore.getState().openTab('/test.md', '# Test Content');

      const state = useAppStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].path).toBe('/test.md');
      expect(state.tabs[0].dirty).toBe(false);
      expect(state.tabs[0].stateJSON.doc).toBe('# Test Content');
      expect(state.tabs[0].cursor).toEqual({ line: 1, col: 1 });
      expect(state.tabs[0].scroll).toBe(0);
      expect(state.tabs[0].renderMode).toBe('live');
      expect(state.tabs[0].documentLanguage).toBe('markdown');
      expect(state.tabs[0].blockViewModes).toEqual({});
      expect(state.tabs[0].savedContent).toBe('# Test Content');
      expect(state.activeTabId).toBe(state.tabs[0].id);
    });

    it('adds multiple tabs', () => {
      useAppStore.getState().openTab('/test1.md', 'Content 1');
      useAppStore.getState().openTab('/test2.md', 'Content 2');

      const state = useAppStore.getState();
      expect(state.tabs).toHaveLength(2);
      expect(state.tabs[0].path).toBe('/test1.md');
      expect(state.tabs[1].path).toBe('/test2.md');
      expect(state.activeTabId).toBe(state.tabs[1].id);
    });

    it('refreshes an existing real file tab when opened with replacement content', () => {
      useAppStore.getState().openTab('/imported.md', '');
      useAppStore.getState().updateTabContent(useAppStore.getState().activeTabId!, '');

      useAppStore.getState().openTab('/imported.md', '# Imported\n\n**saved**', { replace: true });

      const state = useAppStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].stateJSON.doc).toBe('# Imported\n\n**saved**');
      expect(state.tabs[0].savedContent).toBe('# Imported\n\n**saved**');
      expect(state.tabs[0].dirty).toBe(false);
      expect(state.activeTabId).toBe(state.tabs[0].id);
    });
  });

  describe('closeTab', () => {
    it('removes tab and switches to first remaining tab', () => {
      useAppStore.getState().openTab('/test1.md', 'Content 1');
      useAppStore.getState().openTab('/test2.md', 'Content 2');

      const firstTabId = useAppStore.getState().tabs[0].id;
      const secondTabId = useAppStore.getState().tabs[1].id;

      useAppStore.getState().closeTab(secondTabId);

      const state = useAppStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].id).toBe(firstTabId);
      expect(state.activeTabId).toBe(firstTabId);
    });

    it('sets activeTabId to null when closing last tab', () => {
      useAppStore.getState().openTab('/test.md', 'Content');
      const tabId = useAppStore.getState().tabs[0].id;

      useAppStore.getState().closeTab(tabId);

      const state = useAppStore.getState();
      expect(state.tabs).toHaveLength(0);
      expect(state.activeTabId).toBeNull();
    });
  });

  describe('switchTab', () => {
    it('updates activeTabId', () => {
      useAppStore.getState().openTab('/test1.md', 'Content 1');
      useAppStore.getState().openTab('/test2.md', 'Content 2');

      const firstTabId = useAppStore.getState().tabs[0].id;

      useAppStore.getState().switchTab(firstTabId);

      expect(useAppStore.getState().activeTabId).toBe(firstTabId);
    });
  });

  describe('setBlockViewMode', () => {
    it('persists block view mode on the active tab', () => {
      useAppStore.getState().openTab('/test.md', '```math\nx\n```');
      const tabId = useAppStore.getState().activeTabId!;

      useAppStore.getState().setBlockViewMode(tabId, '/test.md:math:0:abc', 'split');

      expect(useAppStore.getState().tabs[0].blockViewModes).toEqual({
        '/test.md:math:0:abc': 'split',
      });
    });
  });

  describe('editing metadata', () => {
    it('tracks dirty and saved content correctly', () => {
      useAppStore.getState().openTab('/test.md', 'one two');
      const tabId = useAppStore.getState().activeTabId!;

      useAppStore.getState().updateTabContent(tabId, 'one two three');

      expect(useAppStore.getState().tabs[0].dirty).toBe(true);

      useAppStore.getState().markTabSaved(tabId);

      expect(useAppStore.getState().tabs[0].dirty).toBe(false);
      expect(useAppStore.getState().tabs[0].savedContent).toBe('one two three');
    });
  });

  describe('settings and recent entries', () => {
    it('persists editor settings updates', () => {
      useAppStore.getState().updateSettings({ fontSize: 18, pandocPath: 'C:/tools/pandoc.exe' });

      expect(useAppStore.getState().settings.fontSize).toBe(18);
      expect(useAppStore.getState().settings.pandocPath).toBe('C:/tools/pandoc.exe');
    });

    it('deduplicates recent entries by path and kind', () => {
      useAppStore.getState().addRecentEntry({ path: '/vault', kind: 'workspace', label: 'vault' });
      useAppStore.getState().addRecentEntry({ path: '/vault', kind: 'workspace', label: 'vault' });

      expect(useAppStore.getState().recentEntries).toHaveLength(1);
    });
  });

  describe('toggleSidebar', () => {
    it('toggles sidebar open state', () => {
      expect(useAppStore.getState().sidebarOpen).toBe(true);

      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarOpen).toBe(false);

      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('toggleRightPanel', () => {
    it('toggles right panel open state', () => {
      expect(useAppStore.getState().rightPanelOpen).toBe(true);

      useAppStore.getState().toggleRightPanel();
      expect(useAppStore.getState().rightPanelOpen).toBe(false);

      useAppStore.getState().toggleRightPanel();
      expect(useAppStore.getState().rightPanelOpen).toBe(true);
    });
  });
});
