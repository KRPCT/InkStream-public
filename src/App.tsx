import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import Sidebar from './components/layout/Sidebar';
import EditorArea from './components/layout/EditorArea';
import RightPanel from './components/layout/RightPanel';
import MenuBar from './components/app/MenuBar';
import StatusBar from './components/app/StatusBar';
import CommandPalette from './components/command/CommandPalette';
import SettingsDialog from './components/settings/SettingsDialog';
import EditorContextMenu from './components/editor/EditorContextMenu';

function App() {
  const { mode, theme, sidebarOpen, rightPanelOpen, setMode, setTheme } = useAppStore();

  // Allow ?mode=... &theme=... URL params for testing/screenshots
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    const t = params.get('theme');
    if (m === 'standard' || m === 'academic' || m === 'creative') setMode(m);
    if (t === 'light' || t === 'dark') setTheme(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 同步 mode 到 <body data-mode>
  useEffect(() => {
    document.body.setAttribute('data-mode', mode);
  }, [mode]);

  // 同步 theme 到 <body class>
  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Compute body grid class based on panel visibility
  const bodyClass = !sidebarOpen && !rightPanelOpen
    ? 'ink-body ink-body--no-both'
    : !sidebarOpen
    ? 'ink-body ink-body--no-sidebar'
    : !rightPanelOpen
    ? 'ink-body ink-body--no-right'
    : 'ink-body';

  return (
    <div className="ink-app">
      <MenuBar />
      <div className={bodyClass}>
        {sidebarOpen && <Sidebar />}
        <EditorArea />
        {rightPanelOpen && <RightPanel />}
      </div>
      <StatusBar />
      <CommandPalette />
      <SettingsDialog />
      <EditorContextMenu />
    </div>
  );
}

export default App;
