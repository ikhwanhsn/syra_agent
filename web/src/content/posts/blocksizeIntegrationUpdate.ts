import { BarChart3, Bot, Crosshair, LineChart, Search, Terminal } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Blocksize institutional VWAP / bid-ask market data for agents.
 */
export const BLOCKSIZE_INTEGRATION_POST = defineVideoUpdate(
  {
    updateNumber: 32,
    id: "blocksize-integration",
    title: "Blocksize Market Data",
    published: "July 2026",
    tagline:
      "Institutional VWAP, bid/ask, instrument search, and pre-trade checks via mcp.blocksize.info x402.",
    shareCopyVideo: `SHIP LOG · Syra × Blocksize is live.

Agents need oracle-grade VWAP — not a random mid.

→ blocksize-search · blocksize-vwap · blocksize-bidask
→ Pre-trade sanity checks (~$0.10)
→ mcp.blocksize.info with agent x402 / credits

Institutional tape for autonomous treasuries.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra × Blocksize market data.

VWAP + bid/ask + instrument search on mcp.blocksize.info.
Agents pay via Solana x402 / credits. No separate account required.

X → x.com/blocksizecap
Try → syraa.fun/chat`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Blocksize × Syra",
      subtitle:
        "Institutional VWAP and bid/ask snapshots for AI agents — MCP + x402, no API account to open.",
      badge: "VWAP · Bid/Ask · MCP",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Autonomous size needs a reference price.",
      body: "Retail mids lie under thin liquidity. Blocksize aggregates institutional crypto market data — VWAP, bid/ask, pre-trade guards — so Syra agents can quote and sanity-check before they move size.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "Four Blocksize agent tools",
      body: "Syra agents call mcp.blocksize.info with an X-AGENT-ID header and settle x402 from the agent wallet. Search is free discovery; quotes and checks are metered.",
      highlights: [
        "blocksize-search — find pairs before you pay",
        "blocksize-vwap / blocksize-bidask — live snapshots",
        "blocksize-pre-trade — freshness / spread guardrails",
        "Spend pillar + partner page for operators",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "Search. Quote. Guard. Act.",
      steps: [
        {
          step: "01",
          title: "Search instruments",
          description: "blocksize-search with q=SOLUSD (or similar).",
        },
        {
          step: "02",
          title: "Pull VWAP or bid/ask",
          description: "Paid GET on the pair — agent wallet settles 402.",
        },
        {
          step: "03",
          title: "Optional pre-trade",
          description: "Run blocksize-pre-trade before sizing a ticket.",
        },
        {
          step: "04",
          title: "Execute elsewhere",
          description: "Feed the quote into swap, invest, or custom agent logic.",
        },
      ],
    },
    {
      id: "tools",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Tools",
      kicker: "Agent surface",
      headline: "Metered market data",
      cards: [
        {
          title: "Search",
          subtitle: "Free discovery",
          detail: "Locate VWAP/bidask pairs before spending credits.",
          accent: "gold",
        },
        {
          title: "VWAP + Bid/Ask",
          subtitle: "Paid quotes",
          detail: "Institutional snapshots for pairs like SOLUSD and BTCUSD.",
          accent: "gold",
        },
        {
          title: "Pre-trade",
          subtitle: "Guardrails",
          detail: "Quote freshness, spread, and reference-drift checks (~$0.10).",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live for agent treasuries",
      items: [
        {
          icon: Bot,
          title: "Agent chat",
          description: "Ask for SOLUSD VWAP or bid/ask mid-conversation.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: Search,
          title: "Instrument search",
          description: "blocksize-search before paid quotes.",
        },
        {
          icon: LineChart,
          title: "VWAP snapshots",
          description: "blocksize-vwap for institutional reference prices.",
        },
        {
          icon: BarChart3,
          title: "Bid / ask",
          description: "blocksize-bidask with spread for execution context.",
        },
        {
          icon: Crosshair,
          title: "Pre-trade checks",
          description: "blocksize-pre-trade before autonomous size.",
        },
        {
          icon: Terminal,
          title: "Partner + MCP",
          description: "syraa.fun/partner/blocksize and agent tool catalog.",
          href: "https://www.syraa.fun/partner/blocksize",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For treasuries",
      headline: "Reference prices agents can trust",
      stats: [
        { value: "4", label: "Agent tools" },
        { value: "MCP", label: "Blocksize host" },
        { value: "402", label: "Agent checkout" },
      ],
      narrative:
        "No Blocksize account form. Agents search free, then pay per VWAP, bid/ask, or pre-trade check with Solana USDC credits.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Ask Syra for a Blocksize VWAP.",
      subline: "Search SOLUSD, pull VWAP, then bid/ask — all from agent chat.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        {
          label: "Partner",
          value: "syraa.fun/partner/blocksize",
          href: "https://www.syraa.fun/partner/blocksize",
        },
        { label: "Blocksize", value: "mcp.blocksize.info", href: "https://mcp.blocksize.info" },
      ],
    },
  ],
);
