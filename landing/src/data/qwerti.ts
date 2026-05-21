/**
 * Qwerti embed campaign config for $SYRA buy widget.
 * @see https://app.qwerti.ai/campaign/create
 */

export const QWERTI_CAMPAIGN_ID = "syra-792703809-70534";

export const QWERTI_WIDGET_CDN = "https://widget.qwerti.ai";
export const QWERTI_LOADER_PATH = "/widget/v1/buy.js";

/** Direct CDN (docs / error messages only — avoid loading in the browser). */
export const QWERTI_LOADER_SRC_DIRECT = `${QWERTI_WIDGET_CDN}${QWERTI_LOADER_PATH}`;

/** Same-origin path proxied to widget.qwerti.ai (Vite dev + Vercel rewrite). */
export const QWERTI_LOADER_SRC_PROXY = `/qwerti${QWERTI_LOADER_PATH}`;

export function resolveQwertiLoaderSrc(): string {
  if (typeof window === "undefined") return QWERTI_LOADER_SRC_PROXY;
  return `${window.location.origin}${QWERTI_LOADER_SRC_PROXY}`;
}

/** @deprecated Use resolveQwertiLoaderSrc() */
export const QWERTI_LOADER_SRC = QWERTI_LOADER_SRC_PROXY;

export const QWERTI_MAGIC_LINK =
  "https://app.qwerti.ai/buy/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump/792703809?campaign=syra-792703809-70534";

/** Official Qwerti mark (same as app.qwerti.ai favicon). */
export const QWERTI_ICON_URL = "https://app.qwerti.ai/favicon.png";
