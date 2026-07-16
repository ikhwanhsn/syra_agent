import type { ArticleDetail } from "@/data/marketing/articleContent";

const SITE_ORIGIN = "https://www.syraa.fun" as const;

/** Soft target for X Article paragraph length (mobile-readable). */
const X_PARAGRAPH_SOFT_MAX = 320;

/**
 * X Articles paste support (HTML clipboard):
 * YES: h2/h3, p, strong, em, a, ul/ol, blockquote, s (strikethrough)
 * NO:  table, pre/code, h1 (title field only), hr, underline, latex, images
 * Fallback mapping for unsupported → supported is applied in renderers below.
 */
type ParsedBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "callout"; text: string; label?: string }
  | { type: "code"; text: string }
  | { type: "table"; rows: string[][] }
  | { type: "divider" };

/** Replace em dashes with commas so copy never looks AI-generated. */
export function normalizeEmDash(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/,\s*,+/g, ",")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function absolutizeHref(href: string): string {
  const trimmed = href.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${SITE_ORIGIN}${trimmed}`;
  return trimmed;
}

function stripInlineMarkdown(text: string): string {
  return normalizeEmDash(
    text
      .replace(/!\[[^\]]*]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^>\s*\[!(\w+)]\s*/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** Keep inline markdown for HTML conversion; only normalize whitespace + em dashes. */
function cleanRawInline(text: string): string {
  return normalizeEmDash(
    text
      .replace(/!\[[^\]]*]\([^)]+\)/g, "")
      .replace(/^>\s*\[!(\w+)]\s*/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Inline → X-supported HTML only.
 * Inline `code` is not paste-supported → bold.
 */
function inlineMarkdownToHtml(text: string): string {
  const cleaned = cleanRawInline(text);
  let html = escapeHtml(cleaned);

  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_m, label: string, href: string) => {
    const abs = absolutizeHref(href);
    if (!abs.startsWith("http")) return label;
    return `<a href="${escapeHtml(abs)}">${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Inline code unsupported on X paste → bold (keeps package names / tokens visible)
  html = html.replace(/`([^`]+)`/g, "<strong>$1</strong>");

  return html;
}

function isTableSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")));
}

function parseTableRowRaw(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

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

function parseCalloutLabel(quoteLines: string[]): { label?: string; text: string } {
  const stripped = quoteLines.map((l) => l.replace(/^>\s?/, ""));
  const first = stripped[0] ?? "";
  const match = first.match(/^\[!(\w+)]\s*(.*)$/i);
  if (!match) {
    return { text: stripped.join(" ") };
  }
  const kind = match[1].toUpperCase();
  const labelMap: Record<string, string> = {
    NOTE: "Note",
    TIP: "Tip",
    WARNING: "Warning",
    IMPORTANT: "Important",
    CAUTION: "Caution",
  };
  const rest = [match[2], ...stripped.slice(1)].filter((s) => s.trim().length > 0).join(" ");
  return { label: labelMap[kind] ?? kind, text: rest };
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

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = parseTableRowRaw(lines[i]);
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
        items.push(listLine.replace(/^- \[[ xX]\]\s*/, "").replace(/^- /, "").trim());
        i += 1;
      }
      if (items.length > 0) blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const listLine = lines[i].trim();
        if (!/^\d+\.\s/.test(listLine)) break;
        items.push(listLine.replace(/^\d+\.\s+/, "").trim());
        i += 1;
      }
      if (items.length > 0) blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim());
        i += 1;
      }
      const { label, text } = parseCalloutLabel(quoteLines);
      if (text.trim()) blocks.push({ type: "callout", text, label });
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "divider" });
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

    const text = paraLines.join(" ").trim();
    if (text && !stripInlineMarkdown(text).startsWith("Originally published")) {
      blocks.push({ type: "paragraph", text });
    }

    if (paraLines.length === 0) {
      i += 1;
    }
  }

  return blocks;
}

/** Flatten table rows to "Label: value" lines (raw markdown kept for HTML bold). */
function tableToItemLines(rows: string[][], forPlain: boolean): string[] {
  if (rows.length === 0) return [];

  const mapped = rows.map((row) =>
    row.map((cell) => (forPlain ? stripInlineMarkdown(cell) : cleanRawInline(cell))),
  );
  const [header, ...body] = mapped;
  const hasHeader = body.length > 0 && header.length >= 2;

  if (!hasHeader) {
    return mapped.map((row) => row.filter(Boolean).join(": ")).filter(Boolean);
  }

  const lines: string[] = [];
  for (const row of body) {
    if (header.length === 2) {
      const left = row[0]?.trim() ?? "";
      const right = row[1]?.trim() ?? "";
      if (left && right) lines.push(`${left}: ${right}`);
      else if (left || right) lines.push(left || right);
      continue;
    }

    const parts = row
      .map((cell, idx) => {
        const label = header[idx]?.trim();
        const value = cell.trim();
        if (!value) return "";
        if (!label || label.toLowerCase() === value.toLowerCase()) return value;
        return `${label}: ${value}`;
      })
      .filter(Boolean);
    if (parts.length > 0) lines.push(parts.join(" · "));
  }

  return lines;
}

function tableToPlainText(rows: string[][]): string {
  return tableToItemLines(rows, true)
    .map((line) => `• ${line}`)
    .join("\n");
}

function tableToHtml(rows: string[][]): string {
  const items = tableToItemLines(rows, false)
    .map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`)
    .join("");
  return items ? `<ul>${items}</ul>` : "";
}

/**
 * Code fences are not paste-supported → blockquote (supported).
 * Keeps every line so content is not lost.
 */
function codeToHtml(code: string): string {
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const body = lines
    .map((line) => `<p>${escapeHtml(line.length > 0 ? line : " ")}</p>`)
    .join("");
  return `<blockquote><p><em>Code</em></p>${body}</blockquote>`;
}

function codeToPlain(code: string): string {
  return `Code\n${code.trim()}`;
}

function blockToPlainParts(block: ParsedBlock): string[] {
  switch (block.type) {
    case "heading":
      return [stripInlineMarkdown(block.text)];
    case "paragraph":
      return splitIntoXParagraphs(stripInlineMarkdown(block.text));
    case "callout": {
      const body = stripInlineMarkdown(block.text);
      const prefixed = block.label ? `${block.label}: ${body}` : body;
      return splitIntoXParagraphs(prefixed);
    }
    case "list":
      return [
        block.items
          .map((item, idx) =>
            block.ordered
              ? `${idx + 1}. ${stripInlineMarkdown(item)}`
              : `• ${stripInlineMarkdown(item)}`,
          )
          .join("\n"),
      ];
    case "code":
      return [codeToPlain(block.text)];
    case "table": {
      const text = tableToPlainText(block.rows);
      return text ? [text] : [];
    }
    case "divider":
      return ["· · ·"];
    default:
      return [];
  }
}

function blockToHtml(block: ParsedBlock): string {
  switch (block.type) {
    case "heading": {
      // X reserves h1 for the article title field — body headings are h2/h3 only
      const tag = block.level <= 2 ? "h2" : "h3";
      return `<${tag}>${inlineMarkdownToHtml(block.text)}</${tag}>`;
    }
    case "paragraph":
      return splitIntoXParagraphs(cleanRawInline(block.text))
        .map((p) => `<p>${inlineMarkdownToHtml(p)}</p>`)
        .join("");
    case "callout": {
      const body = inlineMarkdownToHtml(block.text);
      const labeled = block.label
        ? `<p><em>${escapeHtml(block.label)}:</em> ${body}</p>`
        : `<p>${body}</p>`;
      return `<blockquote>${labeled}</blockquote>`;
    }
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`)
        .join("");
      return `<${tag}>${items}</${tag}>`;
    }
    case "code":
      return codeToHtml(block.text);
    case "table":
      return tableToHtml(block.rows);
    case "divider":
      // Native divider needs Insert menu; visual break that pastes cleanly
      return `<p>· · ·</p>`;
    default:
      return "";
  }
}

function buildFooterParts(article: ArticleDetail): { plain: string[]; html: string[] } {
  const articleUrl = `${SITE_ORIGIN}/articles/${article.slug}`;
  const plain: string[] = [
    "· · ·",
    "",
    `Read the full article: ${articleUrl}`,
    "",
    "Follow @syra_agent for more.",
  ];
  const html: string[] = [
    `<p>· · ·</p>`,
    `<p>Read the full article: <a href="${articleUrl}">${articleUrl}</a></p>`,
    `<p>Follow <a href="https://x.com/syra_agent">@syra_agent</a> for more.</p>`,
  ];

  if (article.tags.length > 0) {
    const tags = `#Syra #Solana ${article.tags
      .slice(0, 3)
      .map((t) => `#${t.replace(/\s+/g, "")}`)
      .join(" ")}`;
    plain.push("");
    plain.push(tags);
    html.push(`<p>${escapeHtml(tags)}</p>`);
  }

  return { plain, html };
}

/** Plain long-form article text for X Articles: full body, short paragraphs, no images. */
export function buildArticleXContent(article: ArticleDetail): string {
  const blocks = parseMarkdownBlocks(article.content);
  const parts: string[] = [normalizeEmDash(article.title), ""];

  const dek = normalizeEmDash((article.excerpt || article.description).trim());
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

  const footer = buildFooterParts(article);
  parts.push(...footer.plain);

  return normalizeEmDash(parts.join("\n").replace(/\n{3,}/g, "\n\n"))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * HTML for X Article paste.
 * Only emits tags X auto-formats: h2/h3, p, strong, em, s, a, ul/ol, blockquote.
 * Unsupported source (table/code/hr/h1/inline-code) is remapped first.
 */
export function buildArticleXHtml(article: ArticleDetail): string {
  const blocks = parseMarkdownBlocks(article.content);
  // Title as bold lead (not h1 — X title field owns h1)
  const parts: string[] = [
    `<p><strong>${escapeHtml(normalizeEmDash(article.title))}</strong></p>`,
  ];

  const dek = normalizeEmDash((article.excerpt || article.description).trim());
  if (dek) {
    parts.push(`<p><em>${escapeHtml(dek)}</em></p>`);
  }

  for (const block of blocks) {
    const html = blockToHtml(block);
    if (html) parts.push(html);
  }

  const footer = buildFooterParts(article);
  parts.push(...footer.html);

  return parts.join("\n");
}

export async function copyArticleXContent(article: ArticleDetail): Promise<boolean> {
  const plain = buildArticleXContent(article);
  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      const html = buildArticleXHtml(article);
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(plain);
    return true;
  } catch {
    return false;
  }
}
