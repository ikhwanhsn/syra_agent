import { FPS } from "./theme";

export type SceneTiming = {
  id: string;
  from: number;
  to: number;
  caption: string;
};

/** Absolute frame windows (30fps, 105s). */
export const SCENES: SceneTiming[] = [
  {
    id: "hook",
    from: 0,
    to: 300,
    caption: "Canonical mint in. Research decision out.",
  },
  {
    id: "problem",
    from: 300,
    to: 630,
    caption: "Agents drown in fragmented token data.",
  },
  {
    id: "foundation",
    from: 630,
    to: 960,
    caption: "Tokens.xyz: Solana Foundation asset truth. Now OSS.",
  },
  {
    id: "board",
    from: 960,
    to: 1320,
    caption: "Browse the curated universe on syraa.fun/assets.",
  },
  {
    id: "dossier",
    from: 1320,
    to: 1710,
    caption: "One dossier: price, OHLCV, risk grade.",
  },
  {
    id: "intel",
    from: 1710,
    to: 2040,
    caption: "Syra intelligence on top of Tokens.",
  },
  {
    id: "agent",
    from: 2040,
    to: 2400,
    caption: "Agents: asset-research, 13 MCP tools, x402.",
  },
  {
    id: "depth",
    from: 2400,
    to: 2760,
    caption: "Pump.fun depth: Tokens grade + on-chain authority.",
  },
  {
    id: "cta",
    from: 2760,
    to: 3150,
    caption: "Foundation truth. Syra decisions.",
  },
];

export const FLASH_CUTS = [295, 625, 955, 1315, 1705, 2035, 2395, 2755];

export const HOOK = {
  eyebrow: "SYRA × TOKENS.XYZ",
  title: "Asset intelligence",
  subtitle: "Canonical mint in. Research decision out.",
} as const;

export const PROBLEM = {
  eyebrow: "The Problem",
  title: "Fragmented token data\nstalls every agent.",
  body: "Tickers, mints, copies, and risk scores live in different places. Agents stitch five APIs and still miss the canonical asset.",
  fragments: [
    { label: "Ticker soup", detail: "BTC vs wbBTC vs wrapped copies" },
    { label: "Mint chaos", detail: "Base58 addresses with no shared ID" },
    { label: "Risk blind", detail: "No shared grade across tools" },
    { label: "OHLCV gaps", detail: "Charts that disagree by venue" },
  ],
} as const;

export const FOUNDATION = {
  eyebrow: "Foundation Layer",
  title: "Tokens.xyz is the truth layer",
  body: "Solana Foundation's canonical asset API. Open source. Resolve any ref or mint to a stable assetId, then read risk, markets, and OHLCV.",
  stats: [
    { label: "Status", value: "OSS" },
    { label: "Syra tools", value: "13" },
    { label: "Agent path", value: "1" },
  ],
  bullets: [
    "Resolve ref or mint → assetId",
    "Risk grades + liquidity tiers",
    "Markets, OHLCV, curated boards",
  ],
} as const;

export const BOARD = {
  eyebrow: "Discover",
  title: "Assets board",
  subtitle: "2,400+ assets from Tokens (Solana Foundation)",
  rows: [
    { symbol: "SOL", name: "Solana", price: "$142.18", chg: "+2.4%", tier: "tier1" },
    { symbol: "BTC", name: "Bitcoin", price: "$97,420", chg: "+0.8%", tier: "tier1" },
    { symbol: "ETH", name: "Ethereum", price: "$3,512", chg: "-0.3%", tier: "tier1" },
    { symbol: "JUP", name: "Jupiter", price: "$0.84", chg: "+5.1%", tier: "tier2" },
    { symbol: "AAPL", name: "Apple*", price: "$228.10", chg: "+0.2%", tier: "tier1" },
    { symbol: "MSOL", name: "Marinade SOL", price: "$168.40", chg: "+2.1%", tier: "tier1" },
  ],
} as const;

export const DOSSIER = {
  eyebrow: "Dossier",
  title: "SOL",
  fullName: "Solana",
  assetId: "solana",
  price: "$142.18",
  change24h: "+2.41%",
  mcap: "$74.2B",
  volume: "$2.1B",
  grade: "A",
  score: 92,
  tone: "safe" as const,
  markets: [
    { venue: "Raydium", liq: "$48M", vol: "$12M" },
    { venue: "Orca", liq: "$31M", vol: "$8.4M" },
    { venue: "Meteora", liq: "$19M", vol: "$5.1M" },
  ],
} as const;

export const INTEL = {
  eyebrow: "Syra Layer",
  title: "Intelligence on the dossier",
  tiles: [
    { title: "Sentiment", value: "72", detail: "Positive tilt across sources", tone: "safe" as const },
    { title: "Signal", value: "Buy", detail: "Strength 0.68 · research output", tone: "safe" as const },
    { title: "News", value: "18", detail: "Scoped headlines in the last 24h", tone: "warn" as const },
    { title: "Events", value: "3", detail: "Related calendar items", tone: "warn" as const },
  ],
} as const;

export const AGENT = {
  eyebrow: "Agent Layer",
  title: "One research call. Four steps.",
  flow: [
    { step: "01", title: "Resolve", detail: "ref / mint → assetId" },
    { step: "02", title: "Risk", detail: "Tokens grade + tone" },
    { step: "03", title: "Intel", detail: "News, sentiment, signal" },
    { step: "04", title: "Action", detail: "nextActions for the agent" },
  ],
  tools: [
    "tokens-assets-resolve",
    "tokens-asset-risk-summary",
    "tokens-asset-ohlcv",
    "asset-research",
  ],
  note: "13 tokens-* MCP tools · x402 pay-per-call · free dashboard reads",
} as const;

export const DEPTH = {
  eyebrow: "Depth Shot",
  title: "Tokens grade feeds Syra Alpha",
  body: "On Pump.fun Analyzer, Tokens.xyz risk is the foundation. Syra layers on-chain mint authority, holders, and KOL radar into a 0–100 Alpha score.",
  grade: "B",
  alpha: 61,
  checks: [
    { label: "Tokens.xyz grade", value: "B · warning" },
    { label: "Mint authority", value: "Revoked" },
    { label: "Freeze authority", value: "Revoked" },
    { label: "Syra Alpha", value: "61 · Watch" },
  ],
} as const;

export const CTA = {
  title: "Foundation truth.\nSyra decisions.",
  primary: "syraa.fun/assets",
  secondary: "docs.tokens.xyz",
  badge: "MACHINE MONEY FOR AGENTS",
} as const;

export type RevealTiming = {
  title: number;
  elements: number[];
  counts?: number[];
  keys?: number[];
};

export const REVEALS: Record<string, RevealTiming> = {
  hook: { title: 12, elements: [0, 40] },
  problem: { title: 10, elements: [24, 40, 56, 72] },
  foundation: { title: 10, elements: [20, 36, 52], counts: [28, 40, 52] },
  board: { title: 8, elements: [18, 30, 42, 54, 66, 78] },
  dossier: { title: 8, elements: [16, 32, 48, 64], counts: [24, 40] },
  intel: { title: 8, elements: [16, 30, 44, 58] },
  agent: { title: 8, elements: [16, 34, 52, 70], keys: [24, 42, 60, 78] },
  depth: { title: 8, elements: [16, 32, 48, 64], counts: [40] },
  cta: { title: 8, elements: [0, 24] },
};

export { FPS };
