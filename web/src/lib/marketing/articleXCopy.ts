import type { ArticleDetail } from "@/data/marketing/articleContent";

const SITE_ORIGIN = "https://www.syraa.fun" as const;

/** Soft target for X Article paragraph length (mobile-readable). */
const X_PARAGRAPH_SOFT_MAX = 320;

type ParsedBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "code"; text: string }
  | { type: "table"; rows: string[][] };

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s*\[!(\w+)]\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTableSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")));
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => stripInlineMarkdown(cell));
}

/** Split long prose into short X-friendly paragraphs (1–3 sentences). */
function splitIntoXParagraphs(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  if (cleaned.length <= X_PARAGRAPH_SOFT_MAX) return [cleaned];

  const sentences =
    cleaned.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [
      cleaned,
    ];

  if (sentences.length <= 1) return [cleaned];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (current && next.length > X_PARAGRAPH_SOFT_MAX) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function parseMarkdownBlocks(markdown: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Skip standalone image lines (alt text is not article body for X)
    if (/^!\[[^\]]*]\([^)]+\)$/.test(trimmed)) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      const text = codeLines.join("\n").replace(/\s+$/g, "").replace(/^\n+/, "");
      if (text.trim()) blocks.push({ type: "code", text });
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      blocks.push({ type: "heading", text: stripInlineMarkdown(trimmed) });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = parseTableRow(lines[i]);
        if (!isTableSeparatorRow(cells) && cells.some((c) => c.length > 0)) {
          rows.push(cells);
        }
        i += 1;
      }
      if (rows.length > 0) blocks.push({ type: "table", rows });
      continue;
    }

    if (trimmed.startsWith("- [") || trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const listLine = lines[i].trim();
        if (!listLine.startsWith("- ")) break;
        items.push(
          stripInlineMarkdown(listLine.replace(/^- \[[ xX]\]\s*/, "").replace(/^- /, "")),
        );
        i += 1;
      }
      if (items.length > 0) blocks.push({ type: "list", items });
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const listLine = lines[i].trim();
        if (!/^\d+\.\s/.test(listLine)) break;
        items.push(stripInlineMarkdown(listLine.replace(/^\d+\.\s+/, "")));
        i += 1;
      }
      if (items.length > 0) blocks.push({ type: "list", items });
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim());
        i += 1;
      }
      const text = stripInlineMarkdown(quoteLines.join(" "));
      if (text) blocks.push({ type: "callout", text });
      continue;
    }

    if (trimmed === "---") {
      i += 1;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const paraLine = lines[i].trim();
      if (!paraLine) break;
      if (
        paraLine.startsWith("#") ||
        paraLine.startsWith("```") ||
        paraLine.startsWith("|") ||
        paraLine.startsWith(">") ||
        paraLine.startsWith("- ") ||
        /^\d+\.\s/.test(paraLine) ||
        paraLine === "---" ||
        /^!\[[^\]]*]\([^)]+\)$/.test(paraLine)
      ) {
        break;
      }
      paraLines.push(paraLine);
      i += 1;
    }

    const text = stripInlineMarkdown(paraLines.join(" "));
    if (text && !text.startsWith("Originally published")) {
      blocks.push({ type: "paragraph", text });
    }

    if (paraLines.length === 0) {
      i += 1;
    }
  }

  return blocks;
}

function tableToPlainText(rows: string[][]): string {
  if (rows.length === 0) return "";

  const [header, ...body] = rows;
  const hasHeader = body.length > 0 && header.length >= 2;

  if (!hasHeader) {
    return rows
      .map((row) => `• ${row.filter(Boolean).join(" — ")}`)
      .join("\n");
  }

  const lines: string[] = [];
  for (const row of body) {
    const parts = row.map((cell, idx) => {
      const label = header[idx]?.trim();
      const value = cell.trim();
      if (!value) return "";
      if (!label || label.toLowerCase() === value.toLowerCase()) return value;
      // Two-column tables read best as "A — B"
      if (header.length === 2 && idx === 0) return value;
      if (header.length === 2 && idx === 1) return value;
      return `${label}: ${value}`;
    });

    if (header.length === 2) {
      const left = row[0]?.trim() ?? "";
      const right = row[1]?.trim() ?? "";
      if (left && right) lines.push(`• ${left} — ${right}`);
      else if (left || right) lines.push(`• ${left || right}`);
    } else {
      const joined = parts.filter(Boolean).join(" · ");
      if (joined) lines.push(`• ${joined}`);
    }
  }

  return lines.join("\n");
}

function blockToPlainParts(block: ParsedBlock): string[] {
  switch (block.type) {
    case "heading":
      return [block.text];
    case "paragraph":
      return splitIntoXParagraphs(block.text);
    case "callout":
      return splitIntoXParagraphs(block.text);
    case "list":
      return [block.items.map((item) => `• ${item}`).join("\n")];
    case "code":
      return [block.text.trim()];
    case "table": {
      const text = tableToPlainText(block.rows);
      return text ? [text] : [];
    }
    default:
      return [];
  }
}

/** Plain long-form article text for X Articles — full body, short paragraphs, no images. */
export function buildArticleXContent(article: ArticleDetail): string {
  const articleUrl = `${SITE_ORIGIN}/articles/${article.slug}`;
  const blocks = parseMarkdownBlocks(article.content);

  const parts: string[] = [article.title, ""];

  const dek = (article.excerpt || article.description).trim();
  if (dek) {
    parts.push(dek);
    parts.push("");
  }

  for (const block of blocks) {
    const chunks = blockToPlainParts(block);
    for (const chunk of chunks) {
      const text = chunk.trim();
      if (!text) continue;
      parts.push(text);
      parts.push("");
    }
  }

  parts.push(`Read the full article: ${articleUrl}`);
  parts.push("");
  parts.push("Follow @syra_agent for more.");

  if (article.tags.length > 0) {
    parts.push("");
    parts.push(
      `#Syra #Solana ${article.tags
        .slice(0, 3)
        .map((t) => `#${t.replace(/\s+/g, "")}`)
        .join(" ")}`,
    );
  }

  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function copyArticleXContent(article: ArticleDetail): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildArticleXContent(article));
    return true;
  } catch {
    return false;
  }
}
