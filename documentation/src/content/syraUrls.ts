/**
 * Canonical Syra product URLs — keep in sync with web/src/content/syraAbout.ts and web/README.md.
 */

export const SYRA_WEB_ORIGIN = "https://syraa.fun";

/** Agent chat (primary product surface). */
export const SYRA_AGENT_URL = SYRA_WEB_ORIGIN;

/** Agent wallet, deposits, and policy caps. */
export const SYRA_WALLET_URL = `${SYRA_WEB_ORIGIN}/wallet`;

/** x402 API marketplace — browse, detail pages, integrate, and custom tester (Spend module). */
export const SYRA_MARKETPLACE_URL = `${SYRA_WEB_ORIGIN}/marketplace`;

/** @deprecated `/playground` redirects to `/marketplace` */
export const SYRA_PLAYGROUND_URL = SYRA_MARKETPLACE_URL;

/** Operator dashboard — usage, spend, monitoring. */
export const SYRA_OVERVIEW_URL = `${SYRA_WEB_ORIGIN}/overview`;

export const SYRA_API_URL = "https://api.syraa.fun";
export const SYRA_DOCS_URL = "https://docs.syraa.fun";

export const SYRA_TELEGRAM_BOT_URL = "https://t.me/syra_trading_bot";
export const SYRA_TELEGRAM_COMMUNITY_URL = "https://t.me/syra_ai";
export const SYRA_X_URL = "https://x.com/syra_agent";

/** Human-readable label for the main web app hostname. */
export const SYRA_WEB_LABEL = "syraa.fun";

/** Trusted browser origins for API key injection (user-facing docs copy). */
export const SYRA_TRUSTED_ORIGINS_DOC =
  "syraa.fun (including /marketplace and /overview paths)";
