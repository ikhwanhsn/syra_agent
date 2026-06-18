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
    coverImage: "/images/articles/article-one.webp",
    publishedAt: "2026-03-12",
    readingTimeMinutes: 9,
    tags: ["x402", "MPP", "API"],
  },
  {
    id: "syra-x",
    slug: "syra-explained-smart-intelligence-agent",
    title:
      "Syra Explained: Machine Money for AI Trading Agents on Solana",
    description:
      "How Syra delivers machine money infrastructure—x402 APIs, agent wallets, treasury policy, and execution-ready workflows for the agent economy on Solana.",
    href: "/articles/syra-explained-smart-intelligence-agent",
    external: false,
    comingSoon: false,
    source: SYRA_X_SOURCE_LINE,
    coverImage: "/images/articles/article-two.webp",
    publishedAt: "2026-02-18",
    readingTimeMinutes: 7,
    tags: ["Solana", "Trading", "Agents"],
  },
  {
    id: "article-2",
    slug: "coming-soon",
    title: "More from Syra on X",
    description:
      "The next article is in the works. Follow @syra_agent on X for release notes, API updates, and how we're building machine money for AI trading agents.",
    href: "#",
    external: false,
    comingSoon: true,
    source: SYRA_X_SOURCE_LINE,
  },
];
