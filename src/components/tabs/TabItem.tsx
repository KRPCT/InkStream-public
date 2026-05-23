import { useAppStore } from '../../stores/appStore';
import type { TabState } from '../../types';
import { X } from 'lucide-react';
import { promptSaveChanges, saveFile, selectSavePath } from '../../services/fs';

interface TabItemProps {
  tab: TabState;
}

export default function TabItem({ tab }: TabItemProps) {
  const { activeTabId, switchTab, closeTab } = useAppStore();
  const isActive = tab.id === activeTabId;

  const handleClick = () => {
    switchTab(tab.id);
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (tab.dirty) {
      const filename = tab.path.split('/').pop() || 'Untitled';
      const choice = await promptSaveChanges(filename);

      if (choice === 'cancel') {
        return;
      }

      if (choice === 'save') {
        let path = tab.untitled ? null : tab.path;
        if (!path) path = await selectSavePath(tab.path);
        if (!path) return;
        const content = tab.stateJSON.doc || '';
        await saveFile(path, content);
        useAppStore.getState().markTabSaved(tab.id, path);
      }
    }

    closeTab(tab.id);
  };

  // Keep legacy classes for tests
  return (
    <div
      className={`ink-tab ink-tabs__tab${isActive ? ' ink-tab--active ink-tabs__tab--active' : ''}`}
      onClick={handleClick}
    >
      <span className="ink-tab__label">{tab.title || tab.path.split(/[\\/]/).pop() || 'Untitled'}</span>
      {tab.dirty && <span className="ink-tab__dirty">●</span>}
      <button className="ink-tab__close" onClick={handleClose} aria-label="Close tab">
        <X size={12} />
      </button>
    </div>
  );
}
