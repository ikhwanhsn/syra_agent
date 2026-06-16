/**
 * Resource path segments for GET /.well-known/x402 (no leading slash).
 * Keep in sync with actual x402 mounts in index.js.
 * Note: Binance, Giza, Bankr, Neynar, SIWA, and agent-direct tools (exa-search, crawl, browser-use,
 * jupiter/swap/order, 8004 stats/leaderboard/search, smart-money, token-god-mode, trending-jupiter,
 * pumpfun, squid, bubblemaps, 8004scan, heylol, quicknode, GMGN (gmgn-*) are not listed here — use POST /agent/tools/call.
 * HTTP /8004 remains for registration and non-agent marketplace flows; not advertised as a single x402 resource.
 */
export const X402_DISCOVERY_RESOURCE_PATHS = [
  // Core intelligence rail
  "brain",
  "news",
  "signal",
  "spcx",
  "equity",
  "indicator",
  "sentiment",
  "event",
  "trending-headline",
  "sundown-digest",
  "health",
  "mpp/v1/health",
  // Execution & automation
  "arbitrage",
  // Analytics bundle (Jupiter + Nansen smart money + Binance correlation)
  "analytics/summary",
  // Social & research
  "x",
  "x-analyzer",
  // High-value: smart money + risk (Nansen tier)
  "nansen/smart-money/netflow",
  "nansen/smart-money/holdings",
  "nansen/smart-money/dex-trades",
  "nansen/token-god-mode",
  // 8004 agent registry discovery
  "8004/stats",
  "8004/leaderboard",
  "8004/agents/search",
];
