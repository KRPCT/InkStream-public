# InkStream / 墨流

> 文本编辑器中的 IntelliJ IDE — 原生支持多语法（Obsidian Markdown / LaTeX / Typst / 富文本）、原生 Git 版本管理（深度定制 git-graph + GitHub）、原生 Zotero 引用、原生 Obsidian 关系网络。

## 产品契约

- 根契约：[`ORACLE.md`](../ORACLE.md) — 单一裁决源。任何其他文档与之冲突以 ORACLE 为准。
- 需求拆解：[`PRD.md`](../PRD.md)
- 视觉契约：[`UI-SPEC.md`](../UI-SPEC.md)
- 版本路线：[`ROADMAP.md`](../ROADMAP.md)
- 视觉 mockup：[`mockups/oracle-v0.1.html`](../mockups/oracle-v0.1.html)

## 当前版本

`v0.1` — Tiptap 骨架已冻结（commit `34f18f3`），即将被 v0.2 推翻。

`v0.2`（进行中）— 视觉与内核重铸：抛弃 Tiptap，接入 CodeMirror 6 单内核 + Atom HSL × Obsidian 变量名视觉体系。详见 [ROADMAP.md](../ROADMAP.md#v02--视觉与内核重铸当前周期)。

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面壳 | Tauri 2 |
| 前端 | React 19 + TypeScript strict + Vite |
| 状态 | Zustand 5 |
| 样式 | Tailwind 4 + 原生 CSS 变量 |
| 编辑器内核 | CodeMirror 6 + `@lezer/markdown` |
| 数学 | KaTeX |
| Typst | `@myriaddreamin/typst.ts` (wasm) |
| Git | `git2` (libgit2 Rust binding) |
| GitHub | `@octokit/rest` + `@octokit/auth-oauth-device` |
| 全文索引 | SQLite FTS5 |

## 运行

```bash
# 安装依赖（pnpm 10.x，锁定版本由 pnpm-lock.yaml 提供）
pnpm install

# 开发模式（Tauri dev server）
pnpm tauri dev

# 构建发布版
pnpm tauri build
```

## 目录结构

```
inkstream/
├── src/                      # 前端 (React + CodeMirror 6)
│   ├── components/
│   │   ├── app/              # MenuBar / StatusBar / WelcomePage
│   │   ├── layout/           # Sidebar / EditorArea / RightPanel
│   │   ├── academic/         # CitationPanel / LibraryTree / AcademicToolbar
│   │   ├── creative/         # ChapterNav / CodexPanel / SceneSummaryCard
│   │   ├── git/              # GitGraphView (v0.4)
│   │   ├── graph/            # GraphView (v0.5)
│   │   ├── command/          # CommandPalette
│   │   └── settings/         # SettingsDialog
│   ├── editor/               # CodeMirror 6 扩展 (v0.2 新增)
│   │   ├── livepreview/
│   │   ├── fenced-block/     # math / typst / latex (v0.3)
│   │   └── wiki-link/        # [[ ]] 双向链接 (v0.5)
│   ├── stores/               # Zustand store
│   ├── styles/               # theme.css (v0.2 新增)
│   ├── types/                # 共享 TypeScript 类型
│   └── mock/                 # 开发期 mock 数据
└── src-tauri/                # Rust 后端
    ├── src/
    │   ├── lib.rs            # Tauri builder + commands 注册
    │   ├── git/              # git2 wrapper (v0.4)
    │   ├── zotero/           # CAYW + Web API client (v0.6)
    │   ├── index/            # SQLite FTS5 (v0.5)
    │   └── prose_diff/       # 句级 LCS (v0.7)
    ├── capabilities/         # Tauri 2 permissions (v0.2 新增)
    └── Cargo.toml
```

## 开发工作流

1. 任何 phase 工作前先读 [ORACLE.md](../ORACLE.md)。
2. 使用 GSD 工作流：`/gsd-new-milestone` → `/gsd-spec-phase` → `/gsd-discuss-phase` → `/gsd-plan-phase` → `/gsd-execute-phase` → `/gsd-verify-work`。
3. 提交前 `pnpm check:all`（lint + typecheck + test）。
4. Conventional Commits，SSH 签名（Verified 硬门）。

## License

待定（参考 ORACLE.md 决议）。
