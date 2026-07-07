/** Canonical Syra product branding — keep in sync with api/config/syraBranding.js */

import {
  SYRA_AGENT_URL,
  SYRA_API_URL,
  SYRA_DOCS_URL,
  SYRA_MARKETPLACE_URL,
  SYRA_PLAYGROUND_URL,
  SYRA_TELEGRAM_BOT_URL,
  SYRA_WEB_LABEL,
  SYRA_WEB_ORIGIN,
} from "./syraUrls";

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
  {
    name: "Web app",
    description: `${SYRA_WEB_LABEL} — agent chat, wallet, dashboard, and five-pillar navigation`,
    href: SYRA_AGENT_URL,
    linkLabel: SYRA_WEB_LABEL,
  },
  {
    name: "API Marketplace",
    description: `${SYRA_WEB_LABEL}/marketplace — browse x402 APIs, per-route detail pages, SDK/MCP integrate tab, and custom tester`,
    href: SYRA_MARKETPLACE_URL,
    linkLabel: "Open marketplace",
  },
  {
    name: "API gateway",
    description: `${SYRA_API_URL.replace("https://", "")} — GET /pillars discovery, x402 routes, OpenAPI`,
    href: SYRA_API_URL,
    linkLabel: "api.syraa.fun",
  },
  {
    name: "Telegram",
    description: "Agent access on the go via @syra_trading_bot",
    href: SYRA_TELEGRAM_BOT_URL,
    linkLabel: "@syra_trading_bot",
  },
  {
    name: "Documentation",
    description: "Guides for agents, APIs, and developer workflows",
    href: SYRA_DOCS_URL,
    linkLabel: "docs.syraa.fun",
  },
  {
    name: "SDK & MCP",
    description: "@syra-ai/sdk pillar modules + syra_pillars MCP tool",
    href: SYRA_WEB_ORIGIN,
    linkLabel: SYRA_WEB_LABEL,
  },
];
