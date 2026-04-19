/**
 * Resource path segments for GET /.well-known/x402 (no leading slash).
 * Keep in sync with actual x402 mounts in index.js.
 * Note: Binance, Giza, Bankr, Neynar, SIWA are agent-only (POST /agent/tools/call), not listed here.
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
  "check-status",
  "mpp/v1/check-status",
  // Search & automation
  "exa-search",
  "browser-use",
  "arbitrage",
  // Nansen, Jupiter, Bubblemaps
  "smart-money",
  "token-god-mode",
  "trending-jupiter",
  "jupiter/swap/order",
  "pumpfun/agents/swap",
  "pumpfun/agents/create-coin",
  "pumpfun/agents/collect-fees",
  "pumpfun/agents/sharing-config",
  "pumpfun/agent-payments/build-accept",
  "pumpfun/agent-payments/verify",
  "pumpfun/coin",
  "pumpfun/sol-price",
  "squid/route",
  "squid/status",
  "bubblemaps/maps",
  // Analytics (internal: Jupiter + Nansen + Binance correlation math; no public /binance routes)
  "analytics/summary",
  // 8004
  "8004",
  "8004scan",
  "heylol",
  "x",
  "quicknode/balance",
  "quicknode/transaction",
  "quicknode/rpc",
];
