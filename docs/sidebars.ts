import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Custom sidebar with grouped API documentation for better UX.
 * API docs are grouped by: Overview, News & Sentiment, Research, Trading, KOL, Partner integrations, Memecoin.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "welcome",

    // API Documentation — grouped by related APIs
    {
      type: "category",
      label: "API Documentation",
      link: {
        type: "generated-index",
        title: "API Documentation",
        description: "Syra x402 v2 API reference. All endpoints use the x402 payment protocol.",
      },
      items: [
        {
          type: "category",
          label: "Overview & Standards",
          collapsed: false,
          items: [
            "api documentation/x402-api-standard",
            "api documentation/check-status",
          ],
        },
        {
          type: "category",
          label: "News & Sentiment",
          collapsed: false,
          items: [
            "api documentation/news",
            "api documentation/sentiment",
            "api documentation/trending-headline",
            "api documentation/sundown-digest",
          ],
        },
        {
          type: "category",
          label: "Research & Discovery",
          collapsed: false,
          items: [
            "api documentation/browse",
            "api documentation/research",
            "api documentation/x-search",
            "api documentation/gems",
          ],
        },
        {
          type: "category",
          label: "Trading & Events",
          collapsed: false,
          items: [
            "api documentation/signal",
            "api documentation/event",
          ],
        },
        {
          type: "category",
          label: "KOL & Influencers",
          collapsed: false,
          items: [
            "api documentation/kol",
            "api documentation/crypto-kol",
          ],
        },
        {
          type: "category",
          label: "Partner: Nansen",
          collapsed: false,
          items: [
            "api documentation/smart-money",
            "api documentation/token-god-mode",
          ],
        },
        {
          type: "category",
          label: "Partner: DexScreener & Jupiter",
          collapsed: false,
          items: [
            "api documentation/dexscreener",
            "api documentation/trending-jupiter",
          ],
        },
        {
          type: "category",
          label: "Partner: Rugcheck",
          collapsed: false,
          items: [
            "api documentation/token-report",
            "api documentation/token-statistic",
          ],
        },
        {
          type: "category",
          label: "Partner: Bubblemaps & Binance",
          collapsed: false,
          items: [
            "api documentation/bubblemaps-maps",
            "api documentation/binance-correlation",
          ],
        },
        {
          type: "category",
          label: "Partner: Workfun",
          collapsed: false,
          items: ["api documentation/pump"],
        },
        {
          type: "category",
          label: "Memecoin",
          collapsed: true,
          items: [
            "api documentation/memecoin-fastest-holder-growth",
            "api documentation/memecoin-most-mentioned-smart-money-x",
            "api documentation/memecoin-accumulating-before-cex-rumors",
            "api documentation/memecoin-strong-narrative-low-market-cap",
            "api documentation/memecoin-by-experienced-devs",
            "api documentation/memecoin-unusual-whale-behavior",
            "api documentation/memecoin-trending-on-x-not-dex",
            "api documentation/memecoin-organic-traction",
            "api documentation/memecoin-surviving-market-dumps",
          ],
        },
      ],
    },

    // General (Telegram Bot)
    {
      type: "category",
      label: "Telegram Bot",
      link: {
        type: "generated-index",
        title: "Telegram Bot",
        description: "General documentation for the Syra Trading Agent Bot.",
      },
      items: [
        "general/getting-started",
        "general/how-it-works",
        "general/bot-features",
        "general/commands-reference",
        "general/all-supported-token",
        "general/trading-guidance",
      ],
    },

    // x402 Agent
    {
      type: "category",
      label: "x402 Agent",
      link: {
        type: "generated-index",
        title: "x402 Agent",
        description: "Syra autonomous agent on x402scan.",
      },
      items: [
        "x402 agent/getting-started",
        "x402 agent/agent-catalog",
      ],
    },

    // Token & Utility
    {
      type: "category",
      label: "Token & Utility",
      link: {
        type: "generated-index",
        title: "Token & Utility",
        description: "Token & Utility documentation for the Syra Trading Agent Bot.",
      },
      items: [
        "token/tokenomicsv2",
        "token/roadmapv2",
        "token/tokenomics",
        "token/roadmap",
      ],
    },
  ],
};

export default sidebars;
