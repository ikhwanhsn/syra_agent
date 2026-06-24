/** Canonical Syra product branding — single source for agent registrations and public copy. */

export const SYRA_TAGLINE = "Machine Money for Agents";

/** Short one-liner (≤160 chars) for agent directories, OpenAPI, meta tags. */
export const SYRA_AGENT_DESCRIPTION =
  "Machine money for agents on Solana — Earn, Treasury, Invest, Spend (x402), Grow. Agent wallets, policy engine, and autonomous capital deployment.";

/** Ultra-short tagline variant. */
export const SYRA_TAGLINE_SHORT = "Machine money for agents";

/** OG / Twitter meta description. */
export const SYRA_META_DESCRIPTION =
  "Machine money for agents — five pillars: Earn, Treasury, Invest, Spend, Grow. Solana-native agent wallets and x402.";

/** SAP / compact registry blurb. */
export const SYRA_SAP_DESCRIPTION =
  "Machine money for agents: Earn · Treasury · Invest · Spend (x402) · Grow on Solana.";

/** Five-pillar discovery notice (product narrative). */
export const SYRA_PILLAR_NOTICE = [
  "x402 becomes one module (Spend)",
  "Payments become one feature",
  "Wealth becomes the narrative",
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
