import { MEVX_INTEGRATION_POST } from "../mevxIntegrationUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { MEVX_INTEGRATION_PHOTO_SHARE_COPIES } from "./shareCopies/mevxIntegrationShareCopies";

const copies = MEVX_INTEGRATION_PHOTO_SHARE_COPIES;

/** Photo-format content for the MevX trading data ship log. */
export const MEVX_INTEGRATION_PHOTO = definePhotoUpdate(MEVX_INTEGRATION_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Trading data · 3 tools",
      title: "MevX × Syra",
      subtitle:
        "Trading terminal data inside Syra agents. Trades, tokens, and pools for Solana DEX workflows.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The shift",
      headline: "Agents trade on tape, not vibes.",
      body: "MevX brings recent DEX trades, token snapshots, and pool markets into Syra agent tools — Solana-first, partner-keyed, delivered in chat.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Terminal data. Agent delivery.",
      narrative: "Three tools. One partner key. Live market structure mid-conversation.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Chat → MevX → answer.",
      steps: [
        { step: "01", title: "Ask the agent", description: "Trades, token stats, or pool context." },
        { step: "02", title: "Pick mevx-*", description: "trades · token · pools." },
        { step: "03", title: "MevX API", description: "api.mevx.io with partner key." },
        { step: "04", title: "Trade-ready reply", description: "Structured data in chat." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "MevX end to end.",
      steps: [
        { step: "01", title: "Client", description: "mevxClient + MEVX_API_KEY." },
        { step: "02", title: "Tools", description: "mevx-trades · token · pools." },
        { step: "03", title: "Gates", description: "Param gates + Spend pillar." },
        { step: "04", title: "Partner page", description: "/partner/mevx live." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Three MevX agent tools.",
      cards: [
        { title: "Trades", subtitle: "Tape", detail: "Recent DEX history by pool or wallet.", accent: "gold" },
        { title: "Token", subtitle: "Market", detail: "Mint / address snapshot before size.", accent: "gold" },
        { title: "Pools", subtitle: "Liquidity", detail: "Pool markets where liquidity sits." },
        { title: "Key", subtitle: "Ops", detail: "One MEVX_API_KEY. Agent-delivered." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What ships with this update.",
      highlights: [
        "mevx-trades / mevx-token / mevx-pools registered",
        "POST /agent/tools/call ready",
        "Spend pillar + MCP catalog",
        "Partner page at /partner/mevx",
        "Set MEVX_API_KEY from landing-api.mevx.io",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Terminal data. Agent delivery.",
      stats: [
        { value: "3", label: "Agent tools" },
        { value: "Solana", label: "DEX focus" },
        { value: "1", label: "Partner key" },
      ],
      narrative: "Syra agents pull MevX trading data on demand — no terminal tab-switching.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "MevX tape inside Syra chat.",
      stats: [{ value: "3", label: "Live tools" }],
      narrative: "Recent trades. Token snapshots. Pool markets. Ask once.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Terminal tab vs agent tool.",
      compareLeft: {
        title: "Before",
        body: "Leave chat. Open a terminal. Paste addresses by hand.",
      },
      compareRight: {
        title: "Now",
        body: "mevx-* tools in Syra. Same wallet. Same conversation. Live DEX data.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Trading data",
      partnerName: "MevX",
      partnerLogo: "/images/partners/mevx.png",
      partnerLogoSolidBg: false,
      headline: "Syra × MevX",
      subtitle: "Trading terminal data for Solana DEX agent workflows. Pay via the Syra wallet path.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "MevX partner rail.",
      items: [
        "mevxClient → api.mevx.io",
        "MEVX_API_KEY from landing-api.mevx.io",
        "agentDirect: mevx-trades · token · pools",
        "Spend pillar routes /mevx/*",
        "Partner marketing card + X: MEVX_Official",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Research → action",
      headline: "Tape in. Trade out.",
      body: "Pair MevX market lookups with Syra swap and analyzer tools for research-to-action loops.",
      highlights: [
        "Research: mevx-token + mevx-pools",
        "Tape: mevx-trades",
        "Action: swap / analyzer tools",
        "Ops: one partner key",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Call MevX from tools.",
      terminalLines: [
        "$ POST /agent/tools/call",
        '{ "tool": "mevx-token", "params": { "address": "<mint>" } }',
        "→ MevX market snapshot",
        "→ agent reply with structured fields",
        "$ tool mevx-trades pool=<pool>",
        "→ recent DEX tape",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Ask Syra for MevX data.",
      subtitle: "Fund the agent wallet. Set MEVX_API_KEY. Call mevx-trades or mevx-token.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "Partner", value: "syraa.fun/partner/mevx", href: "https://www.syraa.fun/partner/mevx" },
        { label: "MevX", value: "mevx.io", href: "https://mevx.io" },
      ],
    }),
  },
]);
