import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { insertFencedBlockIntoActiveEditor } from "@/editor/block-commands";
import { runEditorCommand } from "@/editor/editor-commands";

export default function EditorContextMenu() {
  const menu = useAppStore((s) => s.contextMenu);
  const setMenu = useAppStore((s) => s.setContextMenu);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".ink-editor-container")) return;
      event.preventDefault();
      setMenu({ x: event.clientX, y: event.clientY });
    };
    const close = () => setMenu(null);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
    };
  }, [setMenu]);

  if (!menu) return null;

  const groups = [
    {
      title: "编辑",
      items: [
        { label: "剪切", action: () => runEditorCommand("cut") },
        { label: "复制", action: () => runEditorCommand("copy") },
        { label: "粘贴", action: () => runEditorCommand("paste") },
      ],
    },
    {
      title: "段落格式",
      items: [
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
      ],
    },
    {
      title: "字体格式",
      items: [
        { label: "加粗", action: () => runEditorCommand("formatStrong") },
        { label: "斜体", action: () => runEditorCommand("formatItalic") },
        { label: "下划线", action: () => runEditorCommand("formatUnderline") },
        { label: "删除线", action: () => runEditorCommand("formatStrike") },
        { label: "高亮", action: () => runEditorCommand("formatHighlight") },
        { label: "行内代码", action: () => runEditorCommand("formatInlineCode") },
        { label: "链接", action: () => runEditorCommand("formatLink") },
        { label: "清除格式", action: () => runEditorCommand("formatClear") },
      ],
    },
    {
      title: "插入",
      items: [
        { label: "Math Block", action: () => insertFencedBlockIntoActiveEditor("math") },
        { label: "Typst Block", action: () => insertFencedBlockIntoActiveEditor("typst") },
        { label: "LaTeX Block", action: () => insertFencedBlockIntoActiveEditor("latex") },
      ],
    },
  ];

  return (
    <div className="ink-context-menu" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>
      {groups.map((group, groupIndex) => (
        <div key={group.title}>
          {groupIndex > 0 && <div className="ink-context-menu__separator" />}
          <div className="ink-context-menu__group-title">{group.title}</div>
          {group.items.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => {
                item.action();
                setMenu(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
