/**
 * Five-pillar route prefixes — keep in sync with api/config/pillars.js
 */
export const SYRA_PILLAR_IDS = ["earn", "treasury", "invest", "spend", "grow"];
export const SYRA_PILLAR_ROUTES = {
    earn: ["/earn", "/agent/marketplace", "/8004", "/agentscore", "/payouts"],
    treasury: ["/agent/wallet", "/agent/billing", "/dashboard-summary", "/wallet/solana", "/pillars"],
    invest: [
        "/invest",
        "/giza",
        "/jupiter",
        "/experiment/lp-agent-real",
        "/experiment/lp-agent",
        "/experiment/btc-quant-real",
        "/experiment/btc-quant",
        "/rise",
        "/bankr",
        "/squid",
    ],
    spend: [
        "/brain",
        "/news",
        "/signal",
        "/sentiment",
        "/event",
        "/trending-headline",
        "/sundown-digest",
        "/health",
        "/mpp",
        "/nansen",
        "/binance",
        "/x-analyzer",
        "/x-projects-analyze",
        "/x/",
        "/agent/tools",
        "/indicator",
        "/arbitrage",
        "/pumpfun",
        "/rise",
        "/coingecko",
        "/assets",
        "/bitcoin",
        "/spcx",
        "/equity",
        "/neynar",
        "/siwa",
        "/analytics/summary",
    ],
    grow: ["/grow", "/topledger", "/staking", "/streamflow-locks", "/analytics/kpi"],
};
export function resolveSyraPillarForPath(pathname) {
    const p = pathname.toLowerCase().split("?")[0];
    let best = null;
    for (const id of SYRA_PILLAR_IDS) {
        for (const prefix of SYRA_PILLAR_ROUTES[id]) {
            const pre = prefix.toLowerCase();
            if (p === pre || p.startsWith(pre.endsWith("/") ? pre : `${pre}/`) || p.startsWith(pre)) {
                if (!best || pre.length > best.len)
                    best = { id, len: pre.length };
            }
        }
    }
    return best?.id ?? "spend";
}
