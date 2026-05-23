import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportLatexFragmentStub,
  parseDocumentStructure,
  validateFrontmatterLanguage,
} from "./document-structure";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("document structure service", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    Object.defineProperty(globalThis, "__TAURI_INTERNALS__", {
      configurable: true,
      value: { invoke: vi.fn() },
    });
  });

  it("invokes parse_document_structure with content", async () => {
    invokeMock.mockResolvedValueOnce({
      language: "markdown",
      blocks: [],
      diagnostics: [],
    });

    const result = await parseDocumentStructure("# Title");

    expect(invokeMock).toHaveBeenCalledWith("parse_document_structure", { content: "# Title" });
    expect(result.language).toBe("markdown");
  });

  it("invokes validate_frontmatter_language", async () => {
    invokeMock.mockResolvedValueOnce({ language: "typst", diagnostics: [] });

    const result = await validateFrontmatterLanguage("---\nlanguage: typst\n---");

    expect(invokeMock).toHaveBeenCalledWith("validate_frontmatter_language", {
      content: "---\nlanguage: typst\n---",
    });
    expect(result.language).toBe("typst");
  });

  it("invokes latex export stub command", async () => {
    invokeMock.mockResolvedValueOnce({
      status: "not_implemented",
      block_id: "latex-1",
      message: "stub",
    });

    const result = await exportLatexFragmentStub("latex-1");

    expect(invokeMock).toHaveBeenCalledWith("export_latex_fragment_stub", {
      blockId: "latex-1",
    });
    expect(result.status).toBe("not_implemented");
  });
});
