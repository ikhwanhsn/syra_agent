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
      badge: "Spreads · Scam radar · Buy safely",
      title: "SpaceX IPO Agent",
      subtitle:
        "Live Nasdaq vs on-chain SPCX tracker with scam radar, venue comparison, and safe buy paths.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-center",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "The IPO window is noisy and full of fakes.",
      body: "SpaceX goes public as SPCX. Traders buy tokenized SPCXx on Solana. Scammers copy the name. Syra built one hub to compare real prices, verify mints, and buy safely.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Never overpay. Never buy a fake.",
      narrative:
        "Track the real stock price. Compare verified on-chain venues. Verify the mint before you swap. The IPO window needs legibility.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How to use it",
      headline: "Understand, verify, then buy.",
      steps: [
        { step: "01", title: "Check spread", description: "Nasdaq SPCX vs live SPCXx from verified venues." },
        { step: "02", title: "Read agent bias", description: "Fair, stretched, or watch before you act." },
        { step: "03", title: "Verify mint", description: "Scam radar and mint checker before any swap." },
        { step: "04", title: "Pick your path", description: "Wallet, exchange via xStocks, or brokerage track." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Safe buy path",
      headline: "From spread check to confirmed buy.",
      steps: [
        { step: "01", title: "Open the hub", description: "syraa.fun/spcx with live Nasdaq vs on-chain quotes." },
        { step: "02", title: "Read agent take", description: "Premium/discount summary and venue status." },
        { step: "03", title: "Run verification", description: "Scam radar flags fakes. Mint verifier confirms catalog match." },
        { step: "04", title: "Buy your way", description: "Swap USDC/SOL, use xStocks, or compare brokerage tracks." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers of IPO protection.",
      cards: [
        { title: "Price compare", subtitle: "Nasdaq vs on-chain", detail: "Live feed with $135 IPO reference fallback.", accent: "gold" },
        { title: "Scam radar", subtitle: "Fake filter", detail: "Impersonator tokens flagged when price diverges.", accent: "gold" },
        { title: "Venue playbook", subtitle: "3 buy paths", detail: "Wallet, xStocks exchange, Backpack/Ondo brokerage." },
        { title: "Agent API", subtitle: "Experiment rail", detail: "/experiment/spcx for bots and integrators." },
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
        "Live Nasdaq vs SPCXx spread tracking",
        "Scam radar + mint verifier before swap",
        "3 buy paths: wallet, exchange, brokerage",
        "Agent bias, venue quotes, and public API",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-metric-strip",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Three numbers for the IPO window.",
      stats: [
        { value: "3", label: "Verified buy paths" },
        { value: "24/7", label: "On-chain tracking" },
        { value: "$135", label: "IPO reference fallback" },
      ],
      narrative: "Compare spreads before you buy. Verify mints. Choose the route that fits how you invest.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "One page. Every SpaceX exposure route.",
      stats: [{ value: "1", label: "Hub for stock + on-chain + brokerage" }],
      narrative:
        "Nasdaq SPCX, SPCXx on Solana, xStocks on exchanges, and Backpack/Ondo tracks compared in plain English.",
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
        body: "Scattered prices, fake tokens, no way to compare Nasdaq vs on-chain spreads.",
      },
      compareRight: {
        title: "Now",
        body: "Live tracker, scam radar, mint verifier, and three safe buy paths on one page.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      title: "SpaceX IPO Agent",
      subtitle: "Track spreads. Verify mints. Buy safely.",
      body: "Syra's IPO hub compares Nasdaq and on-chain venues so you never overpay or buy a fake token.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Public experiment API.",
      items: [
        "GET /experiment/spcx/config — IPO reference + catalog meta",
        "GET /experiment/spcx/latest — latest intelligence report",
        "GET /experiment/spcx/feed — historical ticks",
        "POST /experiment/spcx/tick — force intelligence refresh",
        "GET /experiment/spcx/telegram-preview — formatted share message",
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
      body: "SPCX on Nasdaq via live Yahoo Finance. SPCXx on Solana via xStocks, Backpack, and Ondo. Syra tracks the spread.",
      highlights: [
        "Live Nasdaq quote with reference fallback",
        "Verified on-chain venue quotes",
        "Premium/discount at a glance",
        "Agent bias on stretched spreads",
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
        "< nasdaqTicker: SPCX · nasdaqPriceUsd: 135.00",
        "< venues: [{ symbol: SPCXx, venue: xstocks, spreadPct: 2.1 }]",
        "< agentBias: observe",
        "$ curl api.syraa.fun/experiment/spcx/telegram-preview",
        "< formatted share message ready to post",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Track the SpaceX IPO on Syra.",
      subtitle: "Check spreads. Verify mints. Buy safely. Not financial advice.",
      links: [
        { label: "SPCX hub", value: "syraa.fun/spcx", href: "https://www.syraa.fun/spcx" },
        { label: "Latest report", value: "api.syraa.fun/experiment/spcx/latest", href: "https://api.syraa.fun/experiment/spcx/latest" },
        { label: "Share intel", value: "Telegram preview", href: "https://api.syraa.fun/experiment/spcx/telegram-preview" },
      ],
    }),
  },
]);
