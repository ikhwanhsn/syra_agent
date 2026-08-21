/**
 * Square X-Layer-style Syra announcement cards (white canvas, monochrome).
 * One shared "studio card" system (Design 2): brand tag + top label + boxed
 * headline + a content module + mono disclaimer, over an atmospheric plate.
 */

export type XLayerArchetype =
  | "showcase"
  | "metrics"
  | "pillars"
  | "flow"
  | "quote"
  | "comparison"
  | "checklist"
  | "portal";

export interface XLayerWinnerIcon {
  id: string;
  label: string;
  glyph: string;
}

export interface XLayerStat {
  value: string;
  label: string;
}

export interface XLayerPillar {
  glyph: string;
  title: string;
  body: string;
}

export interface XLayerStep {
  step: string;
  title: string;
  body: string;
}

export interface XLayerComparePanel {
  title: string;
  body: string;
}

/** Portal / hype still compositions. `bottom` is the gold sticker-at-foot layout. */
export type PortalVariant = "bottom" | "top" | "thesis" | "panel" | "bar" | "corner";

export interface XLayerCardDef {
  id: string;
  archetype: XLayerArchetype;
  /** Download filename stem, e.g. syra-xlayer-metrics */
  slug: string;
  /** Full-bleed atmospheric background plate (public path). */
  bgImage: string;
  /** Small mono label shown top-right in the studio header. */
  topLabel: string;
  /** Lines inside black sticker boxes (stacked). */
  headlineLines: string[];
  subtitle?: string;
  /** Portal family layout. Ignored on other archetypes. */
  portalVariant?: PortalVariant;
  /** Content modules (archetype picks which one it renders). */
  winnerIcons?: XLayerWinnerIcon[];
  stats?: XLayerStat[];
  pillars?: XLayerPillar[];
  steps?: XLayerStep[];
  quote?: string;
  quoteBy?: string;
  compare?: { left: XLayerComparePanel; right: XLayerComparePanel };
  checklist?: string[];
  shareCopy: string;
}

export const XLAYER_CARDS: XLayerCardDef[] = [
  {
    id: "xlayer-showcase",
    archetype: "showcase",
    slug: "syra-xlayer-showcase",
    bgImage: "/images/threads/bg/bg-02-winners.png",
    topLabel: "Showcase",
    headlineLines: ["Build", "Winners"],
    subtitle: "Agents shipping on Syra rails",
    winnerIcons: [
      { id: "radar", label: "Radar", glyph: "(o)" },
      { id: "eye", label: "Watch", glyph: "[+]" },
      { id: "term", label: "CLI", glyph: ">_" },
      { id: "shield", label: "Secure", glyph: "#" },
      { id: "chart", label: "Signal", glyph: "/\\" },
      { id: "agent", label: "Agent", glyph: "x402" },
    ],
    shareCopy:
      "Build winners on Syra. Agent-native commerce, pay-per-call intelligence, x402 rails.\n\nsyraa.fun",
  },
  {
    id: "xlayer-metrics",
    archetype: "metrics",
    slug: "syra-xlayer-metrics",
    bgImage: "/images/threads/bg/bg-metrics.png",
    topLabel: "By the numbers",
    headlineLines: ["Syra", "This Week"],
    subtitle: "Network activity across agent rails",
    stats: [
      { value: "1.2M", label: "API calls settled" },
      { value: "38K", label: "Agent wallets" },
      { value: "3", label: "Chains live" },
      { value: "99.9%", label: "Settlement uptime" },
    ],
    shareCopy:
      "Syra this week: 1.2M calls settled, 38K agent wallets, 3 chains live, 99.9% uptime.\n\nsyraa.fun",
  },
  {
    id: "xlayer-pillars",
    archetype: "pillars",
    slug: "syra-xlayer-pillars",
    bgImage: "/images/threads/bg/bg-pillars.png",
    topLabel: "Why Syra",
    headlineLines: ["Built for", "Agents"],
    subtitle: "Three primitives, one rail",
    pillars: [
      { glyph: "$", title: "Pay", body: "x402 micropayments, no API keys or accounts." },
      { glyph: "#", title: "Verify", body: "Signed receipts for every settled call." },
      { glyph: ">", title: "Ship", body: "Typed SDK and MCP tools, live in minutes." },
    ],
    shareCopy:
      "Syra is built for agents: Pay with x402, Verify with signed receipts, Ship with a typed SDK.\n\nsyraa.fun",
  },
  {
    id: "xlayer-flow",
    archetype: "flow",
    slug: "syra-xlayer-flow",
    bgImage: "/images/threads/bg/bg-flow.png",
    topLabel: "How it works",
    headlineLines: ["Discover", "Pay, Call"],
    subtitle: "The agent payment loop",
    steps: [
      { step: "01", title: "Discover", body: "Agent finds a priced API endpoint." },
      { step: "02", title: "Pay", body: "402 challenge settled in USDC." },
      { step: "03", title: "Call", body: "Response returns with a receipt." },
    ],
    shareCopy:
      "How Syra works: agents discover a priced endpoint, settle the 402 in USDC, and get the response with a receipt.\n\nsyraa.fun",
  },
  {
    id: "xlayer-quote",
    archetype: "quote",
    slug: "syra-xlayer-quote",
    bgImage: "/images/threads/bg/bg-quote.png",
    topLabel: "Thesis",
    headlineLines: ["The Thesis"],
    quote: "Agents need wallets, not API keys.",
    quoteBy: "Syra",
    shareCopy:
      "Agents need wallets, not API keys. That is the whole thesis behind Syra.\n\nsyraa.fun",
  },
  {
    id: "xlayer-comparison",
    archetype: "comparison",
    slug: "syra-xlayer-comparison",
    bgImage: "/images/threads/bg/bg-compare.png",
    topLabel: "Before / After",
    headlineLines: ["Keys", "vs Wallets"],
    subtitle: "Why agent payments change the stack",
    compare: {
      left: {
        title: "Before",
        body: "Static API keys, manual billing, human in the loop for every purchase.",
      },
      right: {
        title: "With Syra",
        body: "Per-call payments, signed receipts, agents that transact on their own.",
      },
    },
    shareCopy:
      "Before Syra: static API keys and manual billing. With Syra: per-call payments and agents that transact on their own.\n\nsyraa.fun",
  },
  {
    id: "xlayer-checklist",
    archetype: "checklist",
    slug: "syra-xlayer-checklist",
    bgImage: "/images/threads/bg/bg-checklist.png",
    topLabel: "Ship log",
    headlineLines: ["Shipped", "This Week"],
    subtitle: "What went live",
    checklist: [
      "x402 settlement on Base and Solana",
      "MCP tools for crypto intelligence",
      "Typed @syra-ai/sdk release",
      "Signed receipts on every call",
    ],
    shareCopy:
      "Shipped this week: x402 on Base and Solana, MCP tools, the typed SDK, and signed receipts.\n\nsyraa.fun",
  },
  {
    id: "xlayer-portal",
    archetype: "portal",
    slug: "syra-xlayer-portal",
    bgImage: "/images/threads/bg/bg-portal.png",
    topLabel: "Skill",
    headlineLines: ["First call"],
    subtitle: "Consult first. Then call.",
    portalVariant: "bottom",
    shareCopy:
      "The catalog is on the other side.\n\nPaste set up https://api.syraa.fun/skill.md into your agent.\nsyra_consult first. Then the tool it names.\n\nhttps://syraa.fun/marketplace\n\nWhat are you calling first?",
  },
  {
    id: "xlayer-hype",
    archetype: "portal",
    slug: "syra-xlayer-hype",
    bgImage: "/images/threads/bg/bg-hype.png",
    topLabel: "Live",
    headlineLines: ["Agents pay"],
    subtitle: "47,303 paid calls this week.",
    quote: "Agents pay.",
    quoteBy: "Syra",
    portalVariant: "thesis",
    shareCopy:
      "Agents are already paying for calls.\n\nSyra settled 47,303 paid calls in the last 7 days.\n\nPaste https://api.syraa.fun/skill.md into your agent.\n\nhttps://syraa.fun/marketplace\n\nWhat will yours call first?",
  },
];

export function getXLayerCard(id: string): XLayerCardDef | undefined {
  return XLAYER_CARDS.find((card) => card.id === id);
}
