/** Canonical Syra product branding — keep in sync with api/config/syraBranding.js */

import {
  SYRA_AGENT_URL,
  SYRA_API_URL,
  SYRA_DOCS_URL,
  SYRA_MARKETPLACE_URL,
  SYRA_WEB_LABEL,
} from "./syraUrls";

export const SYRA_TAGLINE = "Pay-per-call crypto APIs for agents";

export const SYRA_DOCS_BLURB =
  "Documentation for Syra: pay-per-call crypto intelligence for agents — x402, MCP, and typed SDK on Solana.";

export const SYRA_DOCS_BADGE = "x402 pay-per-call for agents";

export const SYRA_HIGHLIGHT =
  "Syra is pay-per-call crypto intelligence for agents — settle USDC via x402, integrate with MCP or the SDK, no per-vendor API keys.";

export const SYRA_MISSION =
  "Syra lets autonomous agents pay for crypto intelligence and tools on every call — x402 micropayments, MCP, and a typed SDK on Solana.";

export const SYRA_VISION =
  "An economy where millions of AI agents pay for tools, settle in USDC, and coordinate value without human billing ops.";

/** Live GTM capabilities — what builders do today. */
export const SYRA_LIVE_CAPABILITIES = [
  {
    title: "Pay per call",
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
 * Platform roadmap modules (GET /pillars). Not public GTM hero copy.
 * @deprecated Prefer SYRA_LIVE_CAPABILITIES for docs Welcome / home.
 */
export const SYRA_PILLARS = [
  { title: "Earn", description: "Agents monetize skills." },
  { title: "Treasury", description: "Allocate and manage capital." },
  { title: "Invest", description: "Deploy capital autonomously." },
  { title: "Spend", description: "x402 native payments (live)." },
  { title: "Grow", description: "Yield + portfolio optimization." },
] as const;

/** @deprecated Prefer SYRA_LIVE_CAPABILITIES */
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
