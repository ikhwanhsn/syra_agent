/** Canonical Syra product branding — keep in sync with api/config/syraBranding.js */

import {
  SYRA_AGENT_URL,
  SYRA_API_URL,
  SYRA_DOCS_URL,
  SYRA_MARKETPLACE_URL,
  SYRA_WEB_LABEL,
} from "./syraUrls";

export const SYRA_TAGLINE = "Machine Money for Agents";

export const SYRA_LIVE_SUBLINE = "Live today: pay-per-call crypto APIs over x402";

export const SYRA_DOCS_BLURB =
  "Documentation for Syra: machine money for agents — Earn, Treasury, Invest, Spend, Grow. Live today: x402, MCP, and typed SDK on Solana.";

export const SYRA_DOCS_BADGE = "Machine Money · Spend live (x402)";

export const SYRA_HIGHLIGHT =
  "Syra is machine money for agents — Earn, Treasury, Invest, Spend, and Grow on Solana. Live today: settle USDC via x402, integrate with MCP or the SDK.";

export const SYRA_MISSION =
  "Syra lets autonomous agents earn, allocate, invest, spend, and grow capital — with live pay-per-call crypto intelligence over x402, MCP, and a typed SDK on Solana.";

export const SYRA_VISION =
  "An economy where millions of AI agents hold capital, pay for tools, and coordinate value without human billing ops — machine money as infrastructure.";

/** Pillar maturity — keep in sync with api/config/syraBranding.js */
export const SYRA_PILLAR_STATUS = {
  spend: "live",
  invest: "beta",
  earn: "beta",
  treasury: "infra",
  grow: "roadmap",
} as const;

/** Live GTM capabilities — what builders do today. */
export const SYRA_LIVE_CAPABILITIES = [
  {
    title: "Pay per call (Spend)",
    description: "Settle USDC via x402 on HTTP 402 — no per-vendor API keys or monthly plans.",
  },
  {
    title: "MCP tools",
    description: "Install @syra-ai/mcp-server in Cursor or Claude and call news, signals, and research in chat.",
  },
  {
    title: "Typed SDK",
    description: "createSyraPaidClient auto-pays and retries so app code stays thin.",
  },
  {
    title: "API marketplace",
    description: "Browse routes at syraa.fun/marketplace — OpenAPI + /.well-known/x402 discovery.",
  },
] as const;

/**
 * Platform pillars with honest status (GET /pillars).
 */
export const SYRA_PILLARS = [
  { title: "Earn", description: "Agents monetize skills.", status: "beta" as const },
  { title: "Treasury", description: "Allocate and manage capital.", status: "infra" as const },
  { title: "Invest", description: "Deploy capital autonomously.", status: "beta" as const },
  { title: "Spend", description: "x402 native pay-per-call APIs.", status: "live" as const },
  { title: "Grow", description: "Yield + portfolio optimization.", status: "roadmap" as const },
] as const;

/** @deprecated Prefer SYRA_LIVE_CAPABILITIES for docs Welcome / home. */
export const SYRA_FLOW_STEPS = SYRA_PILLARS.map((p, i) => ({
  step: String(i + 1).padStart(2, "0"),
  title: p.title,
  description: p.description,
}));

/** @deprecated Prefer SYRA_LIVE_CAPABILITIES — kept for any remaining imports */
export const SYRA_AGENT_CAPABILITIES = [...SYRA_LIVE_CAPABILITIES];

export const SYRA_PLATFORMS = [
  {
    name: "Web app",
    description: `${SYRA_WEB_LABEL} — agent chat, marketplace, wallet, and dashboard`,
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
    description: `${SYRA_API_URL.replace("https://", "")} — x402 routes, OpenAPI, GET /pillars discovery`,
    href: SYRA_API_URL,
    linkLabel: "api.syraa.fun",
  },
  {
    name: "MCP",
    description: "@syra-ai/mcp-server — pay-per-call crypto tools for Cursor, Claude, and agent hosts",
    href: `${SYRA_DOCS_URL}/docs/build/mcp`,
    linkLabel: "Install MCP",
  },
  {
    name: "Documentation",
    description: "Guides for agents, APIs, and developer workflows",
    href: SYRA_DOCS_URL,
    linkLabel: "docs.syraa.fun",
  },
  {
    name: "SDK",
    description: "@syra-ai/sdk — typed client with createSyraPaidClient auto-pay",
    href: `${SYRA_DOCS_URL}/docs/build/sdk`,
    linkLabel: "Install SDK",
  },
];
