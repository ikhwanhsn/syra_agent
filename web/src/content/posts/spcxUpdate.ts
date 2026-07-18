import {
  AlertTriangle,
  Building2,
  Code2,
  LineChart,
  Rocket,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: SpaceX IPO Agent (SPCX): live Nasdaq vs on-chain premium tracker with buy/sell trading.
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 */
export const SPCX_POST: PostUpdate = {
  meta: {
    updateNumber: 6,
    id: "spcx-ipo-agent",
    title: "SpaceX IPO Agent",
    published: "June 2026",
    tagline: "Live Nasdaq vs SPCXx tracking with realtime buy and sell trading on Solana",
    shareCopyVideo: `SHIP LOG · Buy and sell just shipped for the SpaceX IPO Agent.

SpaceX is live as SPCX on Nasdaq. Syra tracks the stock vs tokenized SPCXx on Solana in realtime, then lets you buy or sell from one Trade tab with a live price chart.

→ Realtime Nasdaq vs SPCXx spread tracking (~10s refresh)
→ Buy or sell SPCXx with USDC or SOL from your wallet
→ Live price chart and premium trade card UI
→ Jupiter swap with auth fixes and reliable fallback routing

Never overpay. Never buy a fake. Trade the spread on one page.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · SpaceX IPO Agent now supports buy and sell.

SPCX is live on Nasdaq. Track realtime spreads vs SPCXx on Solana. Buy or sell from the Trade tab with a live chart and wallet swap.

Realtime prices. Buy + sell. Venue comparison. Scam protection built in.

The IPO is live. Syra makes trading it legible.

Try it → syraa.fun/spcx`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-tagline-stack",
      label: "Cover",
      eyebrow: "Ship log",
      title: "SpaceX IPO Agent",
      subtitle:
        "Live Nasdaq vs SPCXx tracking with realtime buy and sell trading, live price chart, and venue comparison.",
      badge: "Realtime · Buy + sell · Live chart",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-highlight-line",
      label: "Context",
      kicker: "Why this matters",
      headline: "The IPO is live. Trading it should not be guesswork.",
      body: "SpaceX is public as SPCX on Nasdaq. Traders also buy and sell tokenized SPCXx on Solana through xStocks, Backpack, and Ondo. Spreads move fast. Scammers still copy the name. Most people need one place to see live prices, compare venues, and trade without overpaying or buying a fake.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-numbered-cards",
      label: "Shipped",
      kicker: "What we built",
      headline: "One hub to track, compare, and trade SpaceX exposure",
      body: "Syra's SpaceX IPO Agent now refreshes Nasdaq and on-chain quotes in realtime, surfaces agent bias on stretched spreads, and ships a premium Trade tab where users buy or sell SPCXx directly from their wallet.",
      highlights: [
        "Realtime Nasdaq vs SPCXx spread with ~10s polling",
        "Trade tab: buy or sell SPCXx with USDC or SOL",
        "Live price chart and compact safety checks before swap",
        "Public /experiment/spcx API for agents and integrators",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-arrow-chain",
      label: "Flow",
      kicker: "How to use it",
      headline: "Check the spread, then trade",
      steps: [
        {
          step: "01",
          title: "Watch live prices",
          description:
            "Compare Nasdaq SPCX against live SPCXx quotes from xStocks, Backpack, and Ondo. Premium or discount updates every ~10 seconds.",
        },
        {
          step: "02",
          title: "Read agent bias",
          description:
            "Syra's agent take summarizes whether spreads look fair, stretched, or worth watching before you trade.",
        },
        {
          step: "03",
          title: "Open Trade tab",
          description:
            "Toggle Buy or Sell. See your wallet balance, pick a quick amount, and review estimated output on the live chart.",
        },
        {
          step: "04",
          title: "Confirm swap",
          description:
            "Swap USDC or SOL for SPCXx on buy, or sell SPCXx back to USDC or SOL. Safety checks run before execution.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-mosaic",
      label: "Features",
      kicker: "Under the hood",
      headline: "Four layers of live-market trading",
      cards: [
        {
          title: "Realtime tracking",
          subtitle: "Nasdaq vs on-chain",
          detail:
            "Live Yahoo Finance Nasdaq feed with ~10s frontend polling and lazy backend ticks on every /latest request.",
          accent: "gold",
        },
        {
          title: "Buy + sell",
          subtitle: "Wallet swap",
          detail:
            "Trade tab supports both directions: pay USDC/SOL to buy SPCXx, or sell SPCXx back with balance presets and Max.",
          accent: "gold",
        },
        {
          title: "Live chart",
          subtitle: "Premium trade UI",
          detail:
            "Compact realtime price chart, quick amount chips, estimated output, and collapsible safety strip on the Trade tab.",
        },
        {
          title: "Reliable routing",
          subtitle: "Jupiter swaps",
          detail:
            "Jupiter Ultra with V1 fallback, authenticated wallet signing, and swap tools enabled for agent wallets.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-orbit",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across web and API",
      items: [
        {
          icon: Rocket,
          title: "SPCX hub",
          description:
            "Full IPO guide with tabs for overview, trade, venues, and learn. Plain English for first-time buyers and sellers.",
          href: "https://www.syraa.fun/spcx",
        },
        {
          icon: LineChart,
          title: "Live price chart",
          description:
            "Realtime chart on the Trade tab with Nasdaq and best on-chain venue prices side by side.",
        },
        {
          icon: Wallet,
          title: "Buy + sell swap",
          description:
            "Connect wallet and trade SPCXx both ways: USDC/SOL in, or SPCXx out, with balance-aware presets.",
        },
        {
          icon: ShieldCheck,
          title: "Safety strip",
          description:
            "Collapsible scam and mint checks on the Trade tab so protection stays visible without clutter.",
        },
        {
          icon: Building2,
          title: "Venue cards",
          description:
            "xStocks, Backpack, and Ondo quotes with status, spread, and access notes.",
        },
        {
          icon: AlertTriangle,
          title: "Scam radar",
          description:
            "Automatic detection of copycat tokens with prices too far from the live stock.",
        },
        {
          icon: Code2,
          title: "Public API",
          description:
            "Experiment endpoints at /experiment/spcx for agents, bots, and share intel.",
          href: "https://api.syraa.fun/experiment/spcx/latest",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-counter-row",
      label: "Impact",
      kicker: "For traders",
      headline: "Track live. Trade both ways. Stay protected.",
      stats: [
        { value: "Buy + Sell", label: "Two-way wallet trading" },
        { value: "~10s", label: "Realtime price refresh" },
        { value: "24/7", label: "On-chain tracking" },
      ],
      narrative:
        "The SpaceX IPO is live and spreads will move. Syra gives you realtime Nasdaq vs on-chain comparison, a premium Trade tab to buy or sell SPCXx, and built-in scam protection so you never overpay or trade a fake token.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-banner",
      label: "Try it",
      headline: "Trade SpaceX exposure on Syra today.",
      subline:
        "Open the hub, watch live spreads, then buy or sell SPCXx from the Trade tab. Compare venues, verify mints, and choose the route that fits how you invest. Not financial advice. Do your own research.",
      links: [
        { label: "SPCX hub", value: "syraa.fun/spcx", href: "https://www.syraa.fun/spcx" },
        { label: "Latest report", value: "api.syraa.fun/experiment/spcx/latest", href: "https://api.syraa.fun/experiment/spcx/latest" },
        { label: "Share intel", value: "Telegram preview", href: "https://api.syraa.fun/experiment/spcx/telegram-preview" },
      ],
    },
  ],
};
