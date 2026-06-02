/**
 * Agentic Playground — product copy (Syra).
 * Supports payment-gated flows: standard x402 resources and MPP (machine payments) lanes — both use HTTP 402 + wallet settlement where applicable.
 */
export const BRAND_NAME = 'Agentic Playground';
export const BRAND_WORD_MARK = 'Agentic';
/** Short line under the word mark in the top bar */
export const BRAND_SUBLINE = 'HTTP 402 · x402 & MPP · wallet-native';

/** @deprecated Playground uses site GlobalNav only — no extra top padding */
export const MAIN_CONTENT_PT_CLASS = '';

/** Bottom inset for home indicator / gesture areas */
export const MAIN_CONTENT_PB_SAFE_CLASS = 'pb-[env(safe-area-inset-bottom,0px)]';

/** Mobile history drawer: below site GlobalNav */
export const HISTORY_DRAWER_TOP_CLASS =
  'max-lg:top-[calc(var(--syra-global-nav-height,3.5rem)+env(safe-area-inset-top,0px))]';
