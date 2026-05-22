/**
 * Qwerti embedded widget — campaign + magic link fallback.
 * @see https://partner-demo.qwerti.ai/integration-guide?type=widget
 */

export const QWERTI_CAMPAIGN_ID = "syra-792703809-99467";

/** Required for single_token campaigns on the embed script tag. */
export const QWERTI_TOKEN_ADDRESS =
  "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";

export const QWERTI_CHAIN_ID = "792703809";

/** Opens automatically after mount when "true"; guide default is "false". */
export const QWERTI_AUTO_OPEN = "false";

export const QWERTI_WIDGET_CDN = "https://widget.qwerti.ai";
export const QWERTI_LOADER_PATH = "/buy.js";

/** Official loader URL (partner integration guide). */
export const QWERTI_LOADER_SRC_DIRECT = `${QWERTI_WIDGET_CDN}${QWERTI_LOADER_PATH}`;

/** Same-origin path proxied to widget.qwerti.ai (Vite dev + Vercel rewrite). */
export const QWERTI_LOADER_SRC_PROXY = `/qwerti${QWERTI_LOADER_PATH}`;

/** Prefer the CDN URL; proxy breaks on hosts without /qwerti rewrites. */
export function resolveQwertiLoaderSrc(): string {
  return QWERTI_LOADER_SRC_DIRECT;
}

/** @deprecated Use QWERTI_LOADER_SRC_DIRECT */
export const QWERTI_LOADER_SRC = QWERTI_LOADER_SRC_DIRECT;

export const QWERTI_MAGIC_LINK =
  "https://app.qwerti.ai/buy/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump/792703809?campaign=syra-792703809-99467";

/** Official Qwerti mark (same as app.qwerti.ai favicon). */
export const QWERTI_ICON_URL = "https://app.qwerti.ai/favicon.png";

/** Build the official embed <script> tag attributes. */
export function buildQwertiEmbedAttrs(): Record<string, string> {
  return {
    "data-widget": "qwerti-widget",
    "data-campaign": QWERTI_CAMPAIGN_ID,
    "data-token": QWERTI_TOKEN_ADDRESS,
    "data-chain": QWERTI_CHAIN_ID,
    "data-auto-open": QWERTI_AUTO_OPEN,
  };
}
