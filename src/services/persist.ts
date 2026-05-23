import { PersistOptions } from 'zustand/middleware';
import type { AppState } from '../stores/appStore';

export const persistConfig: PersistOptions<AppState, Partial<AppState>> = {
  name: 'inkstream-store-v2', // v0.2 起换名
  partialize: (state) => ({
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    vaultPath: state.vaultPath,
    fileTree: state.fileTree,
    recentEntries: state.recentEntries,
    mode: state.mode,
    theme: state.theme,
    settings: state.settings,
    // 不持久化：sidebarOpen, rightPanelOpen, mock 数据, v0.1 兼容性存根
  }),
};
