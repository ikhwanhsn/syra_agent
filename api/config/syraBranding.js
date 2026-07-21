/** Canonical Syra product branding — single source for agent registrations and public copy. */

export const SYRA_TAGLINE = "Machine Money for Agents";

/** Live wedge under the brand — always pair with SYRA_TAGLINE in hero copy. */
export const SYRA_LIVE_SUBLINE = "Live today: pay-per-call crypto APIs over x402";

/** Short one-liner (≤160 chars) for agent directories, OpenAPI, meta tags. */
export const SYRA_AGENT_DESCRIPTION =
  "Machine money for agents — Earn, Treasury, Invest, Spend, and Grow on Solana. Live today: pay-per-call crypto APIs via x402, MCP, and typed SDK.";

/** Ultra-short tagline variant. */
export const SYRA_TAGLINE_SHORT = "Machine Money for Agents";

/** OG / Twitter meta description. */
export const SYRA_META_DESCRIPTION =
  "Machine money for agents on Solana — live x402 pay-per-call APIs, MCP tools, typed SDK. Earn · Treasury · Invest · Spend · Grow.";

/** SAP / compact registry blurb. */
export const SYRA_SAP_DESCRIPTION =
  "Machine money for agents: x402 + MCP + SDK on Solana. Live: Spend. Platform: Earn · Treasury · Invest · Grow.";

/**
 * Pillar maturity ladder — keep in sync with web/src/lib/syraBranding.ts + config/pillars.js.
 * @type {Record<'earn' | 'treasury' | 'invest' | 'spend' | 'grow', 'live' | 'beta' | 'infra' | 'roadmap'>}
 */
export const SYRA_PILLAR_STATUS = {
  spend: 'live',
  invest: 'beta',
  earn: 'beta',
  treasury: 'infra',
  grow: 'roadmap',
};

/**
 * Platform notice for agents and OpenAPI.
 * Brand = Machine Money; Live GTM wedge = Spend x402.
 */
export const SYRA_PILLAR_NOTICE = [
  'Brand: Machine Money for Agents — Earn · Treasury · Invest · Spend · Grow',
  'Live today: x402 pay-per-call APIs + MCP/SDK (Spend)',
  'Discovery: GET /pillars on api.syraa.fun (includes status per pillar)',
];

/** Bazaar / Ampersend marketplace discovery metadata (paymentPayload.resource service fields). */
export const SYRA_BAZAAR_SERVICE_NAME = "Syra";
export const SYRA_BAZAAR_CATEGORY = "Crypto";
export const SYRA_BAZAAR_TAGS = [
  "agents",
  "x402",
  "crypto",
  "trading",
  "analytics",
  "machine-money",
];
export const SYRA_BAZAAR_ICON_URL =
  String(process.env.SYRA_BAZAAR_ICON_URL || "https://api.syraa.fun/favicon.ico").trim();
export const SYRA_BAZAAR_DOCS_URL = "https://docs.syraa.fun";

/** @deprecated Use SYRA_BAZAAR_* — kept for existing imports */
export const SYRA_B402_BAZAAR_SERVICE_NAME = SYRA_BAZAAR_SERVICE_NAME;
/** @deprecated Use SYRA_BAZAAR_* */
export const SYRA_B402_BAZAAR_TAGS = SYRA_BAZAAR_TAGS;
/** @deprecated Use SYRA_BAZAAR_* */
export const SYRA_B402_BAZAAR_ICON_URL = SYRA_BAZAAR_ICON_URL;
