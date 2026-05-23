import { useAppStore } from "@/stores/appStore";

const modeLabels: Record<string, string> = {
  standard: "Standard",
  academic: "Academic",
  creative: "Creative",
};

export default function StatusBar() {
  const mode = useAppStore((s) => s.mode);
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const wordCount = useAppStore((s) => s.wordCount);
  const cursorLine = useAppStore((s) => s.cursorLine);
  const cursorColumn = useAppStore((s) => s.cursorColumn);
  const statusMessage = useAppStore((s) => s.statusMessage);
  const citations = useAppStore((s) => s.mockAcademicCitations);
  const activeTab = useAppStore((s) => s.tabs.find((tab) => tab.id === s.activeTabId));

  return (
    <div className="ink-statusbar">
      <div className="ink-statusbar__left">
        <span className="ink-statusbar__mode-pill">{modeLabels[mode] || "Standard"}</span>
        <span className="ink-statusbar__git">branch master</span>
        {sidebarTab === "git" && <span>Git tab</span>}
        <span>UTF-8</span>
        <span>language: {activeTab?.documentLanguage ?? "markdown"}</span>
        <span>{statusMessage}</span>
      </div>
      <div className="ink-statusbar__right">
        {mode === "academic" && <span>引用 {citations.filter((c) => c.resolved).length}</span>}
        <span>{wordCount} 字</span>
        <span>
          行 {cursorLine}, 列 {cursorColumn}
        </span>
        <span className="ink-statusbar__render-mode">Live Preview</span>
      </div>
    </div>
  );
}
