import type { ArticleDetail } from "@/data/marketing/articleContent";

const SITE_ORIGIN = "https://www.syraa.fun" as const;
const PARAGRAPHS_PER_IMAGE = 2;

const PROMPT_STYLE_SUFFIX =
  "Dark charcoal background, cinematic rim lighting, cyan and violet accent glow, modern crypto infrastructure aesthetic, clean composition, 16:9 aspect ratio, ultra-detailed, no text, no logos, no watermarks.";

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

    // Defensive: unrecognized single-line tokens must not stall the parser.
    if (paraLines.length === 0) {
      i += 1;
    }
  }

  return blocks;
}

function blockToPlainText(block: ParsedBlock): string {
  switch (block.type) {
    case "heading":
      return `\n${block.text}\n`;
    case "paragraph":
      return `${block.text}\n\n`;
    case "callout":
      return `💡 ${block.text}\n\n`;
    case "list":
      return `${block.items.map((item) => `• ${item}`).join("\n")}\n\n`;
    default:
      return "";
  }
}

function detectVisualTheme(context: string): string {
  const lower = context.toLowerCase();

  if (/\bx402\b|payment required|micropayment|402/.test(lower)) {
    return "Technical visualization of HTTP 402 Payment Required: an autonomous AI agent sending a USDC micropayment through glowing network nodes to unlock an API response, request and response arrows, settlement proof badge";
  }
  if (/\bmpp\b|multi-party|split settlement|atomic split/.test(lower)) {
    return "Isometric diagram of one x402 payment splitting into three luminous streams routed to different API providers simultaneously, atomic settlement concept, interconnected service nodes";
  }
  if (/\bagent\b|autonomous|machine money/.test(lower)) {
    return "Futuristic autonomous AI agent silhouette made of circuit traces and data streams, operating on a Solana-style blockchain grid, decision nodes lighting up in cyan";
  }
  if (/\bapi\b|endpoint|playground|developer|builder/.test(lower)) {
    return "Sleek dark developer console showing API request builder with x402 payment flow indicator, code panels, status codes, modern devtools aesthetic";
  }
  if (/\bsolana\b|on-chain|mainnet|dex/.test(lower)) {
    return "High-speed Solana blockchain visualization with parallel transaction lanes, purple gradient energy, liquidity pools as glowing orbs, abstract on-chain activity";
  }
  if (/\btrading\b|market pulse|sentiment|quant|position/.test(lower)) {
    return "Abstract financial intelligence dashboard: sentiment wave curves, volume heatmap, risk flags as amber indicators, no readable tickers, data-driven trading context";
  }
  if (/\bintelligence\b|pipeline|ingest|analyze|signal/.test(lower)) {
    return "Data pipeline infographic: raw on-chain and social feeds flowing through layered analysis filters into structured agent-ready signals, funnel with glowing checkpoints";
  }
  if (/\bwallet\b|treasury|guardrail|policy/.test(lower)) {
    return "Secure agent wallet vault with translucent policy guardrails, budget caps as circular limits, USDC balance glow, protected execution environment";
  }
  if (/\binfrastructure\b|protocol|ecosystem/.test(lower)) {
    return "Layered crypto infrastructure stack floating in dark space, composable API modules connecting agents to intelligence and execution layers, hub-and-spoke architecture";
  }

  return `Editorial tech illustration visualizing "${context.slice(0, 80)}", abstract crypto product storytelling scene`;
}

function buildImagePromptBlock(
  imageIndex: number,
  sectionTitle: string,
  recentParagraphs: string[],
): string {
  const context = [sectionTitle, ...recentParagraphs].join(" ").trim();
  const scene = detectVisualTheme(context);

  return [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `🖼️ AI IMAGE PROMPT #${imageIndex}`,
    "Generate this image and attach it on X before the text below.",
    "",
    "PROMPT:",
    `${scene}. ${PROMPT_STYLE_SUFFIX}`,
    "",
    `CONTEXT: ${sectionTitle || "Article opening"}`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
  ].join("\n");
}

export function buildArticleXContent(article: ArticleDetail): string {
  const articleUrl = `${SITE_ORIGIN}/articles/${article.slug}`;
  const blocks = parseMarkdownBlocks(article.content);

  const lines: string[] = [
    "SYRA ARTICLE — X LONG-FORM DRAFT",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    article.title,
    "",
    article.excerpt || article.description,
    "",
    `🔗 ${articleUrl}`,
    "",
    buildImagePromptBlock(1, article.title, [article.excerpt || article.description]),
  ];

  let imageIndex = 2;
  let paragraphCount = 0;
  let currentSection = article.title;
  const recentParagraphs: string[] = [];

  for (const block of blocks) {
    if (block.type === "heading") {
      currentSection = block.text;
      recentParagraphs.length = 0;
      paragraphCount = 0;
    }

    if (block.type === "paragraph") {
      recentParagraphs.push(block.text);
      if (recentParagraphs.length > 3) recentParagraphs.shift();
      paragraphCount += 1;

      if (paragraphCount > 0 && paragraphCount % PARAGRAPHS_PER_IMAGE === 0) {
        lines.push(
          buildImagePromptBlock(imageIndex, currentSection, [...recentParagraphs]),
        );
        imageIndex += 1;
      }
    }

    lines.push(blockToPlainText(block).trimEnd());
    if (block.type === "paragraph" || block.type === "list" || block.type === "callout") {
      lines.push("");
    }
  }

  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    `Read the full article: ${articleUrl}`,
    "",
    "Follow @syra_agent for more updates.",
    "",
    `#Syra #Solana ${article.tags.slice(0, 3).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}`,
  );

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function copyArticleXContent(article: ArticleDetail): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildArticleXContent(article));
    return true;
  } catch {
    return false;
  }
}
