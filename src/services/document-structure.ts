import type {
  BlockMeta,
  DocumentDiagnostic,
  DocumentLanguage,
  FencedBlockKind,
} from "@/types";
import { invokeBackend } from "./tauri";

export interface BackendFrontmatter {
  raw: string;
  from: number;
  to: number;
}

export interface BackendFencedBlock {
  id: string;
  kind: FencedBlockKind;
  language: string;
  from: number;
  to: number;
  content_from: number;
  content_to: number;
  meta: BlockMeta;
  content: string;
}

export interface BackendDocumentStructure {
  language: DocumentLanguage;
  frontmatter?: BackendFrontmatter;
  blocks: BackendFencedBlock[];
  diagnostics: DocumentDiagnostic[];
}

export interface FrontmatterLanguageResult {
  language: DocumentLanguage;
  diagnostics: DocumentDiagnostic[];
}

export interface LatexExportStub {
  status: "not_implemented";
  block_id: string;
  message: string;
}

export function parseDocumentStructure(content: string): Promise<BackendDocumentStructure> {
  return invokeBackend("parse_document_structure", { content });
}

export function validateFrontmatterLanguage(content: string): Promise<FrontmatterLanguageResult> {
  return invokeBackend("validate_frontmatter_language", { content });
}

export function exportLatexFragmentStub(blockId: string): Promise<LatexExportStub> {
  return invokeBackend("export_latex_fragment_stub", { blockId });
}
