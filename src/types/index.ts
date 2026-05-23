// ===== Phase 2 Type Definitions =====
// Preserved from v0.1
export type EditorMode = "standard" | "academic" | "creative";
export type Theme = "light" | "dark";
export type SidebarTab = "workspace" | "outline" | "git";
export type FencedBlockKind = "math" | "typst" | "latex" | "code";
export type FencedBlockViewMode = "source" | "render" | "split";
export type DocumentLanguage = "markdown" | "latex" | "typst" | "richtext";
export type PandocFormat = "markdown" | "html" | "pdf" | "docx" | "rtf" | "epub" | "latex" | "typst";

export interface BlockMeta {
  numbered?: boolean;
  label?: string;
}

export interface DocumentDiagnostic {
  severity: "warning" | "error";
  message: string;
  from: number;
  to: number;
}

export interface FencedBlockInfo {
  id: string;
  stableKey: string;
  kind: FencedBlockKind;
  language: string;
  from: number;
  to: number;
  contentFrom: number;
  contentTo: number;
  meta: BlockMeta;
  content: string;
  diagnostics: DocumentDiagnostic[];
}

// New Phase 2 types
export interface TabState {
  id: string;
  path: string;
  title?: string;
  dirty: boolean;
  stateJSON: any; // EditorState.toJSON() output from CodeMirror 6
  cursor: { line: number; col: number };
  scroll: number;
  renderMode: "source" | "live";
  documentLanguage?: DocumentLanguage;
  blockViewModes?: Record<string, FencedBlockViewMode>;
  savedContent?: string;
  untitled?: boolean;
}

export type VaultPath = string | null;

export type AccentMode = "standard" | "academic" | "creative";

// Preserved utility types
export interface FileNode {
  id: string;
  name: string;
  path?: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export interface EditorSettings {
  fontSize: number;
  defaultMode: EditorMode;
  autoSave: boolean;
  autoSaveInterval: number;
  lineWidth: number;
  pandocPath: string;
  defaultExportDirectory: string;
  defaultExportFormat: PandocFormat;
  renderMathByDefault: boolean;
  typstDarkMode: boolean;
}

export interface RecentEntry {
  path: string;
  kind: "file" | "workspace";
  label: string;
  openedAt: string;
}

export interface PandocProbeResult {
  ok: boolean;
  path?: string;
  source?: "configured" | "bundled" | "system";
  version?: string;
  error?: string;
}

export interface PandocExportOptions {
  inputPath?: string;
  outputPath: string;
  from: PandocFormat;
  to: PandocFormat;
  content?: string;
  pandocPath?: string;
  standalone?: boolean;
}

export interface PandocImportOptions {
  inputPath: string;
  from: PandocFormat;
  to?: "markdown";
  pandocPath?: string;
}

export interface PandocJobResult {
  ok: boolean;
  outputPath?: string;
  content?: string;
  format?: PandocFormat | "markdown";
  error?: string;
  stderr?: string;
}
