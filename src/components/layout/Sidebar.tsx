import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import type { FileNode } from "@/types";
import { newUntitledDocument, openDocumentFromDialog, openWorkspaceFromDialog } from "@/services/workflows";
import { jumpToEditorPosition } from "@/editor/editor-commands";
import { extractMarkdownOutline } from "@/editor/outline";
import { AlertTriangle, FileText, Folder, FolderOpen, Plus, RefreshCw, Search } from "lucide-react";

export default function Sidebar() {
  const mode = useAppStore((s) => s.mode);
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const setSidebarTab = useAppStore((s) => s.setSidebarTab);

  const tabs = (
    <div className="ink-sidebar-tabs" role="tablist" aria-label="Sidebar">
      <button
        id="sidebar-tab-workspace"
        type="button"
        role="tab"
        aria-controls="sidebar-panel-workspace"
        aria-selected={sidebarTab === "workspace"}
        className={`ink-sidebar-tabs__tab${sidebarTab === "workspace" ? " ink-sidebar-tabs__tab--active" : ""}`}
        onClick={() => setSidebarTab("workspace")}
      >
        文件
      </button>
      <button
        id="sidebar-tab-outline"
        type="button"
        role="tab"
        aria-controls="sidebar-panel-outline"
        aria-selected={sidebarTab === "outline"}
        className={`ink-sidebar-tabs__tab${sidebarTab === "outline" ? " ink-sidebar-tabs__tab--active" : ""}`}
        onClick={() => setSidebarTab("outline")}
      >
        大纲
      </button>
      <button
        id="sidebar-tab-git"
        type="button"
        role="tab"
        aria-controls="sidebar-panel-git"
        aria-selected={sidebarTab === "git"}
        className={`ink-sidebar-tabs__tab${sidebarTab === "git" ? " ink-sidebar-tabs__tab--active" : ""}`}
        onClick={() => setSidebarTab("git")}
      >
        Git
      </button>
    </div>
  );

  if (sidebarTab === "git") {
    return (
      <aside className="ink-sidebar">
        {tabs}
        <div
          id="sidebar-panel-git"
          className="ink-sidebar__pane ink-sidebar__placeholder"
          role="tabpanel"
          aria-labelledby="sidebar-tab-git"
        >
          <div className="ink-sidebar__head">Git Graph</div>
          <section className="ink-sidebar__git-graph" role="region" aria-label="Git Graph">
            <p>Phase 4 已冻结。本轮只保证 Git 入口不占用主编辑区。</p>
          </section>
        </div>
      </aside>
    );
  }

  if (sidebarTab === "outline") {
    return (
      <aside className="ink-sidebar">
        {tabs}
        <OutlineSection />
      </aside>
    );
  }

  return (
    <aside className="ink-sidebar">
      {tabs}
      {mode === "academic" && <AcademicSection />}
      <WorkspaceSection />
      {mode === "creative" && <CreativeSection />}
    </aside>
  );
}

function OutlineSection() {
  const activeTab = useAppStore((s) => s.tabs.find((tab) => tab.id === s.activeTabId));
  const outline = extractMarkdownOutline(activeTab?.stateJSON.doc ?? "");

  return (
    <div
      id="sidebar-panel-outline"
      className="ink-sidebar__pane"
      role="tabpanel"
      aria-labelledby="sidebar-tab-outline"
    >
      <div className="ink-sidebar__head">
        <span>{activeTab ? "文档大纲" : "大纲"}</span>
      </div>
      {outline.length === 0 ? (
        <div className="ink-sidebar__empty">
          <p>{activeTab ? "当前文档暂无标题" : "打开文档后显示标题结构"}</p>
        </div>
      ) : (
        <ul className="ink-sidebar__list">
          {outline.map((heading) => (
            <li key={`${heading.anchor}-${heading.from}`}>
              <button
                type="button"
                className="ink-sidebar__item ink-sidebar__outline-item"
                style={{ paddingLeft: `${6 + (heading.level - 1) * 14}px` }}
                onClick={() => jumpToEditorPosition(heading.from)}
              >
                <span>{heading.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WorkspaceSection() {
  const vaultPath = useAppStore((s) => s.vaultPath);
  const fileTree = useAppStore((s) => s.fileTree);
  const activeTab = useAppStore((s) => s.tabs.find((tab) => tab.id === s.activeTabId));
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (path: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div
      id="sidebar-panel-workspace"
      className="ink-sidebar__pane"
      role="tabpanel"
      aria-labelledby="sidebar-tab-workspace"
    >
      <div className="ink-sidebar__head">
        <span>{vaultPath ? vaultPath.split(/[\\/]/).pop() : "Workspace"}</span>
        <span className="ink-sidebar__tools">
          <button type="button" title="新建文件" onClick={() => void newUntitledDocument()}>
            <Plus size={13} />
          </button>
          <button type="button" title="刷新/打开文件夹" onClick={() => void openWorkspaceFromDialog(vaultPath ?? undefined)}>
            <RefreshCw size={13} />
          </button>
        </span>
      </div>
      <div className="ink-sidebar__search">
        <Search size={12} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件..." />
      </div>
      {fileTree.length === 0 ? (
        <div className="ink-sidebar__empty">
          <p>未打开文件夹</p>
          <button type="button" onClick={() => void openWorkspaceFromDialog()}>打开文件夹</button>
          <button type="button" onClick={() => void openDocumentFromDialog()}>打开文件</button>
        </div>
      ) : (
        <ul className="ink-sidebar__list">
          {fileTree.map((node) => (
            <FileNodeView
              key={node.id}
              node={node}
              depth={0}
              query={query}
              expanded={expanded}
              activePath={activeTab?.path}
              onToggle={toggle}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FileNodeView({
  node,
  depth,
  query,
  expanded,
  activePath,
  onToggle,
}: {
  node: FileNode;
  depth: number;
  query: string;
  expanded: Set<string>;
  activePath?: string;
  onToggle: (path: string) => void;
}) {
  const path = node.path ?? node.id;
  const open = expanded.has(path) || depth < 1;
  const matches = !query || node.name.toLowerCase().includes(query.toLowerCase());
  const childMatches = node.children?.some((child) => child.name.toLowerCase().includes(query.toLowerCase()));
  if (!matches && !childMatches) return null;

  return (
    <li>
      <button
        type="button"
        className={`ink-sidebar__item${activePath === path ? " ink-sidebar__item--active" : ""}${node.type === "directory" ? " ink-sidebar__folder" : ""}`}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
        onClick={() => {
          if (node.type === "directory") onToggle(path);
          else void openDocumentFromDialog(path);
        }}
      >
        <span className="ink-sidebar__icon">
          {node.type === "directory" ? open ? <FolderOpen size={13} /> : <Folder size={13} /> : <FileText size={13} />}
        </span>
        <span>{node.name}</span>
      </button>
      {node.type === "directory" && open && node.children?.length ? (
        <ul className="ink-sidebar__list">
          {node.children.map((child) => (
            <FileNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              query={query}
              expanded={expanded}
              activePath={activePath}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function AcademicSection() {
  const citations = useAppStore((s) => s.mockAcademicCitations);
  return (
    <div className="ink-sidebar__section">
      <div className="ink-sidebar__head">Zotero Library</div>
      <ul className="ink-sidebar__list">
        {citations.filter((item) => item.resolved).map((item) => (
          <li key={item.key} className="ink-sidebar__item">
            <span className="ink-sidebar__icon"><FileText size={12} /></span>
            <span>{item.title}</span>
          </li>
        ))}
        <li className="ink-sidebar__item" style={{ color: "var(--syntax-red-1)" }}>
          <span className="ink-sidebar__icon"><AlertTriangle size={12} /></span>
          [@UNRESOLVED]
        </li>
      </ul>
    </div>
  );
}

function CreativeSection() {
  return (
    <div className="ink-sidebar__section ink-sidebar__placeholder">
      <div className="ink-sidebar__head">Creative</div>
      <p>章节、角色和设定将在后续阶段接入。当前工作区文件树仍可用。</p>
    </div>
  );
}
