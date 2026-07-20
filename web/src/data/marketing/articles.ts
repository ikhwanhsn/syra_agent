export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  href: string;
  external: boolean;
  comingSoon: boolean;
  /** Attribution line above the title (Syra posts on X). */
  source: string;
  /** Public URL under `public/` (e.g. `/images/articles/foo.webp`). Omit for coming soon — card shows a placeholder instead. */
  coverImage?: string;
  publishedAt?: string;
  readingTimeMinutes?: number;
  tags?: string[];
}

/** Max cards in the home page “Insights & Updates” section. */
export const LANDING_ARTICLE_LIMIT = 3;

export const SYRA_X_SOURCE_LINE = "Published on X · @syra_agent";

export const articles: ArticleItem[] = [
  {
    id: "syra-sdk-guide",
    slug: "syra-sdk-guide",
    title: "Syra SDK: Build Agents That Pay for Intelligence on Every Call",
    description:
      "A complete guide to @syra-ai/sdk, install, auto-pay x402 routes, Spend intelligence, MCP integration, and production patterns for TypeScript agents on Solana and Base.",
    href: "/articles/syra-sdk-guide",
    external: false,
    comingSoon: false,
    source: SYRA_X_SOURCE_LINE,
    coverImage: "/images/articles/cover-syra-sdk-guide.webp",
    publishedAt: "2026-07-09",
    readingTimeMinutes: 12,
    tags: ["SDK", "TypeScript", "x402", "Developers"],
  },
  {
    id: "future-agentic-era",
    slug: "future-agentic-era-syra-positioning",
    title: "The Agentic Era Is Here, How Syra Positions for Pay-Per-Call Agents",
    description:
      "Autonomous agents are scaling fast, but most still cannot pay for tools without humans in the loop. Here is how Syra positions as pay-per-call crypto intelligence on Solana.",
    href: "/articles/future-agentic-era-syra-positioning",
    external: false,
    comingSoon: false,
    source: SYRA_X_SOURCE_LINE,
    coverImage: "/images/articles/cover-future-agentic-era.webp",
    publishedAt: "2026-07-05",
    readingTimeMinutes: 11,
    tags: ["Agents", "Strategy", "Solana", "Infrastructure"],
  },
  {
    id: "what-is-syra",
    slug: "what-is-syra",
    title: "What Is Syra? Pay-Per-Call Crypto APIs for Agents",
    description:
      "Syra is pay-per-call crypto intelligence for agents: settle USDC via x402, integrate with MCP or the SDK. A complete overview of what Syra is and who it is for.",
    href: "/articles/what-is-syra",
    external: false,
    comingSoon: false,
    source: SYRA_X_SOURCE_LINE,
    coverImage: "/images/articles/cover-what-is-syra.webp",
    publishedAt: "2026-07-01",
    readingTimeMinutes: 10,
    tags: ["Product", "Overview", "Agents", "Solana"],
  },
  {
    id: "syra-x402-mpp",
    slug: "syra-access-x402-mpp",
    title:
      "Syra Access: How x402 and MPP Actually Work (for Builders & Agents)",
    description:
      "Most APIs today are designed for humans. You sign up, get an API key, choose a pricing tier, and manage everything through a dashboard. That model works, but it starts to break down when the user is no longer a human, but an AI agent, a script, or an automated system that needs to make decisions in real time. Syra approaches this differently by focusing on on-demand access and request-level payments, powered by x402 and MPP.",
    href: "/articles/syra-access-x402-mpp",
    external: false,
    comingSoon: false,
    source: SYRA_X_SOURCE_LINE,
    coverImage: "/images/articles/cover-syra-access-x402-mpp.webp",
    publishedAt: "2026-03-12",
    readingTimeMinutes: 9,
    tags: ["x402", "MPP", "API"],
  },
  {
    id: "syra-x",
    slug: "syra-explained-smart-intelligence-agent",
    title:
      "Syra Explained: Pay-Per-Call Crypto APIs for Agents on Solana",
    description:
      "How Syra delivers pay-per-call crypto intelligence: x402 APIs, MCP, SDK, and agent-ready workflows on Solana.",
    href: "/articles/syra-explained-smart-intelligence-agent",
    external: false,
    comingSoon: false,
    source: SYRA_X_SOURCE_LINE,
    coverImage: "/images/articles/cover-syra-explained.webp",
    publishedAt: "2026-02-18",
    readingTimeMinutes: 7,
    tags: ["Solana", "Trading", "Agents"],
  },
];

export function getPublishedArticles(items: ArticleItem[] = articles): ArticleItem[] {
  return items.filter((a) => !a.comingSoon);
}

export function getAllArticleTags(items: ArticleItem[] = articles): string[] {
  const tags = new Set<string>();
  for (const article of items) {
    article.tags?.forEach((tag) => tags.add(tag));
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}
