import { FLINT_INTEGRATION_POST } from "../flintIntegrationUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { FLINT_INTEGRATION_PHOTO_SHARE_COPIES } from "./shareCopies/flintIntegrationShareCopies";

const copies = FLINT_INTEGRATION_PHOTO_SHARE_COPIES;

/** Photo-format content for the Flint market depth ship log. */
export const FLINT_INTEGRATION_PHOTO = definePhotoUpdate(FLINT_INTEGRATION_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Market data · 5 tools",
      title: "Flint × Syra",
      subtitle:
        "Order-book depth and cross-venue tape for Solana agents. Pay per call. See the book before you act.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The shift",
      headline: "Price alone is not enough.",
      body: "Flint is a multi-maker Solana spot venue with a real virtual order book. Syra now packages that depth so agents can read bids, asks, venue stats, and aggregator tape in one place.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "See the book. Then decide.",
      narrative: "Five Spend tools. Pay per call. Market data only, not live market-making.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Ask → pay → read depth.",
      steps: [
        { step: "01", title: "Pick a pair", description: "flint-pairs or base + quote." },
        { step: "02", title: "Call a tool", description: "book · stats · candles · tape." },
        { step: "03", title: "Pay per call", description: "x402 or agent wallet." },
        { step: "04", title: "Use the depth", description: "Bids, asks, candles, quotes." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Flint end to end.",
      steps: [
        { step: "01", title: "Client", description: "Public Flint gRPC-Web market data." },
        { step: "02", title: "Routes", description: "/flint/* with x402 pricing." },
        { step: "03", title: "MCP", description: "syra_spend_flint_* curated tools." },
        { step: "04", title: "Scope", description: "Data now. Maker/taker parked." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "What users actually get.",
      cards: [
        {
          title: "Book",
          subtitle: "Depth",
          detail: "Resting bids and asks, not just a mid.",
          accent: "gold",
        },
        {
          title: "Stats",
          subtitle: "Venue",
          detail: "Makers, volume, and fill activity.",
          accent: "gold",
        },
        {
          title: "Candles",
          subtitle: "History",
          detail: "OHLC ranges or recent public fills.",
        },
        {
          title: "Tape",
          subtitle: "Compare",
          detail: "Aggregator fills and reference quotes.",
        },
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
        "flint-pairs / book / stats / candles / external-tape",
        "x402 routes under /flint/*",
        "Curated MCP: syra_spend_flint_*",
        "Easy pair lookup (e.g. PUMP/USDC, WSOL/USDC)",
        "No live market-making claims",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Depth without DEX homework.",
      stats: [
        { value: "5", label: "Agent tools" },
        { value: "L2", label: "Book depth" },
        { value: "$0.001", label: "From per call" },
      ],
      narrative:
        "Flint supplies the venue book. Syra packages it for agents with pay-per-call pricing.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Order-book depth inside Syra.",
      stats: [{ value: "5", label: "Live tools" }],
      narrative: "Pairs. Books. Stats. Candles. External tape. Ask once.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Mid price vs real depth.",
      compareLeft: {
        title: "Before",
        body: "Many feeds only return one mid price. Hard to size risk.",
      },
      compareRight: {
        title: "Now",
        body: "flint-book returns bids and asks. External tape adds aggregator quotes in the same chat.",
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
      partnerName: "Flint",
      partnerLogo: "/images/partners/flint.png",
      partnerLogoSolidBg: true,
      headline: "Syra × Flint",
      subtitle:
        "Multi-maker Solana spot depth for agents. Pay per call. See the book before you trade.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "Flint public market data.",
      items: [
        "gRPC-Web client → mainnet.api.flint.trade",
        "Cached unary snapshots for agent request/response",
        "x402 Tier 1–2 on /flint/*",
        "MCP syra_spend_flint_* in curated profile",
        "Maker and taker execution explicitly deferred",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Research → action",
      headline: "Depth in. Decision out.",
      body: "Read Flint depth first, then use Syra swap or other Spend tools in the same agent loop.",
      highlights: [
        "Research: flint-book + flint-stats",
        "History: flint-candles",
        "Compare: flint-external-tape",
        "Action: Jupiter / other Spend tools",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Call Flint from Syra.",
      terminalLines: [
        "$ GET /flint/book?base=PUMP&quote=USDC",
        "→ L2 bids and asks",
        "$ MCP syra_spend_flint_stats",
        "→ makers, volume, venue health",
        "$ MCP syra_spend_flint_external_tape",
        "→ Jupiter / OKX / DFlow quotes",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Ask Syra for Flint depth.",
      subtitle:
        "Try flint-book on PUMP/USDC or WSOL/USDC. Market data only. Not live market-making.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        {
          label: "API",
          value: "api.syraa.fun/flint/pairs",
          href: "https://api.syraa.fun/flint/pairs",
        },
        { label: "Flint", value: "docs.flintlabs.dev", href: "https://docs.flintlabs.dev/" },
      ],
    }),
  },
]);
