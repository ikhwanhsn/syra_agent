import type { ArticleDetail } from "@/data/marketing/articleContent";

const SITE_ORIGIN = "https://www.syraa.fun" as const;

type ParsedBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

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

    if (trimmed.startsWith("```")) {
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) i += 1;
      i += 1;
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      blocks.push({ type: "heading", text: stripInlineMarkdown(trimmed) });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      i += 1;
      while (i < lines.length && lines[i].trim().startsWith("|")) i += 1;
      continue;
    }

    if (trimmed.startsWith("- [") || trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const listLine = lines[i].trim();
        if (!listLine.startsWith("- ")) break;
        items.push(stripInlineMarkdown(listLine.replace(/^- /, "")));
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
        paraLine === "---"
      ) {
        break;
      }
      paraLines.push(paraLine);
      i += 1;
    }

    const text = stripInlineMarkdown(paraLines.join(" "));
    if (text && !text.startsWith("*Originally published")) {
      blocks.push({ type: "paragraph", text });
    }

    if (paraLines.length === 0) {
      i += 1;
    }
  }

  return blocks;
}

function blockToPlainText(block: ParsedBlock): string {
  switch (block.type) {
    case "heading":
      return block.text;
    case "paragraph":
      return block.text;
    case "callout":
      return block.text;
    case "list":
      return block.items.map((item) => `• ${item}`).join("\n");
    default:
      return "";
  }
}

/** Plain long-form article text for X — paragraphs only, no AI image prompts. */
export function buildArticleXContent(article: ArticleDetail): string {
  const articleUrl = `${SITE_ORIGIN}/articles/${article.slug}`;
  const blocks = parseMarkdownBlocks(article.content);

  const parts: string[] = [
    article.title,
    "",
    article.excerpt || article.description,
    "",
  ];

  for (const block of blocks) {
    const text = blockToPlainText(block).trim();
    if (!text) continue;
    parts.push(text);
    parts.push("");
  }

  parts.push(`Read the full article: ${articleUrl}`);
  parts.push("");
  parts.push("Follow @syra_agent for more updates.");

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
