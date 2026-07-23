import { Activity, Bot, CandlestickChart, Layers, Terminal, Waves } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: MevX trading data wired into Syra agent tools.
 */
export const MEVX_INTEGRATION_POST = defineVideoUpdate(
  {
    updateNumber: 30,
    id: "mevx-integration",
    title: "MevX Trading Data",
    published: "July 2026",
    tagline:
      "Syra agents pull MevX trades, token, and pool data for Solana DEX workflows — pay via the agent wallet.",
    shareCopyVideo: `SHIP LOG · Syra × MevX is live.

Trading agents need fresh DEX tape, not screenshots.

→ mevx-trades · mevx-token · mevx-pools
→ Solana meme + DEX market lookups
→ Partner API key billed through the Syra agent wallet

Agents call MevX. Operators stay in chat.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra × MevX trading data.

Agent tools: mevx-trades, mevx-token, mevx-pools.
Recent DEX history, token lookups, pool markets — Solana-first.

X → x.com/MEVX_Official
Try → syraa.fun/chat`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "MevX × Syra",
      subtitle:
        "Trading terminal data inside Syra agents. Trades, tokens, and pools — Solana DEX workflows without leaving chat.",
      badge: "Trading data · 3 tools",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-accent-bar",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents trade on tape, not vibes.",
      body: "MevX is a multi-chain trading terminal with deep Solana DEX coverage. Syra agents now call MevX directly for recent trades, token snapshots, and pool markets so execution decisions start from live market structure.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What we built",
      headline: "Three MevX agent tools",
      body: "We wired the MevX Trading API behind agentDirect tools. Set MEVX_API_KEY once; agents pay through the Syra wallet path like other partner data rails.",
      highlights: [
        "mevx-trades — recent DEX history by pool or wallet",
        "mevx-token — token market lookup (mint / address)",
        "mevx-pools — pool markets for Solana DEX pairs",
        "Partner page + Spend pillar routes for discovery",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Flow",
      kicker: "How it works",
      headline: "Chat → tool → MevX → answer",
      steps: [
        {
          step: "01",
          title: "Ask the agent",
          description: "Request trades, token stats, or pool context in Syra chat.",
        },
        {
          step: "02",
          title: "Pick a mevx-* tool",
          description: "Router selects mevx-trades, mevx-token, or mevx-pools.",
        },
        {
          step: "03",
          title: "MevX API",
          description: "Syra calls api.mevx.io with the partner key.",
        },
        {
          step: "04",
          title: "Trade-ready reply",
          description: "Structured market data lands in the agent response.",
        },
      ],
    },
    {
      id: "tools",
      kind: "cards",
      layout: "cards-bento",
      label: "Tools",
      kicker: "Agent surface",
      headline: "What agents can call",
      cards: [
        {
          title: "mevx-trades",
          subtitle: "Tape",
          detail: "Recent DEX trades filtered by pool or wallet for Solana flows.",
          accent: "gold",
        },
        {
          title: "mevx-token",
          subtitle: "Token",
          detail: "Market snapshot for a mint or address before you size a trade.",
          accent: "gold",
        },
        {
          title: "mevx-pools",
          subtitle: "Liquidity",
          detail: "Pool-level markets so agents see where liquidity actually sits.",
        },
        {
          title: "Partner billed",
          subtitle: "Ops",
          detail: "MEVX_API_KEY from landing-api.mevx.io. No key scattered into agent clients.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across agent spend",
      items: [
        {
          icon: Bot,
          title: "Agent chat",
          description: "Ask for MevX trades or token context mid-conversation.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: Terminal,
          title: "Tool call API",
          description: "POST /agent/tools/call with mevx-trades | mevx-token | mevx-pools.",
        },
        {
          icon: CandlestickChart,
          title: "Trading workflows",
          description: "Pair with swap and analyzer tools for research → action loops.",
        },
        {
          icon: Activity,
          title: "Spend pillar",
          description: "MevX listed under Spend for agent-payable market data.",
        },
        {
          icon: Waves,
          title: "MCP bridge",
          description: "Catalogued with other agent tools for Cursor and Claude.",
        },
        {
          icon: Layers,
          title: "Partner page",
          description: "syraa.fun/partner/mevx — capabilities and setup notes.",
          href: "https://www.syraa.fun/partner/mevx",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Coverage",
      headline: "Terminal data without leaving Syra",
      stats: [
        { value: "3", label: "Agent tools" },
        { value: "Solana", label: "DEX focus" },
        { value: "1", label: "Partner key" },
      ],
      narrative:
        "MevX supplies the trading tape. Syra agents call it on demand. Operators keep one wallet and one chat surface.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Ask Syra for MevX market data.",
      subline: "Fund the agent wallet, set MEVX_API_KEY, then call mevx-trades or mevx-token.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "Partner", value: "syraa.fun/partner/mevx", href: "https://www.syraa.fun/partner/mevx" },
        { label: "MevX", value: "mevx.io", href: "https://mevx.io" },
      ],
    },
  ],
);
