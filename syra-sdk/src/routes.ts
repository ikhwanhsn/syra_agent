/**
 * Public Syra x402 route prefixes — keep in sync with web/src/lib/publicX402Routes.ts
 * and api/config/x402DiscoveryResourcePaths.js
 */
export const SYRA_X402_ROUTE_PREFIXES = [
  "/brain",
  "/news",
  "/signal",
  "/sentiment",
  "/event",
  "/trending-headline",
  "/sundown-digest",
  "/health",
  "/mpp/v1",
  "/arbitrage",
  "/analytics/summary",
  "/x",
  "/x-analyzer",
  "/nansen",
  "/binance",
  "/8004",
] as const;

export function isSyraX402Path(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (!p) return false;
  if (p === "/binance-ticker" || p.startsWith("/binance-ticker/")) return false;
  return SYRA_X402_ROUTE_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
}

/** High-value routes agents pay for repeatedly. */
export const SYRA_HIGH_VALUE_ROUTES = {
  sentiment: { method: "GET" as const, path: "/sentiment", params: { ticker: "BTC" } },
  signal: { method: "GET" as const, path: "/signal", params: { token: "bitcoin" } },
  smartMoneyNetflow: {
    method: "POST" as const,
    path: "/nansen/smart-money/netflow",
    body: { chains: ["solana"] },
  },
  analyticsSummary: { method: "GET" as const, path: "/analytics/summary" },
  brain: { method: "POST" as const, path: "/brain", body: { question: "Latest BTC news?" } },
} as const;

export type SyraHighValueRouteId = keyof typeof SYRA_HIGH_VALUE_ROUTES;
