export interface ArticleItem {
  id: string;
  title: string;
  description: string;
  href: string;
  external: boolean;
  comingSoon: boolean;
  /** Attribution line above the title (Syra posts on X). */
  source: string;
  /** Public URL under `public/` (e.g. `/images/articles/foo.webp`). Omit for coming soon — card shows a placeholder instead. */
  coverImage?: string;
}

/** Max cards in the home page “Insights & Updates” section. */
export const LANDING_ARTICLE_LIMIT = 3;

export const SYRA_X_SOURCE_LINE = "Published on X · @syra_agent";

export const articles: ArticleItem[] = [
  {
    id: "syra-x402-mpp",
    title:
      "Syra Access: How x402 and MPP Actually Work (for Builders & Agents)",
    description:
      "Most APIs today are designed for humans. You sign up, get an API key, choose a pricing tier, and manage everything through a dashboard. That model works, but it starts to break down when the user is no longer a human, but an AI agent, a script, or an automated system that needs to make decisions in real time. Syra approaches this differently by focusing on on-demand access and request-level payments, powered by x402 and MPP.",
    href: "https://x.com/syra_agent/status/2042587572438982832",
    external: true,
    comingSoon: false,
    source: SYRA_X_SOURCE_LINE,
    coverImage: "/images/articles/article-one.webp",
  },
  {
    id: "syra-x",
    title:
      "Syra Explained: The AI Trading Intelligence Layer Powering the Agent Economy on Solana",
    description:
      "How Syra delivers real-time market intelligence, sentiment analysis, and automated execution for the agent economy on Solana.",
    href: "https://x.com/syra_agent/status/2021064952765874204",
    external: true,
    comingSoon: false,
    source: SYRA_X_SOURCE_LINE,
    coverImage: "/images/articles/article-two.webp",
  },
  {
    id: "article-2",
    title: "More from Syra on X",
    description:
      "The next article is in the works. Follow @syra_agent on X for release notes, API updates, and how we're building agent-native trading infrastructure.",
    href: "#",
    external: false,
    comingSoon: true,
    source: SYRA_X_SOURCE_LINE,
  },
];
