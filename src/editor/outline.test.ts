import { describe, expect, it } from "vitest";
import { extractMarkdownOutline } from "./outline";

describe("Markdown outline", () => {
  it("extracts navigable headings outside fenced code blocks", () => {
    const doc = [
      "# Title",
      "",
      "## Methods",
      "",
      "```md",
      "# not an outline item",
      "```",
      "",
      "### Tables & Links",
    ].join("\n");

    expect(extractMarkdownOutline(doc)).toEqual([
      { anchor: "title", from: 0, level: 1, text: "Title" },
      { anchor: "methods", from: 9, level: 2, text: "Methods" },
      { anchor: "tables-links", from: 54, level: 3, text: "Tables & Links" },
    ]);
  });
});
