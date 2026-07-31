/**
 * Copy, timings, and facts for the "What Syra Is" Remotion explainers.
 * Serialization-safe (no JSX). No em dashes.
 */

export const SYRA_EXPLAINER_FPS = 30;

/** Landscape 16:9 (~150s). */
export const WHAT_IS_SYRA_WIDTH = 1920;
export const WHAT_IS_SYRA_HEIGHT = 1080;
export const WHAT_IS_SYRA_DURATION_SEC = 150;
export const WHAT_IS_SYRA_DURATION =
  WHAT_IS_SYRA_DURATION_SEC * SYRA_EXPLAINER_FPS;

/** Vertical 9:16 (~60s). */
export const WHAT_IS_SYRA_V_WIDTH = 1080;
export const WHAT_IS_SYRA_V_HEIGHT = 1920;
export const WHAT_IS_SYRA_V_DURATION_SEC = 60;
export const WHAT_IS_SYRA_V_DURATION =
  WHAT_IS_SYRA_V_DURATION_SEC * SYRA_EXPLAINER_FPS;

export type SceneTiming = {
  id: string;
  from: number;
  to: number;
  caption: string;
};

/** Landscape scene frames (30fps). */
export const LANDSCAPE_SCENES: SceneTiming[] = [
  {
    id: "hook",
    from: 0,
    to: 240,
    caption: "Syra: machine money for agents on Solana.",
  },
  {
    id: "problem",
    from: 240,
    to: 780,
    caption: "Agents are smart. Paying for APIs still blocks them.",
  },
  {
    id: "idea",
    from: 780,
    to: 1260,
    caption: "Pay tiny USDC per call, automatically. No vendor keys.",
  },
  {
    id: "x402",
    from: 1260,
    to: 1980,
    caption: "HTTP 402: call, pay USDC on Solana, get the data.",
  },
  {
    id: "capabilities",
    from: 1980,
    to: 2580,
    caption: "Crypto intelligence: news, signals, smart money, more.",
  },
  {
    id: "pillars",
    from: 2580,
    to: 3240,
    caption: "Five pillars. Spend is live. The rest ship honestly.",
  },
  {
    id: "howto",
    from: 3240,
    to: 3840,
    caption: "MCP, SDK, or Marketplace. First paid call in about 5 minutes.",
  },
  {
    id: "token",
    from: 3840,
    to: 4380,
    caption: "$SYRA utility: fee discounts, buybacks to rewards, staking.",
  },
  {
    id: "cta",
    from: 4380,
    to: 4500,
    caption: "Start at syraa.fun. Build with docs.syraa.fun.",
  },
];

/** Vertical condensed scene frames (30fps, 60s). */
export const VERTICAL_SCENES: SceneTiming[] = [
  {
    id: "hook",
    from: 0,
    to: 150,
    caption: "Syra: machine money for agents.",
  },
  {
    id: "problem",
    from: 150,
    to: 360,
    caption: "Agents stall when APIs need keys and cards.",
  },
  {
    id: "idea",
    from: 360,
    to: 570,
    caption: "Pay-per-call USDC. No per-vendor API keys.",
  },
  {
    id: "x402",
    from: 570,
    to: 900,
    caption: "402 Payment Required. Auto-pay. Get data.",
  },
  {
    id: "capabilities",
    from: 900,
    to: 1140,
    caption: "News, sentiment, signals, smart money.",
  },
  {
    id: "pillars",
    from: 1140,
    to: 1380,
    caption: "Spend live. Invest and Earn in beta.",
  },
  {
    id: "howto",
    from: 1380,
    to: 1560,
    caption: "MCP, SDK, or Marketplace in minutes.",
  },
  {
    id: "token",
    from: 1560,
    to: 1740,
    caption: "$SYRA: discounts, rewards, staking. Not advice.",
  },
  {
    id: "cta",
    from: 1740,
    to: 1800,
    caption: "syraa.fun · first paid call in ~5 min",
  },
];

export const HOOK = {
  eyebrow: "Machine Money",
  title: "What is Syra?",
  subtitle: "Pay-per-call crypto intelligence for AI agents on Solana",
} as const;

export const PROBLEM = {
  eyebrow: "The Problem",
  title: "Agents are smart.\nThey still cannot pay.",
  body: "Most APIs want signups, credit cards, and a different key for every vendor. Agents stall before they ever get the data.",
  painPoints: [
    { title: "Signups", detail: "Human forms. Agents cannot click through." },
    { title: "API keys", detail: "One key per vendor. Secrets everywhere." },
    { title: "Subscriptions", detail: "Pay monthly even if you call once." },
  ],
} as const;

export const IDEA = {
  eyebrow: "The Idea",
  title: "Machine money for agents",
  body: "Syra lets an agent pay a tiny amount of USDC for each API call, automatically. No per-vendor keys. No credit card. Just wallet-native micropayments over HTTP.",
  bullets: [
    "Pay only when you call",
    "USDC on Solana (Base and Algorand rails too)",
    "Works in Cursor, Claude, and app code",
  ],
} as const;

export const X402_STEPS = [
  {
    step: "1",
    title: "Call the API",
    detail: "Agent requests news, signals, or any Syra route.",
  },
  {
    step: "2",
    title: "402 Payment Required",
    detail: "Server replies with the price in USDC.",
  },
  {
    step: "3",
    title: "Auto-pay USDC",
    detail: "MCP or SDK pays on Solana from the agent wallet.",
  },
  {
    step: "4",
    title: "Get the data",
    detail: "Settled payment unlocks the response. Done.",
  },
] as const;

export const CAPABILITIES = [
  { title: "News", detail: "Crypto headlines and market context" },
  { title: "Sentiment", detail: "Crowd mood across sources" },
  { title: "Signals", detail: "Actionable research outputs" },
  { title: "Smart money", detail: "On-chain netflow and whale moves" },
  { title: "Memecoin scout", detail: "Launchpad and trench research" },
  { title: "Analytics", detail: "Summaries agents can act on" },
] as const;

export type PillarStatus = "Live" | "Beta" | "Infra" | "Roadmap";

export const PILLARS: {
  name: string;
  status: PillarStatus;
  purpose: string;
}[] = [
  { name: "Spend", status: "Live", purpose: "x402 pay-per-call APIs" },
  { name: "Invest", status: "Beta", purpose: "Deploy capital with partners" },
  { name: "Earn", status: "Beta", purpose: "Agents monetize skills" },
  { name: "Treasury", status: "Infra", purpose: "Wallets, billing, policy" },
  { name: "Grow", status: "Roadmap", purpose: "Yield and portfolio ops" },
];

export const HOW_TO = {
  eyebrow: "Use it in 5 minutes",
  title: "Three ways to start",
  paths: [
    {
      name: "MCP",
      detail: "Cursor / Claude",
      line: "npx -y @syra-ai/mcp-server@latest",
    },
    {
      name: "SDK",
      detail: "App code",
      line: "npm i @syra-ai/sdk",
    },
    {
      name: "Marketplace",
      detail: "Browse and test",
      line: "syraa.fun/marketplace",
    },
  ],
  note: "Fund about $1 Solana USDC first. Then make your first paid call.",
} as const;

export const TOKEN = {
  eyebrow: "The $SYRA Token",
  title: "Utility that aligns with usage",
  body: "$SYRA is the alignment token for Syra's agent economy. Hold or stake for live product perks. Governance voting is roadmap, not live yet.",
  utilities: [
    {
      title: "Fee discounts",
      detail: "Tiered x402 discounts at 10k / 100k / 1M / 10M",
    },
    {
      title: "Buybacks → rewards",
      detail: "~80% of settled revenue queues on-market buys for usage rewards",
    },
    {
      title: "Staking premium",
      detail: "Stake on Streamflow for higher scan quotas and agent perks",
    },
  ],
  disclaimer:
    "Not financial advice. Outputs are probabilistic analysis. Governance is not shipped yet.",
  stats: [
    { label: "Total supply", value: "1B" },
    { label: "Circulating", value: "995M" },
    { label: "Burned", value: "5M+" },
  ],
} as const;

export const CTA = {
  title: "Build with Syra",
  subtitle: "First paid call in about 5 minutes",
  primary: "syraa.fun",
  secondary: "docs.syraa.fun",
  badge: "MACHINE MONEY FOR AGENTS",
} as const;
