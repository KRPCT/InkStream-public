import type {
  DocumentDiagnostic,
  DocumentLanguage,
  FencedBlockInfo,
  FencedBlockKind,
  FencedBlockViewMode,
} from "@/types";

const supportedLanguages = new Set<DocumentLanguage>(["markdown", "latex", "typst", "richtext"]);

interface StableKeyInput {
  path: string;
  kind: FencedBlockKind;
  from: number;
  content: string;
}

export function parseDocumentLanguage(content: string): {
  language: DocumentLanguage;
  diagnostics: DocumentDiagnostic[];
} {
  const diagnostics: DocumentDiagnostic[] = [];
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return { language: "markdown", diagnostics };
  }

  const firstLineEnd = lineEnd(content, 0);
  let cursor = nextLine(content, firstLineEnd);

  while (cursor < content.length) {
    const end = lineEnd(content, cursor);
    if (content.slice(cursor, end).trim() === "---") {
      const yaml = content.slice(nextLine(content, firstLineEnd), cursor);
      return {
        language: parseLanguageYaml(yaml, nextLine(content, firstLineEnd), diagnostics),
        diagnostics,
      };
    }
    cursor = nextLine(content, end);
  }

  diagnostics.push({
    severity: "error",
    message: "YAML frontmatter is missing a closing delimiter",
    from: 0,
    to: Math.min(3, content.length),
  });
  return { language: "markdown", diagnostics };
}

export function parseFencedBlocks(content: string, path = "untitled.md"): FencedBlockInfo[] {
  const blocks: FencedBlockInfo[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const start = cursor;
    const end = lineEnd(content, start);
    const line = content.slice(start, end);
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (!trimmed.startsWith("```")) {
      cursor = nextLine(content, end);
      continue;
    }

    const from = start + indent;
    const info = trimmed.slice(3).trim();
    const contentFrom = nextLine(content, end);
    let search = contentFrom;
    let contentTo = content.length;
    let to = content.length;
    let closed = false;
    const diagnostics: DocumentDiagnostic[] = [];

    while (search < content.length) {
      const candidateEnd = lineEnd(content, search);
      const candidate = content.slice(search, candidateEnd);
      if (candidate.trimStart().startsWith("```")) {
        contentTo = Math.max(contentFrom, search - lineBreakLengthBefore(content, search));
        to = nextLine(content, candidateEnd);
        closed = true;
        break;
      }
      search = nextLine(content, candidateEnd);
    }

    if (!closed) {
      diagnostics.push({
        severity: "error",
        message: "Fenced block is missing a closing delimiter",
        from,
        to: content.length,
      });
    }

    const { language, meta, diagnostics: metaDiagnostics } = parseInfoString(info, from);
    diagnostics.push(...metaDiagnostics);
    const blockContent = content.slice(contentFrom, contentTo);
    const kind = toBlockKind(language);
    const stableKey = createBlockStableKey({ path, kind, from, content: blockContent });

    blocks.push({
      id: stableKey,
      stableKey,
      kind,
      language,
      from,
      to,
      contentFrom,
      contentTo,
      meta,
      content: blockContent,
      diagnostics,
    });

    cursor = Math.max(to, nextLine(content, end));
  }

  return blocks;
}

export function createBlockStableKey(input: StableKeyInput): string {
  return `${input.path}:${input.kind}:${input.from}:${fnv1a(input.content)}`;
}

export function reduceBlockViewMode(
  modes: Record<string, FencedBlockViewMode>,
  key: string,
  mode: FencedBlockViewMode,
): Record<string, FencedBlockViewMode> {
  return { ...modes, [key]: mode };
}

function parseLanguageYaml(
  yaml: string,
  offset: number,
  diagnostics: DocumentDiagnostic[],
): DocumentLanguage {
  let language: DocumentLanguage = "markdown";
  let cursor = offset;

  for (const line of yaml.split(/(?<=\n)/)) {
    const visible = line.replace(/\r?\n$/, "");
    const trimmed = visible.trim();
    if (trimmed.startsWith("language:")) {
      const raw = trimmed.slice("language:".length).trim().replace(/^['"]|['"]$/g, "");
      if (raw === "") {
        language = "markdown";
      } else if (supportedLanguages.has(raw as DocumentLanguage)) {
        language = raw as DocumentLanguage;
      } else {
        diagnostics.push({
          severity: "error",
          message: `Unsupported document language '${raw}'`,
          from: cursor,
          to: cursor + visible.length,
        });
      }
    }
    cursor += line.length;
  }

  return language;
}

function parseInfoString(info: string, offset: number) {
  const [rawLanguage = "", rawMeta = ""] = splitInfo(info);
  const language = rawLanguage.toLowerCase();
  const diagnostics: DocumentDiagnostic[] = [];
  const meta: FencedBlockInfo["meta"] = {};
  const metaSource = rawMeta.trim().replace(/^\{|\}$/g, "");

  if (!metaSource) {
    return { language, meta, diagnostics };
  }

  for (const entry of metaSource.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(":");
    if (separator === -1) {
      diagnostics.push({
        severity: "error",
        message: "Block meta entries must use key: value syntax",
        from: offset,
        to: offset + info.length,
      });
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key === "numbered") {
      if (value === "true") {
        meta.numbered = true;
      } else if (value === "false") {
        meta.numbered = false;
      } else {
        diagnostics.push({
          severity: "error",
          message: "Block meta 'numbered' must be true or false",
          from: offset,
          to: offset + info.length,
        });
      }
    } else if (key === "label") {
      meta.label = value;
    } else {
      diagnostics.push({
        severity: "warning",
        message: `Unknown block meta key '${key}'`,
        from: offset,
        to: offset + info.length,
      });
    }
  }

  return { language, meta, diagnostics };
}

function splitInfo(info: string): [string, string] {
  const match = info.match(/^(\S+)(?:\s+([\s\S]*))?$/);
  return [match?.[1] ?? "", match?.[2] ?? ""];
}

function toBlockKind(language: string): FencedBlockKind {
  if (language === "math" || language === "typst" || language === "latex") return language;
  return "code";
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function lineEnd(content: string, from: number): number {
  const index = content.indexOf("\n", from);
  return index === -1 ? content.length : index;
}

function nextLine(content: string, end: number): number {
  return end < content.length && content[end] === "\n" ? end + 1 : end;
}

function lineBreakLengthBefore(content: string, position: number): number {
  if (position >= 2 && content.slice(position - 2, position) === "\r\n") return 2;
  if (position >= 1 && content[position - 1] === "\n") return 1;
  return 0;
}
