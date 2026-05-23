export interface OutlineHeading {
  anchor: string;
  from: number;
  level: number;
  text: string;
}

export function extractMarkdownOutline(content: string): OutlineHeading[] {
  const headings: OutlineHeading[] = [];
  const anchors = new Map<string, number>();
  let cursor = 0;
  let fenceMarker: string | null = null;

  while (cursor <= content.length) {
    const end = lineEnd(content, cursor);
    const line = content.slice(cursor, end);
    const fence = line.match(/^\s*(```+|~~~+)/)?.[1] ?? null;

    if (fence) {
      if (!fenceMarker) {
        fenceMarker = fence[0];
      } else if (fence[0] === fenceMarker) {
        fenceMarker = null;
      }
    } else if (!fenceMarker) {
      const match = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (match) {
        const text = stripInlineMarkdown(match[2]).trim();
        if (text) {
          const base = slugHeading(text);
          const count = anchors.get(base) ?? 0;
          anchors.set(base, count + 1);
          headings.push({
            anchor: count === 0 ? base : `${base}-${count + 1}`,
            from: cursor + line.indexOf(match[1]),
            level: match[1].length,
            text,
          });
        }
      }
    }

    if (end === content.length) break;
    cursor = end + 1;
  }

  return headings;
}

export function slugHeading(text: string): string {
  const slug = stripInlineMarkdown(text)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .trim()
    .replace(/[\s-]+/g, "-");
  return slug || "section";
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "");
}

function lineEnd(content: string, from: number): number {
  const end = content.indexOf("\n", from);
  return end === -1 ? content.length : end;
}
