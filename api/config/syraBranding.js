/** Canonical Syra product branding — single source for agent registrations and public copy. */

export const SYRA_TAGLINE = "Pay-per-call crypto APIs for agents";

/** Short one-liner (≤160 chars) for agent directories, OpenAPI, meta tags. */
export const SYRA_AGENT_DESCRIPTION =
  "Pay-per-call crypto intelligence for agents — settle USDC via x402, integrate with MCP or the SDK, no per-vendor API keys.";

/** Ultra-short tagline variant. */
export const SYRA_TAGLINE_SHORT = "Pay-per-call crypto APIs for agents";

/** OG / Twitter meta description. */
export const SYRA_META_DESCRIPTION =
  "Pay-per-call crypto APIs for agents on Solana — x402 micropayments, MCP tools, and typed SDK.";

/** SAP / compact registry blurb. */
export const SYRA_SAP_DESCRIPTION =
  "Pay-per-call crypto intelligence for agents: x402 + MCP + SDK on Solana.";

/**
 * Platform roadmap modules (API discovery via GET /pillars).
 * Not public GTM — live wedge is x402 pay-per-call + MCP/SDK.
 */
export const SYRA_PILLAR_NOTICE = [
  "Live GTM: x402 pay-per-call APIs + MCP/SDK",
  "Platform roadmap: Earn · Treasury · Invest · Spend · Grow",
  "Discovery: GET /pillars on api.syraa.fun",
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
