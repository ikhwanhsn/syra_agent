/**
 * Public Syra x402 route prefixes — keep in sync with web/src/lib/publicX402Routes.ts
 * and api/config/x402DiscoveryResourcePaths.js
 */
export declare const SYRA_X402_ROUTE_PREFIXES: readonly ["/brain", "/news", "/signal", "/sentiment", "/event", "/trending-headline", "/sundown-digest", "/health", "/mpp/v1", "/arbitrage", "/analytics/summary", "/x", "/x-analyzer", "/nansen", "/binance", "/8004"];
export declare function isSyraX402Path(pathname: string): boolean;
/** High-value routes agents pay for repeatedly. */
export declare const SYRA_HIGH_VALUE_ROUTES: {
    readonly sentiment: {
        readonly method: "GET";
        readonly path: "/sentiment";
        readonly params: {
            readonly ticker: "BTC";
        };
    };
    readonly signal: {
        readonly method: "GET";
        readonly path: "/signal";
        readonly params: {
            readonly token: "bitcoin";
        };
    };
    readonly smartMoneyNetflow: {
        readonly method: "POST";
        readonly path: "/nansen/smart-money/netflow";
        readonly body: {
            readonly chains: readonly ["solana"];
        };
    };
    readonly analyticsSummary: {
        readonly method: "GET";
        readonly path: "/analytics/summary";
    };
    readonly brain: {
        readonly method: "POST";
        readonly path: "/brain";
        readonly body: {
            readonly question: "Latest BTC news?";
        };
    };
};
export type SyraHighValueRouteId = keyof typeof SYRA_HIGH_VALUE_ROUTES;
