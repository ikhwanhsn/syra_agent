/**
 * Resource path segments for GET /.well-known/x402 (no leading slash).
 * Keep in sync with actual x402 mounts in index.js.
 * Payment networks advertised in discovery instructions: Solana, Base, B402 (optional), Algorand (GoPlausible).
 * Note: Binance, Giza, Bankr, Neynar, SIWA, analytics/summary, X, x-analyzer, Nansen, and agent-direct tools
 * (web-search, crawl, browser-use, jupiter/swap/order, smart-money, token-god-mode, trending-jupiter,
 * pumpfun, squid, bubblemaps, 8004scan, heylol, quicknode, GMGN (gmgn-*)) are not listed here — use POST /agent/tools/call.
 * HTTP /8004 remains for registration and non-agent marketplace flows; not advertised as a single x402 resource.
 */
export const X402_DISCOVERY_RESOURCE_PATHS = [
  // Core machine money rail (x402 APIs)
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
  "mpp/health",
  // Execution & automation
  "arbitrage",
  "jupiter/quote",
  "pumpfun/trending",
  "pumpfun/movers",
  "pumpfun/analyzer",
  "pumpfun/scout",
  "rise",
  "coingecko",
  "dexscreener/pairs",
  "geckoterminal/pools",
  "defillama/tvl",
  "rugcheck/report",
  "pyth/price",
  "insights/network-health",
  "insights/gas-oracle",
  "insights/market-pulse",
  "insights/token-metrics",
  "insights/defi-tvl",
  "insights/volatility-index",
  "insights/ecosystem-brief",
  "assets",
  "assets/detail",
  "bitcoin",
  "chat/completions",
  "images/generations",
  "videos/generations",
  // 8004 agent registry discovery
  "8004/stats",
  "8004/leaderboard",
  "8004/agents/search",
];
