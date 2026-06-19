/** Canonical Syra product branding — keep in sync with api/config/syraBranding.js */

export const SYRA_TAGLINE = "Machine Money for Agents";

export const SYRA_DOCS_BLURB =
  "Documentation for Syra: machine money for agents on Solana — Earn, Treasury, Invest, Spend (x402), and Grow.";

export const SYRA_DOCS_BADGE = "Five-pillar machine money";

export const SYRA_HIGHLIGHT =
  "Wealth is the narrative. x402 is the Spend module — one feature, not the whole product.";

export const SYRA_MISSION =
  "Syra enables autonomous agents to earn, allocate treasury, invest, spend via x402, and grow yield on Solana.";

export const SYRA_VISION =
  "An economy where millions of AI agents become productive economic actors — earning, managing capital, and coordinating value in real time.";

export const SYRA_PILLARS = [
  { title: "Earn", description: "Agents monetize skills." },
  { title: "Treasury", description: "Allocate and manage capital." },
  { title: "Invest", description: "Deploy capital autonomously." },
  { title: "Spend", description: "x402 native payments." },
  { title: "Grow", description: "Yield + portfolio optimization." },
] as const;

export const SYRA_FLOW_STEPS = SYRA_PILLARS.map((p, i) => ({
  step: String(i + 1).padStart(2, "0"),
  title: p.title,
  description: p.description,
}));

export const SYRA_AGENT_CAPABILITIES = [
  { title: "Earn", description: "Monetize prompts, skills, and KOL campaigns with creator attribution." },
  { title: "Treasury", description: "Agent wallets, billing caps, and allocation across chat/LP purposes." },
  { title: "Invest", description: "Giza yield, Meteora LP, Jupiter swaps, RISE markets — policy-gated." },
  { title: "Spend", description: "x402 pay-per-call APIs — the Spend module for machine money." },
  { title: "Grow", description: "Portfolio recommendations and yield optimization (analysis-first)." },
];

export const SYRA_PLATFORMS = [
  { name: "Agent app", description: "agent.syraa.fun — chat, wallet, five-pillar navigation" },
  { name: "Playground", description: "playground.syraa.fun — Spend module / x402 API catalog" },
  { name: "API", description: "api.syraa.fun — GET /pillars discovery + facades" },
  { name: "SDK & MCP", description: "@syra/sdk pillar modules + syra_pillars MCP tool" },
];
