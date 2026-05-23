import { useAppStore } from "@/stores/appStore";
import { newUntitledDocument, openDocumentFromDialog, openWorkspaceFromDialog } from "@/services/workflows";
import { FilePlus, FolderOpen, History, Settings, Upload } from "lucide-react";

export default function WelcomePage() {
  const recentEntries = useAppStore((s) => s.recentEntries);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  return (
    <div className="ink-welcome ink-welcome--start">
      <section className="ink-welcome__intro">
        <h1 className="ink-welcome__title">InkStream</h1>
        <p className="ink-welcome__hint">本地优先 Markdown 写作工作台</p>
      </section>

      <section className="ink-welcome__actions" aria-label="Start">
        <button type="button" className="ink-welcome__action" onClick={() => void newUntitledDocument()}>
          <FilePlus size={18} />
          <span>新建 Markdown 文件</span>
        </button>
        <button type="button" className="ink-welcome__action" onClick={() => void openDocumentFromDialog()}>
          <Upload size={18} />
          <span>打开文件</span>
        </button>
        <button type="button" className="ink-welcome__action" onClick={() => void openWorkspaceFromDialog()}>
          <FolderOpen size={18} />
          <span>打开文件夹</span>
        </button>
        <button type="button" className="ink-welcome__action" onClick={() => setSettingsOpen(true)}>
          <Settings size={18} />
          <span>设置</span>
        </button>
      </section>

      <section className="ink-welcome__recent" aria-label="Recent">
        <div className="ink-welcome__recent-title">
          <History size={14} />
          最近
        </div>
        {recentEntries.length === 0 ? (
          <p className="ink-welcome__empty">暂无最近文件或文件夹</p>
        ) : (
          recentEntries.map((entry) => (
            <button
              type="button"
              key={`${entry.kind}:${entry.path}`}
              className="ink-welcome__recent-item"
              onClick={() => {
                if (entry.kind === "workspace") {
                  void openWorkspaceFromDialog(entry.path);
                } else {
                  void openDocumentFromDialog(entry.path);
                }
              }}
            >
              <span>{entry.label}</span>
              <small>{entry.path}</small>
            </button>
          ))
        )}
      </section>
    </div>
  );
}
