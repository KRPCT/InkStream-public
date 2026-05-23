import { useAppStore } from "@/stores/appStore";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
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

interface Command {
  id: string;
  label: string;
  category: string;
  action: () => void;
}

export default function CommandPalette() {
  const isOpen = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleRightPanel = useAppStore((s) => s.toggleRightPanel);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setMode = useAppStore((s) => s.setMode);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: "new", label: "新建文档", category: "文件", action: () => void newUntitledDocument() },
    { id: "open", label: "打开文件", category: "文件", action: () => void openDocumentFromDialog() },
    { id: "folder", label: "打开文件夹", category: "文件", action: () => void openWorkspaceFromDialog() },
    { id: "save", label: "保存文档", category: "文件", action: () => void saveActiveDocument() },
    { id: "saveas", label: "另存为", category: "文件", action: () => void saveActiveDocumentAs() },
    { id: "import", label: "导入为 Markdown", category: "文件", action: () => void importDocumentFromDialog() },
    { id: "export-pdf", label: "导出 PDF", category: "文件", action: () => void exportActiveDocument("pdf") },
    { id: "export-docx", label: "导出 DOCX", category: "文件", action: () => void exportActiveDocument("docx") },
    { id: "export-html", label: "导出 HTML", category: "文件", action: () => void exportActiveDocument("html") },
    { id: "export-markdown", label: "导出 Markdown", category: "文件", action: () => void exportActiveDocument("markdown") },
    { id: "export-rtf", label: "导出 RTF", category: "文件", action: () => void exportActiveDocument("rtf") },
    { id: "export-epub", label: "导出 EPUB", category: "文件", action: () => void exportActiveDocument("epub") },
    { id: "export-latex", label: "导出 LaTeX", category: "文件", action: () => void exportActiveDocument("latex") },
    { id: "export-typst", label: "导出 Typst", category: "文件", action: () => void exportActiveDocument("typst") },
    { id: "mode-standard", label: "切换标准模式", category: "模式", action: () => setMode("standard") },
    { id: "mode-academic", label: "切换学术模式", category: "模式", action: () => setMode("academic") },
    { id: "mode-creative", label: "切换创作模式", category: "模式", action: () => setMode("creative") },
    { id: "theme", label: "切换主题", category: "视图", action: toggleTheme },
    { id: "sidebar", label: "切换侧边栏", category: "视图", action: toggleSidebar },
    { id: "panel", label: "切换右侧面板", category: "视图", action: toggleRightPanel },
    { id: "find", label: "查找", category: "编辑", action: () => runEditorCommand("find") },
    { id: "paragraph", label: "正文段落", category: "格式", action: () => runEditorCommand("formatParagraph") },
    { id: "heading-1", label: "标题 1", category: "格式", action: () => runEditorCommand("formatHeading", "#") },
    { id: "heading-2", label: "标题 2", category: "格式", action: () => runEditorCommand("formatHeading", "##") },
    { id: "heading-3", label: "标题 3", category: "格式", action: () => runEditorCommand("formatHeading", "###") },
    { id: "heading-4", label: "标题 4", category: "格式", action: () => runEditorCommand("formatHeading", "####") },
    { id: "heading-5", label: "标题 5", category: "格式", action: () => runEditorCommand("formatHeading", "#####") },
    { id: "heading-6", label: "标题 6", category: "格式", action: () => runEditorCommand("formatHeading", "######") },
    { id: "blockquote", label: "引用段落", category: "格式", action: () => runEditorCommand("formatBlockquote") },
    { id: "bullet-list", label: "无序列表", category: "格式", action: () => runEditorCommand("formatBulletList") },
    { id: "ordered-list", label: "有序列表", category: "格式", action: () => runEditorCommand("formatOrderedList") },
    { id: "task-list", label: "任务列表", category: "格式", action: () => runEditorCommand("formatTaskList") },
    { id: "table", label: "表格", category: "格式", action: () => runEditorCommand("formatTable") },
    { id: "bold", label: "加粗", category: "编辑", action: () => runEditorCommand("formatStrong") },
    { id: "italic", label: "斜体", category: "编辑", action: () => runEditorCommand("formatItalic") },
    { id: "underline", label: "下划线", category: "编辑", action: () => runEditorCommand("formatUnderline") },
    { id: "strike", label: "删除线", category: "编辑", action: () => runEditorCommand("formatStrike") },
    { id: "highlight", label: "高亮", category: "编辑", action: () => runEditorCommand("formatHighlight") },
    { id: "inline-code", label: "行内代码", category: "编辑", action: () => runEditorCommand("formatInlineCode") },
    { id: "clear-format", label: "清除格式", category: "格式", action: () => runEditorCommand("formatClear") },
    { id: "insert-math", label: "Insert Math Block", category: "编辑", action: () => insertFencedBlockIntoActiveEditor("math") },
    { id: "insert-typst", label: "Insert Typst Block", category: "编辑", action: () => insertFencedBlockIntoActiveEditor("typst") },
    { id: "insert-latex", label: "Insert LaTeX Block", category: "编辑", action: () => insertFencedBlockIntoActiveEditor("latex") },
    { id: "settings", label: "设置", category: "工具", action: () => setSettingsOpen(true) },
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!isOpen);
        setQuery("");
        setSelectedIndex(0);
      }
      if (event.key === "Escape" && isOpen) setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <>
      <div className="ink-modal-backdrop" onClick={() => setOpen(false)} />
      <div className="ink-command-palette">
        <div className="ink-command-palette__input">
          <Search size={16} />
          <input
            ref={inputRef}
            type="text"
            placeholder="输入命令或搜索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[selectedIndex]) {
                  filtered[selectedIndex].action();
                  setOpen(false);
                }
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
        </div>
        <div className="ink-command-palette__list">
          {filtered.map((cmd, index) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => {
                cmd.action();
                setOpen(false);
              }}
              className={`ink-command-palette__item${index === selectedIndex ? " ink-command-palette__item--active" : ""}`}
            >
              <span>{cmd.category}</span>
              <strong>{cmd.label}</strong>
            </button>
          ))}
          {filtered.length === 0 && <p className="ink-command-palette__empty">无匹配命令</p>}
        </div>
      </div>
    </>
  );
}
