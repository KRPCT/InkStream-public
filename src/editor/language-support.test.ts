import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { createExtensions } from "./markdown-extensions";

const fencedLanguages = [
  "markdown",
  "latex",
  "typst",
  "javascript",
  "typescript",
  "python",
  "rust",
  "json",
  "yaml",
  "html",
  "css",
  "shell",
];

describe("fenced code language support", () => {
  it.each(fencedLanguages)("creates editor state for %s fenced blocks", (language) => {
    const state = EditorState.create({
      doc: `\`\`\`${language}\nvalue\n\`\`\``,
      extensions: createExtensions("source"),
    });

    expect(state.doc.toString()).toContain(language);
  });
});
