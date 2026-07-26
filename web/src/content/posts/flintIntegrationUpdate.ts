import { BookOpen, Bot, CandlestickChart, Layers, Terminal, Waves } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Flint Solana multi-maker spot market data for Syra agents.
 */
export const FLINT_INTEGRATION_POST = defineVideoUpdate(
  {
    updateNumber: 42,
    id: "flint-integration",
    title: "Flint Market Depth",
    published: "July 2026",
    tagline:
      "See real Solana order-book depth and cross-venue tape through Syra. Pay per call. No live market-making claims.",
    shareCopyVideo: `SHIP LOG · Syra × Flint is live.

Agents can now read Solana spot depth like a trading terminal, without building DEX infra.

→ flint-pairs · flint-book · flint-stats · flint-candles · flint-external-tape
→ Bid/ask books, venue stats, candles, Jupiter/OKX/DFlow tape
→ Pay per call with x402 or MCP

Market data only. Not Syra market-making on Flint.

Full breakdown in the video ↓
syraa.fun`,
    shareCopyPhoto: `SHIP LOG · Syra × Flint market depth.

Five new Spend tools: pairs, book, stats, candles, external tape.
See bid/ask depth and aggregator quotes for Solana spots. Pay per call.

syraa.fun · docs.flintlabs.dev`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Flint × Syra",
      subtitle:
        "Order-book depth and cross-venue tape for Solana agents. Ask once, pay per call, get the book.",
      badge: "Market data · 5 tools",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-accent-bar",
      label: "Context",
      kicker: "Why this matters",
      headline: "Price alone is not enough.",
      body: "Most agent feeds show a single mid price. Flint is a multi-maker Solana spot venue with a real virtual order book. Syra now wraps that depth so agents can see bids, asks, venue activity, and external aggregator tape before they act.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What we built",
      headline: "Five Flint Spend tools",
      body: "Public Flint market data is live behind x402 and MCP. No maker account required. Agents pay Syra per call and get structured JSON they can use immediately.",
      highlights: [
        "flint-pairs, listed markets and spot ids",
        "flint-book, L1/L2/L3 bid and ask depth",
        "flint-stats, makers, volume, venue health",
        "flint-candles, OHLC history or public fills",
        "flint-external-tape, Jupiter, OKX, DFlow, Titan quotes",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Flow",
      kicker: "How it works",
      headline: "Ask → pay → read the book",
      steps: [
        {
          step: "01",
          title: "Pick a pair",
          description: "Start with flint-pairs, or pass base like PUMP and quote USDC.",
        },
        {
          step: "02",
          title: "Call a Flint tool",
          description: "book, stats, candles, or external-tape via MCP or /flint/*.",
        },
        {
          step: "03",
          title: "Pay per call",
          description: "x402 USDC or agent wallet. Same Syra payment path as other Spend tools.",
        },
        {
          step: "04",
          title: "Use the depth",
          description: "Bids, asks, candles, or aggregator quotes land as structured JSON.",
        },
      ],
    },
    {
      id: "tools",
      kind: "cards",
      layout: "cards-bento",
      label: "Tools",
      kicker: "What you get",
      headline: "Easy tools. Clear answers.",
      cards: [
        {
          title: "Book",
          subtitle: "Depth",
          detail: "See resting bids and asks, not just one mid price.",
          accent: "gold",
        },
        {
          title: "Stats",
          subtitle: "Venue",
          detail: "Active makers, 24h volume, and fill activity at a glance.",
          accent: "gold",
        },
        {
          title: "Candles",
          subtitle: "History",
          detail: "OHLC ranges or recent public fills for the pair you care about.",
        },
        {
          title: "External tape",
          subtitle: "Compare",
          detail: "Short snapshot of aggregator fills and venue reference quotes.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live for agents and builders",
      items: [
        {
          icon: Bot,
          title: "Agent chat / MCP",
          description: "syra_spend_flint_book and friends in the curated MCP profile.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: Terminal,
          title: "HTTP x402",
          description: "GET /flint/book?base=PUMP&quote=USDC on api.syraa.fun.",
        },
        {
          icon: CandlestickChart,
          title: "Trading research",
          description: "Check depth before sizing a Jupiter or other Solana action.",
        },
        {
          icon: BookOpen,
          title: "Docs",
          description: "Flint integration notes and launch copy in the API docs.",
        },
        {
          icon: Waves,
          title: "Spend pillar",
          description: "Market intel rail, not Invest yield and not live MM.",
        },
        {
          icon: Layers,
          title: "Flint",
          description: "Multi-maker Solana spot. Learn more at docs.flintlabs.dev.",
          href: "https://docs.flintlabs.dev/",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Coverage",
      headline: "Depth without DEX homework",
      stats: [
        { value: "5", label: "Agent tools" },
        { value: "L2", label: "Book depth" },
        { value: "$0.001", label: "From per call" },
      ],
      narrative:
        "Flint supplies the venue book. Syra packages it for agents with pay-per-call pricing. You get depth and tape, not another mid-only feed.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Ask Syra for Flint depth.",
      subline:
        "Try flint-book on PUMP/USDC or WSOL/USDC. Market data only. We are not advertising live Syra market-making on Flint.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "API", value: "api.syraa.fun/flint/pairs", href: "https://api.syraa.fun/flint/pairs" },
        { label: "Flint", value: "docs.flintlabs.dev", href: "https://docs.flintlabs.dev/" },
      ],
    },
  ],
);
