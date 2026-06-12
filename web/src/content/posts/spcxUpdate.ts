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
 * Ship log: SpaceX IPO Agent (SPCX) — Nasdaq vs on-chain premium tracker.
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 */
export const SPCX_POST: PostUpdate = {
  meta: {
    updateNumber: 6,
    id: "spcx-ipo-agent",
    title: "SpaceX IPO Agent",
    published: "June 2026",
    tagline: "Live Nasdaq vs on-chain SPCX premium tracker with scam radar and safe buy paths",
    shareCopyVideo: `SHIP LOG · Syra just shipped the SpaceX IPO Agent.

SpaceX is going public as SPCX. We built a live hub that tracks the stock price vs tokenized versions on Solana, flags fake tokens, and shows three safe ways to buy.

→ Live Nasdaq vs SPCXx spread tracking
→ Scam radar + mint verifier before you swap
→ 3 buy paths: wallet, exchange, brokerage
→ Agent bias, venue quotes, and public API

Never overpay. Never buy a fake. One page for the IPO window.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · SpaceX IPO Agent is live on Syra.

Track SPCX stock vs SPCXx on Solana. Compare venues. Avoid scam tokens. Buy safely from your wallet.

Live spreads. Scam radar. Mint verifier. Three buy paths in plain English.

The IPO window is noisy. Syra makes it legible.

Try it at syraa.fun/spcx`,
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
        "Live Nasdaq vs on-chain SPCX tracker with scam radar, venue comparison, and safe buy paths for the IPO window.",
      badge: "Spreads · Scam radar · Buy safely",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-highlight-line",
      label: "Context",
      kicker: "Why this matters",
      headline: "The IPO window is noisy and full of fakes.",
      body: "SpaceX is going public as SPCX on Nasdaq. Traders also buy tokenized exposure as SPCXx on Solana, through xStocks, Backpack, and Ondo. Scammers copy the name with fake tokens. Prices diverge. Most people cannot tell what is real or whether they are overpaying.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-numbered-cards",
      label: "Shipped",
      kicker: "What we built",
      headline: "One hub for SpaceX IPO intelligence",
      body: "Syra's SpaceX IPO Agent tracks live Nasdaq quotes against verified on-chain venues, surfaces agent bias, and walks users through safe buy paths with scam protection built in.",
      highlights: [
        "Live Nasdaq vs SPCXx spread and premium/discount",
        "Scam radar flags impersonator tokens off-price",
        "Mint verifier before any swap",
        "Public /experiment/spcx API for agents and integrators",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-arrow-chain",
      label: "Flow",
      kicker: "How to use it",
      headline: "Understand, verify, then buy",
      steps: [
        {
          step: "01",
          title: "Check the spread",
          description:
            "Compare Nasdaq SPCX against live SPCXx quotes from xStocks, Backpack, and Ondo. See premium or discount at a glance.",
        },
        {
          step: "02",
          title: "Read agent bias",
          description:
            "Syra's agent take summarizes whether spreads look fair, stretched, or worth watching before you act.",
        },
        {
          step: "03",
          title: "Verify the mint",
          description:
            "Run the scam radar and mint verifier. We hide tokens whose price is wildly off the real stock price.",
        },
        {
          step: "04",
          title: "Pick your path",
          description:
            "Swap from wallet, trade on an exchange via xStocks, or use a brokerage track. All three routes in one page.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-mosaic",
      label: "Features",
      kicker: "Under the hood",
      headline: "Four layers of IPO protection",
      cards: [
        {
          title: "Price compare",
          subtitle: "Nasdaq vs on-chain",
          detail:
            "Live Yahoo Finance Nasdaq feed with $135 IPO reference fallback when the feed is offline.",
          accent: "gold",
        },
        {
          title: "Scam radar",
          subtitle: "Fake token filter",
          detail:
            "Impersonator pools flagged when price diverges too far from the real stock reference.",
          accent: "gold",
        },
        {
          title: "Venue playbook",
          subtitle: "3 buy paths",
          detail:
            "Crypto wallet swap, xStocks exchange route, and Backpack/Ondo brokerage tracks compared side by side.",
        },
        {
          title: "Agent API",
          subtitle: "Experiment rail",
          detail:
            "GET /latest, /feed, /config plus POST /tick for autonomous agents and Telegram previews.",
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
            "Full IPO guide with tabs for overview, buy safely, venues, and learn. Plain English for first-time buyers.",
          href: "https://www.syraa.fun/spcx",
        },
        {
          icon: LineChart,
          title: "Spread chart",
          description:
            "Historical premium/discount between Nasdaq and best live on-chain venue.",
        },
        {
          icon: ShieldCheck,
          title: "Mint verifier",
          description:
            "Paste any mint address. We check it against the verified catalog before you swap.",
        },
        {
          icon: AlertTriangle,
          title: "Scam radar",
          description:
            "Automatic detection of copycat tokens with prices too far from the real stock.",
        },
        {
          icon: Building2,
          title: "Venue cards",
          description:
            "xStocks, Backpack, and Ondo quotes with status, spread, and access notes.",
        },
        {
          icon: Code2,
          title: "Public API",
          description:
            "Experiment endpoints at /experiment/spcx for agents, bots, and share intel.",
          href: "https://api.syraa.fun/experiment/spcx/latest",
        },
        {
          icon: Wallet,
          title: "In-page swap",
          description:
            "Connect wallet and swap USDC or SOL for SPCXx after verification passes.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-counter-row",
      label: "Impact",
      kicker: "For traders",
      headline: "Never overpay. Never buy a fake.",
      stats: [
        { value: "3", label: "Verified buy paths" },
        { value: "24/7", label: "On-chain tracking" },
        { value: "$135", label: "IPO reference fallback" },
      ],
      narrative:
        "The SpaceX IPO will attract hype, copycat tokens, and wide spreads. Syra gives you one place to compare real prices, verify mints, and choose the route that fits how you already invest.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-banner",
      label: "Try it",
      headline: "Track the SpaceX IPO on Syra today.",
      subline:
        "Open the hub, check the spread, verify the mint, then buy from wallet, exchange, or brokerage. Not financial advice. Do your own research.",
      links: [
        { label: "SPCX hub", value: "syraa.fun/spcx", href: "https://www.syraa.fun/spcx" },
        { label: "Latest report", value: "api.syraa.fun/experiment/spcx/latest", href: "https://api.syraa.fun/experiment/spcx/latest" },
        { label: "Share intel", value: "Telegram preview", href: "https://api.syraa.fun/experiment/spcx/telegram-preview" },
      ],
    },
  ],
};
