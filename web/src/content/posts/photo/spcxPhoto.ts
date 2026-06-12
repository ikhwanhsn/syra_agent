import { SPCX_POST } from "../spcxUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { SPCX_PHOTO_SHARE_COPIES } from "./shareCopies/spcxShareCopies";

const copies = SPCX_PHOTO_SHARE_COPIES;

/** Photo-format content for the SpaceX IPO Agent ship log — 15 cards, 15 X posts. */
export const SPCX_PHOTO = definePhotoUpdate(SPCX_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-minimal",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Realtime · Buy + sell · Live chart",
      title: "SpaceX IPO Agent",
      subtitle:
        "Live Nasdaq vs SPCXx tracking with realtime buy and sell trading and a live price chart.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-center",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "The IPO is live. Trading it should not be guesswork.",
      body: "SpaceX is public as SPCX on Nasdaq. Traders buy and sell SPCXx on Solana. Spreads move fast. Syra built realtime tracking plus two-way wallet trading on one page.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Track live. Trade both ways. Stay protected.",
      narrative:
        "Realtime Nasdaq vs SPCXx spreads. Buy or sell from your wallet. Safety checks before every swap. The live IPO market needs legibility.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How to use it",
      headline: "Check the spread, then trade.",
      steps: [
        { step: "01", title: "Watch live prices", description: "Nasdaq SPCX vs SPCXx with ~10s refresh." },
        { step: "02", title: "Read agent bias", description: "Fair, stretched, or watch before you trade." },
        { step: "03", title: "Open Trade tab", description: "Toggle Buy or Sell with live chart and presets." },
        { step: "04", title: "Confirm swap", description: "USDC/SOL in, or SPCXx out via Jupiter." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Live trading path",
      headline: "From spread check to confirmed trade.",
      steps: [
        { step: "01", title: "Open the hub", description: "syraa.fun/spcx with realtime Nasdaq vs on-chain quotes." },
        { step: "02", title: "Read agent take", description: "Premium/discount summary and venue status." },
        { step: "03", title: "Pick Buy or Sell", description: "Trade tab with balance presets and live chart." },
        { step: "04", title: "Confirm swap", description: "Jupiter routing with safety checks before execution." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers of live-market trading.",
      cards: [
        { title: "Realtime tracking", subtitle: "Nasdaq vs on-chain", detail: "Live feed with ~10s polling and lazy API ticks.", accent: "gold" },
        { title: "Buy + sell", subtitle: "Wallet swap", detail: "Trade SPCXx both ways with USDC, SOL, and Max preset.", accent: "gold" },
        { title: "Live chart", subtitle: "Premium trade UI", detail: "Quick amount chips, estimated output, compact safety strip." },
        { title: "Reliable routing", subtitle: "Jupiter swaps", detail: "Ultra with V1 fallback and authenticated signing." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "SpaceX IPO Agent — what's live.",
      highlights: [
        "Realtime Nasdaq vs SPCXx spread tracking",
        "Buy and sell SPCXx from the Trade tab",
        "Live price chart and compact safety checks",
        "Agent bias, venue quotes, and public API",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-metric-strip",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Three numbers for live SpaceX trading.",
      stats: [
        { value: "Buy + Sell", label: "Two-way wallet trading" },
        { value: "~10s", label: "Realtime price refresh" },
        { value: "24/7", label: "On-chain tracking" },
      ],
      narrative: "Watch spreads move in realtime. Trade both ways. Stay protected from fake tokens.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "One page. Track and trade SpaceX exposure.",
      stats: [{ value: "1", label: "Hub for live prices + wallet trading" }],
      narrative:
        "Nasdaq SPCX live, SPCXx on Solana, buy or sell from your wallet, and venue comparison in plain English.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: {
        title: "Before",
        body: "Buy-only swap, slower refresh, pre-IPO framing, and cluttered safety UI on the trade flow.",
      },
      compareRight: {
        title: "Now",
        body: "Realtime tracking, buy and sell, live price chart, premium Trade tab, and reliable Jupiter routing.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      title: "Buy and sell SpaceX",
      subtitle: "Realtime spreads. Wallet trading. Live chart.",
      body: "Syra's IPO hub tracks Nasdaq and on-chain venues in realtime, then lets you buy or sell SPCXx from one Trade tab.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "System update",
      headline: "Backend and swap reliability.",
      items: [
        "GET /experiment/spcx/latest — lazy tick on poll (~10s cooldown)",
        "Frontend polling: latest every 10s, feed every 15s",
        "Jupiter Ultra with V1 fallback for USDC/SOL ↔ SPCXx swaps",
        "Auth-required tx_sign: guest wallets blocked from swap signing",
        "Swap tools enabled on agent wallet allowlists",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two markets",
      headline: "Nasdaq stock vs Solana tokens.",
      body: "SPCX on Nasdaq via live Yahoo Finance. SPCXx on Solana via xStocks, Backpack, and Ondo. Syra tracks the spread in realtime and supports buy and sell.",
      highlights: [
        "Live Nasdaq quote with realtime refresh",
        "Verified on-chain venue quotes",
        "Premium/discount at a glance",
        "Two-way wallet trading on Trade tab",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "SPCX intelligence from CLI.",
      terminalLines: [
        "$ curl api.syraa.fun/experiment/spcx/latest",
        "< nasdaqTicker: SPCX · nasdaqPriceUsd: live",
        "< venues: [{ symbol: SPCXx, venue: xstocks, spreadPct: live }]",
        "< agentBias: observe · refreshedAt: ~10s ago",
        "$ open syraa.fun/spcx → Trade tab → Buy or Sell",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Trade SpaceX exposure on Syra.",
      subtitle: "Watch live spreads. Buy or sell SPCXx. Not financial advice.",
      links: [
        { label: "SPCX hub", value: "syraa.fun/spcx", href: "https://www.syraa.fun/spcx" },
        { label: "Latest report", value: "api.syraa.fun/experiment/spcx/latest", href: "https://api.syraa.fun/experiment/spcx/latest" },
        { label: "Share intel", value: "Telegram preview", href: "https://api.syraa.fun/experiment/spcx/telegram-preview" },
      ],
    }),
  },
]);
