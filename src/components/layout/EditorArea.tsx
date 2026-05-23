import { useEffect, useMemo, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { useAppStore } from '../../stores/appStore';
import { createExtensions } from '../../editor/markdown-extensions';
import { parseDocumentLanguage } from '../../editor/fenced-block-parser';
import {
  registerEditorSaveHandler,
  registerEditorView,
} from '../../editor/editor-commands';
import { saveFile, selectSavePath } from '../../services/fs';
import type { DocumentLanguage, FencedBlockViewMode, TabState } from '../../types';
import TabBar from '../tabs/TabBar';
import WelcomePage from '../app/WelcomePage';

export default function EditorArea() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const viewConfigKeyRef = useRef<string | null>(null);
  const {
    activeTabId,
    setBlockViewMode,
    setCursor,
    setDocumentLanguage,
    setWordCount,
    updateTabContent,
  } = useAppStore();
  const activeTab = useAppStore((s) => s.tabs.find((tab) => tab.id === s.activeTabId));
  const settings = useAppStore((s) => s.settings);
  const editorStyle = useMemo(
    () =>
      ({
        '--ink-editor-font-size': `${settings.fontSize}px`,
        '--ink-editor-line-width': `${settings.lineWidth}px`,
      }) as React.CSSProperties,
    [settings.fontSize, settings.lineWidth],
  );

  useEffect(() => {
    if (!editorRef.current || viewRef.current || !activeTab) return;

    const startDoc = activeTab.stateJSON.doc || '';
    const view = new EditorView({
      state: EditorState.create({
        doc: startDoc,
        extensions: createEditorExtensions(activeTab, updateTabContent, setDocumentLanguage, setCursor, setWordCount, setBlockViewMode),
      }),
      parent: editorRef.current,
    });

    viewRef.current = view;
    viewConfigKeyRef.current = editorConfigKey(activeTab);
    registerEditorView(view);

    return () => {
      view.destroy();
      viewRef.current = null;
      viewConfigKeyRef.current = null;
      registerEditorView(null);
    };
  }, [activeTabId, setBlockViewMode, setCursor, setDocumentLanguage, setWordCount, updateTabContent]);

  useEffect(() => {
    registerEditorSaveHandler(async () => {
      const state = useAppStore.getState();
      const tab = state.tabs.find((item) => item.id === state.activeTabId);
      if (!tab) return;

      let targetPath = tab.untitled ? null : tab.path;
      if (!targetPath) {
        targetPath = await selectSavePath(tab.path.endsWith('.md') ? tab.path : `${tab.path}.md`);
        if (!targetPath) return;
      }

      await saveFile(targetPath, tab.stateJSON.doc || '');
      state.markTabSaved(tab.id, targetPath);
      state.addRecentEntry({ path: targetPath, kind: 'file', label: targetPath.split(/[\\/]/).pop() ?? targetPath });
      state.setStatusMessage(`已保存 ${targetPath.split(/[\\/]/).pop() ?? targetPath}`);
    });

    return () => registerEditorSaveHandler(null);
  }, []);

  useEffect(() => {
    if (!viewRef.current || !activeTab) return;
    const configKey = editorConfigKey(activeTab);
    if (
      viewRef.current.state.doc.toString() === (activeTab.stateJSON.doc || '') &&
      viewConfigKeyRef.current === configKey
    ) {
      return;
    }

    const doc = activeTab.stateJSON.doc || '';
    viewRef.current.setState(
      EditorState.create({
        doc,
        extensions: createEditorExtensions(activeTab, updateTabContent, setDocumentLanguage, setCursor, setWordCount, setBlockViewMode),
      }),
    );
    viewConfigKeyRef.current = configKey;
  }, [
    activeTabId,
    activeTab?.stateJSON.doc,
    activeTab?.renderMode,
    activeTab?.path,
    activeTab?.id,
    activeTab?.blockViewModes,
    setBlockViewMode,
    setCursor,
    setDocumentLanguage,
    setWordCount,
    updateTabContent,
  ]);

  if (!activeTab) {
    return (
      <main className="ink-editor-area">
        <WelcomePage />
      </main>
    );
  }

  return (
    <main className="ink-editor-area">
      <TabBar />
      <div
        ref={editorRef}
        className="ink-editor-container"
        style={editorStyle}
      />
    </main>
  );
}

function editorConfigKey(tab: TabState): string {
  return JSON.stringify({
    id: tab.id,
    path: tab.path,
    renderMode: tab.renderMode,
    blockViewModes: tab.blockViewModes ?? {},
  });
}

function createEditorExtensions(
  tab: TabState,
  updateTabContent: (tabId: string, content: string) => void,
  setDocumentLanguage: (tabId: string, language: DocumentLanguage) => void,
  setCursor: (line: number, column: number) => void,
  setWordCount: (count: number) => void,
  setBlockViewMode: (tabId: string, blockKey: string, mode: FencedBlockViewMode) => void,
) {
  return [
    createExtensions(tab.renderMode, {
      path: tab.path,
      blockViewModes: tab.blockViewModes ?? {},
      onViewModeChange: (key, mode) => setBlockViewMode(tab.id, key, mode),
    }),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        updateTabContent(tab.id, content);
        setDocumentLanguage(tab.id, parseDocumentLanguage(content).language);
        const words = content.trim().match(/[\p{L}\p{N}_-]+/gu);
        setWordCount(words?.length ?? 0);
      }

      if (update.docChanged || update.selectionSet) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        setCursor(line.number, head - line.from + 1);
      }
    }),
  ];
}
