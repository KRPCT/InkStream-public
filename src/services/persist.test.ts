import { describe, it, expect } from 'vitest';
import { persistConfig } from './persist';
import type { TabState, VaultPath, EditorMode, Theme } from '../types';

describe('persist config', () => {
  it('has correct storage name', () => {
    expect(persistConfig.name).toBe('inkstream-store-v2');
  });

  it('partializes only specified fields', () => {
    const mockState = {
      tabs: [
        {
          id: '1',
          path: '/test.md',
          dirty: false,
          stateJSON: { doc: 'test' },
          cursor: { line: 1, col: 1 },
          scroll: 0,
          renderMode: 'live' as const,
        },
      ] as TabState[],
      activeTabId: '1',
      vaultPath: '/vault' as VaultPath,
      mode: 'standard' as EditorMode,
      theme: 'light' as Theme,
      sidebarOpen: true,
      rightPanelOpen: false,
      setMode: () => {},
      setTheme: () => {},
      setVaultPath: () => {},
      openTab: () => {},
      closeTab: () => {},
      switchTab: () => {},
      toggleSidebar: () => {},
      toggleRightPanel: () => {},
    } as any;

    const partializedState = persistConfig.partialize!(mockState);

    expect(partializedState).toEqual({
      tabs: mockState.tabs,
      activeTabId: '1',
      vaultPath: '/vault',
      mode: 'standard',
      theme: 'light',
    });

    // Verify UI state is NOT persisted
    expect(partializedState).not.toHaveProperty('sidebarOpen');
    expect(partializedState).not.toHaveProperty('rightPanelOpen');
  });

  it('handles null vaultPath', () => {
    const mockState = {
      tabs: [],
      activeTabId: null,
      vaultPath: null as VaultPath,
      mode: 'academic' as EditorMode,
      theme: 'dark' as Theme,
      sidebarOpen: true,
      rightPanelOpen: true,
      setMode: () => {},
      setTheme: () => {},
      setVaultPath: () => {},
      openTab: () => {},
      closeTab: () => {},
      switchTab: () => {},
      toggleSidebar: () => {},
      toggleRightPanel: () => {},
    } as any;

    const partializedState = persistConfig.partialize!(mockState);

    expect(partializedState.vaultPath).toBeNull();
    expect(partializedState.activeTabId).toBeNull();
  });
});
