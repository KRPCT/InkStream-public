import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { insertFencedBlockIntoActiveEditor } from "@/editor/block-commands";
import { runEditorCommand } from "@/editor/editor-commands";
import {
  exportActiveDocument,
  importDocumentFromDialog,
  newUntitledDocument,
  openDocumentFromDialog,
  openWorkspaceFromDialog,
  saveActiveDocument,
  saveActiveDocumentAs,
} from "@/services/workflows";
import type { PandocFormat } from "@/types";

type MenuKey = "file" | "edit" | "format" | "view" | "mode" | "tools" | "help";

interface MenuItem {
  label: string;
  action?: () => void;
  checked?: boolean;
  separator?: boolean;
}

export default function MenuBar() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const theme = useAppStore((s) => s.theme);
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleRightPanel = useAppStore((s) => s.toggleRightPanel);
  const revealSidebarTab = useAppStore((s) => s.revealSidebarTab);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const activeTab = useAppStore((s) => s.tabs.find((tab) => tab.id === s.activeTabId));

  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    if (openMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenu]);

  const exportItem = (label: string, format: PandocFormat): MenuItem => ({
    label,
    action: () => void exportActiveDocument(format),
  });

  const menus: Record<MenuKey, MenuItem[]> = {
    file: [
      { label: "新建", action: () => void newUntitledDocument() },
      { label: "打开文件...", action: () => void openDocumentFromDialog() },
      { label: "打开文件夹...", action: () => void openWorkspaceFromDialog() },
      { label: "保存", action: () => void saveActiveDocument() },
      { label: "另存为...", action: () => void saveActiveDocumentAs() },
      { label: "导入...", action: () => void importDocumentFromDialog() },
      { label: "", separator: true },
      exportItem("导出 Markdown...", "markdown"),
      exportItem("导出 HTML...", "html"),
      exportItem("导出 PDF...", "pdf"),
      exportItem("导出 DOCX...", "docx"),
      exportItem("导出 RTF...", "rtf"),
      exportItem("导出 EPUB...", "epub"),
      exportItem("导出 LaTeX...", "latex"),
      exportItem("导出 Typst...", "typst"),
    ],
    edit: [
      { label: "撤销", action: () => runEditorCommand("undo") },
      { label: "重做", action: () => runEditorCommand("redo") },
      { label: "剪切", action: () => runEditorCommand("cut") },
      { label: "复制", action: () => runEditorCommand("copy") },
      { label: "粘贴", action: () => runEditorCommand("paste") },
      { label: "全选", action: () => runEditorCommand("selectAll") },
      { label: "查找", action: () => runEditorCommand("find") },
    ],
    format: [
      { label: "正文", action: () => runEditorCommand("formatParagraph") },
      { label: "标题 1", action: () => runEditorCommand("formatHeading", "#") },
      { label: "标题 2", action: () => runEditorCommand("formatHeading", "##") },
      { label: "标题 3", action: () => runEditorCommand("formatHeading", "###") },
      { label: "标题 4", action: () => runEditorCommand("formatHeading", "####") },
      { label: "标题 5", action: () => runEditorCommand("formatHeading", "#####") },
      { label: "标题 6", action: () => runEditorCommand("formatHeading", "######") },
      { label: "引用段落", action: () => runEditorCommand("formatBlockquote") },
      { label: "无序列表", action: () => runEditorCommand("formatBulletList") },
      { label: "有序列表", action: () => runEditorCommand("formatOrderedList") },
      { label: "任务列表", action: () => runEditorCommand("formatTaskList") },
      { label: "代码块", action: () => runEditorCommand("formatCodeBlock") },
      { label: "表格", action: () => runEditorCommand("formatTable") },
      { label: "", separator: true },
      { label: "加粗", action: () => runEditorCommand("formatStrong") },
      { label: "斜体", action: () => runEditorCommand("formatItalic") },
      { label: "下划线", action: () => runEditorCommand("formatUnderline") },
      { label: "删除线", action: () => runEditorCommand("formatStrike") },
      { label: "高亮", action: () => runEditorCommand("formatHighlight") },
      { label: "行内代码", action: () => runEditorCommand("formatInlineCode") },
      { label: "链接", action: () => runEditorCommand("formatLink") },
      { label: "清除格式", action: () => runEditorCommand("formatClear") },
    ],
    view: [
      { label: "文件树", action: () => revealSidebarTab("workspace"), checked: sidebarTab === "workspace" },
      { label: "大纲", action: () => revealSidebarTab("outline"), checked: sidebarTab === "outline" },
      { label: "Git Graph", action: () => revealSidebarTab("git"), checked: sidebarTab === "git" },
      { label: "切换侧边栏", action: toggleSidebar },
      { label: "切换右侧面板", action: toggleRightPanel },
      { label: "命令面板", action: () => setCommandPaletteOpen(true) },
      { label: "源码模式", action: () => activeTab && useAppStore.getState().setRenderMode(activeTab.id, "source"), checked: activeTab?.renderMode === "source" },
      { label: "实时预览", action: () => activeTab && useAppStore.getState().setRenderMode(activeTab.id, "live"), checked: activeTab?.renderMode === "live" },
      { label: "切换全屏", action: () => document.documentElement.requestFullscreen?.() },
    ],
    mode: [
      { label: "标准模式", action: () => setMode("standard"), checked: mode === "standard" },
      { label: "学术模式", action: () => setMode("academic"), checked: mode === "academic" },
      { label: "创作模式", action: () => setMode("creative"), checked: mode === "creative" },
    ],
    tools: [
      { label: "Insert Math Block", action: () => insertFencedBlockIntoActiveEditor("math") },
      { label: "Insert Typst Block", action: () => insertFencedBlockIntoActiveEditor("typst") },
      { label: "Insert LaTeX Block", action: () => insertFencedBlockIntoActiveEditor("latex") },
      { label: theme === "light" ? "暗色主题" : "亮色主题", action: toggleTheme },
      { label: "设置...", action: () => setSettingsOpen(true) },
    ],
    help: [
      { label: "关于 InkStream", action: () => window.alert("InkStream Phase 3 Recovery") },
    ],
  };

  const labels: Record<MenuKey, string> = {
    file: "文件",
    edit: "编辑",
    format: "格式",
    view: "视图",
    mode: "模式",
    tools: "工具",
    help: "帮助",
  };

  return (
    <div ref={menuRef} className="ink-menubar">
      <span className="ink-menubar__brand">InkStream</span>
      {(Object.keys(labels) as MenuKey[]).map((key) => (
        <div key={key} className="ink-menubar__menu-wrapper">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === key ? null : key)}
            className={`ink-menubar__menu${openMenu === key ? " ink-menubar__menu--open" : ""}`}
          >
            {labels[key]}
          </button>
          {openMenu === key && (
            <div className={`ink-menubar__dropdown${key === "format" ? " ink-menubar__dropdown--wide" : ""}`}>
              {menus[key].map((item) => (
                item.separator ? (
                  <div key={`separator-${key}-${menus[key].indexOf(item)}`} className="ink-menubar__dropdown-separator" />
                ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action?.();
                    setOpenMenu(null);
                  }}
                  className="ink-menubar__dropdown-item"
                >
                  {item.checked && <span style={{ marginRight: 6 }}>*</span>}
                  {item.label}
                </button>
                )
              ))}
            </div>
          )}
        </div>
      ))}
      <span className="ink-menubar__spacer" />
      <button type="button" className="ink-menubar__theme" onClick={toggleTheme}>
        {theme === "light" ? "亮" : "暗"}
      </button>
    </div>
  );
}
