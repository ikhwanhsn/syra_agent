/** Canonical Syra product branding — keep in sync with api/config/syraBranding.js */

export const SYRA_TAGLINE = "Machine Money for Agents";

/** Live wedge under the brand — always pair with SYRA_TAGLINE in hero copy. */
export const SYRA_LIVE_SUBLINE = "Live today: pay-per-call crypto APIs over x402";

/** Default `<title>` / document title restore value. */
export const SYRA_DOCUMENT_TITLE = "Syra";

export const SYRA_AGENT_DESCRIPTION =
  "Machine money for agents — Earn, Treasury, Invest, Spend, and Grow on Solana. Live today: pay-per-call crypto APIs via x402, MCP, and typed SDK.";

export const SYRA_TAGLINE_SHORT = "Machine Money for Agents";

export const SYRA_META_DESCRIPTION =
  "Machine money for agents on Solana — live x402 pay-per-call APIs, MCP tools, typed SDK. Earn · Treasury · Invest · Spend · Grow.";

export const SYRA_SAP_DESCRIPTION =
  "Machine money for agents: x402 + MCP + SDK on Solana. Live: Spend. Platform: Earn · Treasury · Invest · Grow.";

/** @typedef {'live' | 'beta' | 'infra' | 'roadmap'} PillarStatus */

/**
 * Pillar maturity ladder — keep in sync with api/config/syraBranding.js + pillars.js.
 * Live = production revenue; Beta = real surfaces incomplete; Infra = plumbing only; Roadmap = analysis/heuristics.
 */
export const SYRA_PILLAR_STATUS = {
  spend: "live",
  invest: "beta",
  earn: "beta",
  treasury: "infra",
  grow: "roadmap",
} as const satisfies Record<string, PillarStatus>;

export type PillarId = keyof typeof SYRA_PILLAR_STATUS;
