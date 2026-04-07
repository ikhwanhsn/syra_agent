/**
 * Agentic Playground — product copy (Syra).
 * Supports payment-gated flows: standard x402 resources and MPP (machine payments) lanes — both use HTTP 402 + wallet settlement where applicable.
 */
export const BRAND_NAME = 'Agentic Playground';
export const BRAND_WORD_MARK = 'Agentic';
/** Short line under the word mark in the top bar */
export const BRAND_SUBLINE = 'HTTP 402 · x402 & MPP · wallet-native';

/** Padding below fixed TopBar (h-14 sm:h-16) + iOS safe area — use on main scroll regions */
export const MAIN_CONTENT_PT_CLASS =
  'pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))]';

/** Bottom inset for home indicator / gesture areas */
export const MAIN_CONTENT_PB_SAFE_CLASS = 'pb-[env(safe-area-inset-bottom,0px)]';

/**
 * Mobile history drawer: fixed below TopBar (does not sit under the header).
 * Pair with `max-lg:bottom-0` and optional bottom safe padding inside.
 */
export const HISTORY_DRAWER_TOP_CLASS =
  'max-lg:top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:max-lg:top-[calc(4rem+env(safe-area-inset-top,0px))]';
