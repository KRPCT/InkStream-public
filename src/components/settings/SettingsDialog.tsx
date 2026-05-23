import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import type { EditorMode, EditorSettings, PandocFormat } from "@/types";
import { probePandoc } from "@/services/fs";
import { X } from "lucide-react";

export default function SettingsDialog() {
  const open = useAppStore((s) => s.settingsOpen);
  const onClose = useAppStore((s) => s.setSettingsOpen);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [tab, setTab] = useState<"general" | "editor" | "markdown" | "export" | "shortcuts">("general");
  const [local, setLocal] = useState<EditorSettings>(settings);
  const [pandocStatus, setPandocStatus] = useState<string>("未检测");

  useEffect(() => {
    if (open) setLocal(settings);
  }, [open, settings]);

  if (!open) return null;

  const save = () => {
    updateSettings(local);
    onClose(false);
  };

  const patch = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setLocal((current) => ({ ...current, [key]: value }));
  };

  return (
    <>
      <div className="ink-modal-backdrop" onClick={() => onClose(false)} />
      <dialog className="ink-settings" open>
        <header className="ink-settings__header">
          <h2>设置</h2>
          <button type="button" onClick={() => onClose(false)} aria-label="Close settings">
            <X size={16} />
          </button>
        </header>
        <div className="ink-settings__content">
          <nav className="ink-settings__tabs" aria-label="Settings">
            {[
              ["general", "通用"],
              ["editor", "编辑器"],
              ["markdown", "Markdown/数学"],
              ["export", "导出"],
              ["shortcuts", "快捷键"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={tab === id ? "ink-settings__tab--active" : ""}
                onClick={() => setTab(id as typeof tab)}
              >
                {label}
              </button>
            ))}
          </nav>
          <section className="ink-settings__panel">
            {tab === "general" && (
              <>
                <label>
                  默认模式
                  <select value={local.defaultMode} onChange={(e) => patch("defaultMode", e.target.value as EditorMode)}>
                    <option value="standard">标准模式</option>
                    <option value="academic">学术模式</option>
                    <option value="creative">创作模式</option>
                  </select>
                </label>
                <label>
                  主题
                  <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}>
                    <option value="light">亮色</option>
                    <option value="dark">暗色</option>
                  </select>
                </label>
              </>
            )}
            {tab === "editor" && (
              <>
                <label>
                  字体大小: {local.fontSize}px
                  <input min={12} max={24} type="range" value={local.fontSize} onChange={(e) => patch("fontSize", Number(e.target.value))} />
                </label>
                <label>
                  行宽: {local.lineWidth}px
                  <input min={560} max={1100} step={20} type="range" value={local.lineWidth} onChange={(e) => patch("lineWidth", Number(e.target.value))} />
                </label>
                <label className="ink-settings__check">
                  <input type="checkbox" checked={local.autoSave} onChange={(e) => patch("autoSave", e.target.checked)} />
                  自动保存
                </label>
              </>
            )}
            {tab === "markdown" && (
              <>
                <label className="ink-settings__check">
                  <input type="checkbox" checked={local.renderMathByDefault} onChange={(e) => patch("renderMathByDefault", e.target.checked)} />
                  默认渲染数学块
                </label>
                <label className="ink-settings__check">
                  <input type="checkbox" checked={local.typstDarkMode} onChange={(e) => patch("typstDarkMode", e.target.checked)} />
                  Typst 预览跟随暗色主题
                </label>
              </>
            )}
            {tab === "export" && (
              <>
                <label>
                  Pandoc 路径
                  <input value={local.pandocPath} onChange={(e) => patch("pandocPath", e.target.value)} placeholder="留空则使用 PATH 中的 pandoc" />
                </label>
                <label>
                  默认导出目录
                  <input value={local.defaultExportDirectory} onChange={(e) => patch("defaultExportDirectory", e.target.value)} />
                </label>
                <label>
                  默认导出格式
                  <select value={local.defaultExportFormat} onChange={(e) => patch("defaultExportFormat", e.target.value as PandocFormat)}>
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="html">HTML</option>
                    <option value="epub">EPUB</option>
                    <option value="rtf">RTF</option>
                    <option value="latex">LaTeX</option>
                    <option value="typst">Typst</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="ink-settings__secondary"
                  onClick={() => {
                    setPandocStatus("检测中...");
                    void probePandoc(local.pandocPath || undefined).then((result) => {
                      setPandocStatus(
                        result.ok
                          ? `${pandocSourceLabel(result.source)}: ${result.path} ${result.version ?? ""}`
                          : result.error ?? "Pandoc 不可用",
                      );
                    });
                  }}
                >
                  检测 Pandoc
                </button>
                <p className="ink-settings__status">{pandocStatus}</p>
              </>
            )}
            {tab === "shortcuts" && (
              <div className="ink-settings__shortcuts">
                <p><kbd>Ctrl+S</kbd> 保存</p>
                <p><kbd>Ctrl+K</kbd> 命令面板</p>
                <p><kbd>Ctrl+B</kbd> 加粗</p>
                <p><kbd>Ctrl+I</kbd> 斜体</p>
                <p><kbd>Ctrl+F</kbd> 查找</p>
                <p><kbd>Tab</kbd> 缩进</p>
              </div>
            )}
          </section>
        </div>
        <footer className="ink-settings__footer">
          <button type="button" onClick={() => onClose(false)}>取消</button>
          <button type="button" className="ink-settings__primary" onClick={save}>保存</button>
        </footer>
      </dialog>
    </>
  );
}

function pandocSourceLabel(source: string | undefined): string {
  if (source === "bundled") return "内置 Pandoc";
  if (source === "configured") return "自定义 Pandoc";
  if (source === "system") return "系统 Pandoc";
  return "Pandoc";
}
