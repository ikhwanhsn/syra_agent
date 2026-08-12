import { FPS } from "./theme";

export type SceneTiming = {
  id: string;
  from: number;
  to: number;
  caption: string;
};

/** Punchy 60s timeline (30fps). */
export const SCENES: SceneTiming[] = [
  {
    id: "cold",
    from: 0,
    to: 90,
    caption: "Agents are smart. Paying still blocks them.",
  },
  {
    id: "reveal",
    from: 90,
    to: 240,
    caption: "Syra. Machine money for agents.",
  },
  {
    id: "problem",
    from: 240,
    to: 450,
    caption: "Signups. API keys. Subscriptions. Agents stall.",
  },
  {
    id: "solution",
    from: 450,
    to: 720,
    caption: "Pay tiny USDC per call. Automatically. No vendor keys.",
  },
  {
    id: "x402",
    from: 720,
    to: 1020,
    caption: "Call. 402. Pay USDC on Solana. Get the data.",
  },
  {
    id: "power",
    from: 1020,
    to: 1260,
    caption: "News. Sentiment. Signals. Smart money. Pay per call.",
  },
  {
    id: "start",
    from: 1260,
    to: 1500,
    caption: "MCP, SDK, or Marketplace. First paid call in ~5 min.",
  },
  {
    id: "cta",
    from: 1500,
    to: 1800,
    caption: "Just use Syra. syraa.fun",
  },
];

export const FLASH_CUTS = [85, 235, 445, 715, 1015, 1255, 1495];

export const COLD = {
  line1: "Agents are smart.",
  line2: "They still cannot pay.",
} as const;

export const REVEAL = {
  eyebrow: "INTRODUCING",
  title: "SYRA",
  subtitle: "Machine money for agents on Solana",
  badge: "PAY PER CALL · USDC · x402",
} as const;

export const PROBLEM = {
  eyebrow: "THE BLOCKER",
  title: "APIs were built for humans.",
  items: [
    { title: "Signups", detail: "Forms agents cannot click" },
    { title: "API keys", detail: "One secret per vendor" },
    { title: "Subscriptions", detail: "Pay monthly for one call" },
  ],
} as const;

export const SOLUTION = {
  eyebrow: "THE UNLOCK",
  title: "Your agent pays itself.",
  body: "Tiny USDC per call. Wallet-native. No credit card. No per-vendor keys.",
  pillars: [
    { title: "Pay only when you call", tone: "gold" },
    { title: "Settles on Solana", tone: "cyan" },
    { title: "Works in Cursor & Claude", tone: "violet" },
  ],
} as const;

export const X402 = [
  { step: "01", title: "Call", detail: "Agent hits any Syra route" },
  { step: "02", title: "402", detail: "Server returns USDC price" },
  { step: "03", title: "Pay", detail: "MCP/SDK auto-settles" },
  { step: "04", title: "Data", detail: "Unlocked. Keep building." },
] as const;

export const POWER = [
  { title: "News", detail: "Market context, live" },
  { title: "Sentiment", detail: "Crowd mood, scored" },
  { title: "Signals", detail: "Research you can act on" },
  { title: "Smart money", detail: "Whale & netflow reads" },
  { title: "Memecoin scout", detail: "Launchpad trench intel" },
  { title: "Assets", detail: "Tokens.xyz dossiers" },
] as const;

export const START = {
  eyebrow: "START IN 5 MINUTES",
  title: "Three ways in.",
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
      detail: "Browse & test",
      line: "syraa.fun/marketplace",
    },
  ],
} as const;

export const CTA = {
  title: "Just use Syra.",
  subtitle: "First paid call in about 5 minutes",
  primary: "syraa.fun",
  secondary: "docs.syraa.fun",
  badge: "MACHINE MONEY FOR AGENTS",
} as const;

export { FPS };
