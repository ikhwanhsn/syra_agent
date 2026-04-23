/**
 * Resource path segments for GET /.well-known/x402 (no leading slash).
 * Keep in sync with actual x402 mounts in index.js.
 * Note: Binance, Giza, Bankr, Neynar, SIWA, and agent-direct tools (exa-search, crawl, browser-use,
 * jupiter/swap/order, 8004 stats/leaderboard/search, smart-money, token-god-mode, trending-jupiter,
 * pumpfun, squid, bubblemaps, 8004scan, heylol, quicknode) are not listed here — use POST /agent/tools/call.
 * HTTP /8004 remains for registration and non-agent marketplace flows; not advertised as a single x402 resource.
 */
export const X402_DISCOVERY_RESOURCE_PATHS = [
  // Core
  "brain",
  "news",
  "signal",
  "sentiment",
  "event",
  "trending-headline",
  "sundown-digest",
  "health",
  "mpp/v1/health",
  // Search & automation
  "arbitrage",
  // Analytics (internal: Jupiter + Nansen + Binance correlation math; no public /binance routes)
  "analytics/summary",
  "x",
];
