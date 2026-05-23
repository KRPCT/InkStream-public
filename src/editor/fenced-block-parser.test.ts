import { describe, expect, it } from "vitest";
import {
  createBlockStableKey,
  parseDocumentLanguage,
  parseFencedBlocks,
  reduceBlockViewMode,
} from "./fenced-block-parser";

describe("fenced block parser", () => {
  it("parses math block range, content and meta", () => {
    const doc = "Intro\n```math {numbered: true, label: eq-one}\na^2+b^2=c^2\n```\n";

    const blocks = parseFencedBlocks(doc, "/note.md");

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: "math",
      language: "math",
      content: "a^2+b^2=c^2",
      meta: { numbered: true, label: "eq-one" },
    });
    expect(doc.slice(blocks[0].from, blocks[0].to)).toBe(
      "```math {numbered: true, label: eq-one}\na^2+b^2=c^2\n```\n",
    );
    expect(doc.slice(blocks[0].contentFrom, blocks[0].contentTo)).toBe("a^2+b^2=c^2");
  });

  it("classifies typst latex and regular code blocks", () => {
    const doc = [
      "```typst",
      "$ x $",
      "```",
      "```latex",
      "\\begin{equation}x\\end{equation}",
      "```",
      "```python",
      "print('ok')",
      "```",
    ].join("\n");

    const blocks = parseFencedBlocks(doc, "/multi.md");

    expect(blocks.map((block) => block.kind)).toEqual(["typst", "latex", "code"]);
    expect(blocks[2].language).toBe("python");
  });

  it("accepts a CRLF closing fence at end of file", () => {
    const [block] = parseFencedBlocks("```math\r\nx\r\n```\r\n", "/windows.md");

    expect(block.content).toBe("x");
    expect(block.diagnostics).toEqual([]);
  });

  it("returns diagnostics for meta parse errors without dropping source", () => {
    const doc = "```math {numbered: maybe}\nx\n```";

    const [block] = parseFencedBlocks(doc, "/bad.md");

    expect(block.content).toBe("x");
    expect(block.diagnostics).toHaveLength(1);
    expect(block.diagnostics[0].severity).toBe("error");
  });

  it("creates a stable key from path kind position and content hash", () => {
    const first = createBlockStableKey({
      path: "/note.md",
      kind: "math",
      from: 42,
      content: "x",
    });
    const second = createBlockStableKey({
      path: "/note.md",
      kind: "math",
      from: 42,
      content: "x",
    });

    expect(first).toBe(second);
    expect(first).toContain("/note.md:math:42:");
  });

  it("reduces block view mode changes only for known modes", () => {
    const state = reduceBlockViewMode({}, "block-a", "render");

    expect(state["block-a"]).toBe("render");
    expect(reduceBlockViewMode(state, "block-a", "split")["block-a"]).toBe("split");
  });

  it("parses frontmatter document language with markdown default", () => {
    expect(parseDocumentLanguage("# Title").language).toBe("markdown");
    expect(parseDocumentLanguage("---\nlanguage: latex\n---\nBody").language).toBe("latex");

    const invalid = parseDocumentLanguage("---\nlanguage: docx\n---\nBody");

    expect(invalid.language).toBe("markdown");
    expect(invalid.diagnostics).toHaveLength(1);
  });
});
