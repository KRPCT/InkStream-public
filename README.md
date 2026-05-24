<div align="center">

# InkStream

Local-first Markdown editor for long-form writing, technical notes, math, and document export.

[Download](https://github.com/KRPCT/InkStream/releases) · [Features](#features) · [Build](#build-from-source) · [Support](#support-the-project)

</div>

## Overview

InkStream is a desktop Markdown editor that keeps your documents as plain Markdown while offering a live editing experience for headings, tables, links, code blocks, math, LaTeX, Typst, and Pandoc-based export.

It is designed for writers who need local files, technical formatting, and predictable export rather than a web-only note service.

## Features

| Area | Status | Notes |
| --- | --- | --- |
| Desktop client | [x] | Tauri desktop app with release builds. |
| Welcome page | [x] | New file, open file, open folder, recent items, and settings entry. |
| File editing | [x] | Tabs, dirty state, save, save as, and recent files. |
| File tree | [x] | Folder browsing, file search, and document switching. |
| Outline | [x] | Heading extraction and jump navigation. |
| Live preview | [x] | Markdown content renders in place while preserving source text. |
| Source mode | [x] | Markdown source editing fallback. |
| Tables | [x] | Table preview, Markdown inside cells, and source editing. |
| Links | [x] | Rendered links can be opened directly. |
| Code blocks | [x] | Code block rendering and language recognition. |
| Math | [x] | `$...$`, `$$...$$`, and fenced `math` blocks. |
| LaTeX fragments | [x] | Fenced `latex` block preview. |
| Typst fragments | [x] | Fenced `typst` block preview with dark mode handling. |
| Command palette | [x] | Common editing and insertion commands. |
| Context menu | [x] | Copy, paste, insert, paragraph format, and text format actions. |
| Settings | [x] | Theme, editor, Markdown/math, export, and shortcut settings. |
| Pandoc detection | [x] | Bundled Pandoc, custom path, and system PATH detection. |
| Pandoc import | [x] | Import common document formats into Markdown. |
| Pandoc export | [x] | Export Markdown, HTML, PDF, DOCX, RTF, EPUB, LaTeX, and Typst. |

## Markdown Coverage

| Content | Status |
| --- | --- |
| H1-H6 headings | [x] |
| Paragraphs | [x] |
| Bold, italic, underline, strikethrough | [x] |
| Highlight and inline code | [x] |
| Block quotes | [x] |
| Bullet, ordered, and task lists | [x] |
| Tables | [x] |
| Links | [x] |
| Code blocks | [x] |
| Inline math | [x] |
| Block math | [x] |
| Fenced `math` blocks | [x] |
| Fenced `latex` blocks | [x] |
| Fenced `typst` blocks | [x] |
| YAML frontmatter language detection | [x] |
| Images | [ ] |
| Footnotes | [ ] |
| Wiki links | [ ] |
| Citations | [ ] |

## TODO

| Feature | Status | Notes |
| --- | --- | --- |
| Image insertion | [ ] | Local image insertion, paste support, and resource management. |
| Footnotes | [ ] | Markdown footnote rendering and editing. |
| Wiki links | [ ] | `[[page]]` links and backlink tracking. |
| Citations | [ ] | Zotero library integration and citation insertion. |
| Knowledge graph | [ ] | Graph view based on document links and citations. |
| Git workspace | [ ] | Local and cloud-backed version snapshots for writing sessions. |
| Text diff | [ ] | Writer-friendly document comparison. |
| Publishing presets | [ ] | Export templates and publishing profiles. |

## Download

Windows builds are published on the [GitHub Releases](https://github.com/KRPCT/InkStream/releases) page.

Available package types:

- Windows installer: `inkstream_*_x64-setup.exe`
- Windows MSI: `inkstream_*_x64_en-US.msi`
- Portable Windows build: `InkStream-*-windows-x64-portable.zip`

## Public Mirror

The public source mirror is available at [KRPCT/InkStream-public](https://github.com/KRPCT/InkStream-public).

Only the `main` branch is mirrored. Private development and release branches remain in the private source repository.

## Build From Source

Requirements:

- Node.js 22 or newer
- pnpm 10.x
- Rust stable toolchain
- Windows WebView2 Runtime
- Git LFS

Install dependencies:

```bash
cd inkstream
pnpm install --frozen-lockfile
```

Run the desktop app in development:

```bash
pnpm tauri dev
```

Build desktop installers:

```bash
pnpm tauri build
```

## Bundled Pandoc

InkStream bundles Pandoc for local document import and export. The executable is stored with Git LFS:

```text
inkstream/src-tauri/resources/pandoc/pandoc.exe
```

After cloning, if the file is still an LFS pointer, run:

```bash
git lfs pull
```

## Support The Project

If InkStream is useful to you, you can support ongoing development with a small donation.

<p align="center">
  <img src="docs/sponsor/alipay.jpg" alt="Alipay donation QR code" width="260" />
  <img src="docs/sponsor/wechat.jpg" alt="WeChat Pay donation QR code" width="260" />
</p>

## License

InkStream is licensed under the PolyForm Noncommercial License 1.0.0.

Noncommercial use is permitted under the license terms. Commercial use requires separate permission from the licensor.

SPDX-License-Identifier: `PolyForm-Noncommercial-1.0.0`

Full license text: https://polyformproject.org/licenses/noncommercial/1.0.0
