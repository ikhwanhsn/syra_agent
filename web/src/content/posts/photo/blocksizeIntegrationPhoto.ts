import { BLOCKSIZE_INTEGRATION_POST } from "../blocksizeIntegrationUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { BLOCKSIZE_INTEGRATION_PHOTO_SHARE_COPIES } from "./shareCopies/blocksizeIntegrationShareCopies";

const copies = BLOCKSIZE_INTEGRATION_PHOTO_SHARE_COPIES;

/** Photo-format content for the Blocksize market data ship log. */
export const BLOCKSIZE_INTEGRATION_PHOTO = definePhotoUpdate(BLOCKSIZE_INTEGRATION_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-type-hero",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "VWAP · Bid/Ask · MCP",
      title: "Blocksize × Syra",
      subtitle:
        "Institutional VWAP and bid/ask for AI agents — mcp.blocksize.info with x402 / credits.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-gold-frame",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Autonomous size needs a reference price.",
      body: "Retail mids lie under thin books. Blocksize aggregates institutional crypto VWAP and bid/ask so Syra agents can quote before they move.",
    }),
  },
  {
    role: "quote",
    layout: "photo-announcement",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Oracle-grade tape. Agent checkout.",
      narrative: "Search free. Pay for VWAP and bid/ask. Pre-trade guards before you size the ticket.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Operator flow",
      headline: "Search. Quote. Guard. Act.",
      steps: [
        { step: "01", title: "Search", description: "blocksize-search q=SOLUSD." },
        { step: "02", title: "Quote", description: "VWAP or bid/ask — agent pays 402." },
        { step: "03", title: "Guard", description: "Optional pre-trade check." },
        { step: "04", title: "Act", description: "Feed into swap / invest logic." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Blocksize MCP wired end to end.",
      steps: [
        { step: "01", title: "Client", description: "agentBlocksizeClient + X-AGENT-ID." },
        { step: "02", title: "x402", description: "Settle from agent Solana USDC." },
        { step: "03", title: "Tools", description: "search · vwap · bidask · pre-trade." },
        { step: "04", title: "Surface", description: "Spend pillar + partner page." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-stack",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four Blocksize tools.",
      cards: [
        { title: "Search", subtitle: "Free", detail: "Find pairs before you spend.", accent: "gold" },
        { title: "VWAP", subtitle: "Paid", detail: "Institutional VWAP snapshots.", accent: "gold" },
        { title: "Bid/Ask", subtitle: "Paid", detail: "Spread-aware quotes." },
        { title: "Pre-trade", subtitle: "~$0.10", detail: "Freshness and drift guards." },
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
        "blocksize-* agent tools registered",
        "Free search before paid quotes",
        "Agent Solana USDC / credits checkout",
        "Partner page at /partner/blocksize",
        "Host: mcp.blocksize.info",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-orbit",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Institutional data. Agent rails.",
      stats: [
        { value: "4", label: "Agent tools" },
        { value: "MCP", label: "Blocksize host" },
        { value: "402", label: "Agent checkout" },
      ],
      narrative: "No Blocksize account form. Search free, then pay per quote or pre-trade check.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-counter-row",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Ask Syra for SOLUSD VWAP.",
      stats: [{ value: "VWAP", label: "Institutional reference" }],
      narrative: "Blocksize answers. Agent wallet pays. Reference prices in chat.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Scraped mid vs Blocksize tape.",
      compareLeft: {
        title: "Before",
        body: "Scrape a mid and hope the book holds under size.",
      },
      compareRight: {
        title: "Now",
        body: "VWAP + bid/ask + pre-trade checks inside Syra agents via x402.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Market data",
      partnerName: "Blocksize",
      partnerLogo: "/images/partners/blocksize.png",
      partnerLogoSolidBg: true,
      headline: "Syra × Blocksize",
      subtitle: "Institutional VWAP, bid/ask, and pre-trade checks for autonomous treasuries.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-items-grid",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "mcp.blocksize.info plumbing.",
      items: [
        "GET /v1/search — free discovery",
        "GET /v1/vwap/{pair} — paid VWAP",
        "GET /v1/bidask/{pair} — paid book",
        "POST /v1/checks/pre-trade",
        "X-AGENT-ID + agent x402 settle",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-compact",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Quote → action",
      headline: "Reference price, then execute.",
      body: "Pull Blocksize VWAP, guard with pre-trade, then route into Syra swap or invest tools.",
      highlights: [
        "Quote: vwap / bidask",
        "Guard: pre-trade",
        "Act: swap / invest",
        "Ops: agent wallet credits",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Blocksize from agent tools.",
      terminalLines: [
        "$ tool blocksize-search q=SOLUSD",
        "→ pairs + services [ok]",
        "$ tool blocksize-vwap pair=SOLUSD",
        "→ 402 Payment Required",
        "$ agent wallet settles USDC",
        "→ VWAP snapshot unlocked",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-banner",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Ask Syra for a Blocksize VWAP.",
      subtitle: "Search SOLUSD, pull VWAP, then bid/ask — all from agent chat.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        {
          label: "Partner",
          value: "syraa.fun/partner/blocksize",
          href: "https://www.syraa.fun/partner/blocksize",
        },
        { label: "Blocksize", value: "mcp.blocksize.info", href: "https://mcp.blocksize.info" },
      ],
    }),
  },
]);
