#!/usr/bin/env node
/**
 * Syra MCP Server – exposes all Syra v2 API endpoints as MCP tools.
 *
 * The v2 API uses x402 payment; without a valid payment header the API returns 402.
 * For local testing: set SYRA_API_BASE_URL (e.g. http://localhost:3000) and
 * SYRA_USE_DEV_ROUTES=true to call /v2/.../dev for all endpoints (no payment).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const SYRA_API_BASE_URL = process.env.SYRA_API_BASE_URL || "https://api.syraa.fun";
const SYRA_USE_DEV_ROUTES = process.env.SYRA_USE_DEV_ROUTES === "true" || process.env.SYRA_USE_DEV_ROUTES === "1";
const PAYMENT_NOTE = " Note: production API requires x402 payment; you may get 402 if payment is not provided.";
/** GET request to v2 path with optional query params. When SYRA_USE_DEV_ROUTES, appends /dev to path. */
async function fetchV2(path, params = {}) {
    const resolvedPath = SYRA_USE_DEV_ROUTES ? `${path}/dev` : path;
    const url = new URL(resolvedPath, SYRA_API_BASE_URL);
    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== "")
            url.searchParams.set(key, value);
    }
    const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    const body = await res.text();
    return { status: res.status, body };
}
function formatToolResult(status, body) {
    if (status === 200)
        return body;
    return `API returned ${status}. Body:\n${body}`;
}
async function main() {
    const server = new McpServer({ name: "syra-mcp-server", version: "0.2.0" }, { capabilities: { tools: {} } });
    // --- News & event (with optional dev path) ---
    server.tool("syra_v2_news", "Fetch latest crypto news from Syra v2 API. Optional ticker (e.g. BTC, ETH) or 'general' for all news." + PAYMENT_NOTE, {
        ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    }, async ({ ticker }) => {
        const { status, body } = await fetchV2("/v2/news", { ticker: ticker ?? "general" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_event", "Fetch upcoming and recent crypto events, conferences, and launches." + PAYMENT_NOTE, {
        ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    }, async ({ ticker }) => {
        const { status, body } = await fetchV2("/v2/event", { ticker: ticker ?? "general" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Ticker-based (ticker param) ---
    server.tool("syra_v2_sentiment", "Get market sentiment analysis for crypto assets over last 30 days. Optional ticker or 'general'." + PAYMENT_NOTE, {
        ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    }, async ({ ticker }) => {
        const { status, body } = await fetchV2("/v2/sentiment", { ticker: ticker ?? "general" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_trending_headline", "Get trending crypto headlines. Optional ticker or 'general'." + PAYMENT_NOTE, {
        ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    }, async ({ ticker }) => {
        const { status, body } = await fetchV2("/v2/trending-headline", { ticker: ticker ?? "general" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Signal (token param) ---
    server.tool("syra_v2_signal", "Get AI-generated trading signals with entry/exit recommendations. Optional token name." + PAYMENT_NOTE, {
        token: z.string().optional().default("bitcoin").describe("Token name (e.g. solana, bitcoin)"),
    }, async ({ token }) => {
        const { status, body } = await fetchV2("/v2/signal", { token: token ?? "bitcoin" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- No-param GET endpoints ---
    const noParamTools = [
        { name: "syra_v2_check_status", path: "/v2/check-status", description: "Health check: verify API server status and connectivity." + PAYMENT_NOTE },
        { name: "syra_v2_sundown_digest", path: "/v2/sundown-digest", description: "Get the daily sundown digest (crypto roundup)." + PAYMENT_NOTE },
        { name: "syra_v2_gems", path: "/v2/gems", description: "Discover hidden gem crypto projects trending on X/Twitter." + PAYMENT_NOTE },
        { name: "syra_v2_crypto_kol", path: "/v2/crypto-kol", description: "Get latest insights from top crypto KOLs (e.g. @elonmusk, @VitalikButerin)." + PAYMENT_NOTE },
        { name: "syra_v2_token_statistic", path: "/v2/token-statistic", description: "Token statistic on Rugcheck (new, recent, trending, verified)." + PAYMENT_NOTE },
        { name: "syra_v2_smart_money", path: "/v2/smart-money", description: "Smart money tracking: net flow, holdings, DEX trades, DCA patterns." + PAYMENT_NOTE },
        { name: "syra_v2_dexscreener", path: "/v2/dexscreener", description: "DEXScreener aggregated data: token profiles, community takeovers, ads, boosted tokens." + PAYMENT_NOTE },
        { name: "syra_v2_trending_jupiter", path: "/v2/trending-jupiter", description: "Trending tokens on Jupiter." + PAYMENT_NOTE },
        { name: "syra_v2_analytics_summary", path: "/v2/analytics/summary", description: "Full analytics summary: dexscreener, token-statistic, trending-jupiter, smart-money, binance correlation, memecoin screens." + PAYMENT_NOTE },
    ];
    for (const { name, path, description } of noParamTools) {
        server.tool(name, description, {}, async () => {
            const { status, body } = await fetchV2(path);
            return { content: [{ type: "text", text: formatToolResult(status, body) }] };
        });
    }
    // --- Query param (required or optional) ---
    server.tool("syra_v2_research", "AI-powered deep research on any crypto topic with cited sources. Provide a query; optional type 'quick' or 'deep'." + PAYMENT_NOTE, {
        query: z.string().describe("Research query (e.g. token analysis, market trends)"),
        type: z.enum(["quick", "deep"]).optional().describe("'quick' for fast, 'deep' for comprehensive"),
    }, async ({ query, type }) => {
        const params = { query };
        if (type)
            params.type = type;
        const { status, body } = await fetchV2("/v2/research", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_browse", "AI-powered web browsing and information extraction from a URL or search query." + PAYMENT_NOTE, {
        query: z.string().describe("Search query or URL to browse and extract information from"),
    }, async ({ query }) => {
        const { status, body } = await fetchV2("/v2/browse", { query });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_x_search", "Deep research on X/Twitter for crypto trends and discussions." + PAYMENT_NOTE, {
        query: z.string().describe("Search query for X/Twitter (e.g. token name, topic)"),
    }, async ({ query }) => {
        const { status, body } = await fetchV2("/v2/x-search", { query });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Address / token address param ---
    server.tool("syra_v2_x_kol", "Analyze KOL/Influencer mentions and sentiment for a token on X/Twitter. Requires Solana token contract address." + PAYMENT_NOTE, {
        address: z.string().describe("Solana token contract address"),
    }, async ({ address }) => {
        const { status, body } = await fetchV2("/v2/x-kol", { address });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_token_report", "Get token report from Rugcheck. Requires token contract address." + PAYMENT_NOTE, {
        address: z.string().describe("Token contract address"),
    }, async ({ address }) => {
        const { status, body } = await fetchV2("/v2/token-report", { address });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_token_god_mode", "Nansen token god mode: deep research for a token. Requires token address." + PAYMENT_NOTE, {
        tokenAddress: z.string().describe("Token address for research"),
    }, async ({ tokenAddress }) => {
        const { status, body } = await fetchV2("/v2/token-god-mode", { tokenAddress });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_bubblemaps_maps", "Bubblemaps holder/concentration map data for a Solana token. Requires contract address." + PAYMENT_NOTE, {
        address: z.string().describe("Solana token contract address"),
    }, async ({ address }) => {
        const { status, body } = await fetchV2("/v2/bubblemaps/maps", { address });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Binance ---
    server.tool("syra_v2_binance_correlation", "Get Binance correlation for a symbol (top correlated assets). Optional symbol, default BTCUSDT." + PAYMENT_NOTE, {
        symbol: z.string().optional().default("BTCUSDT").describe("Symbol (e.g. BTCUSDT, ETHUSDT)"),
    }, async ({ symbol }) => {
        const { status, body } = await fetchV2("/v2/binance/correlation", { symbol: symbol ?? "BTCUSDT" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_binance_correlation_matrix", "Get full Binance correlation matrix. Optional symbol." + PAYMENT_NOTE, {
        symbol: z.string().optional().describe("Symbol (e.g. BTCUSDT)"),
    }, async ({ symbol }) => {
        const params = {};
        if (symbol)
            params.symbol = symbol;
        const { status, body } = await fetchV2("/v2/binance/correlation-matrix", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Pump (workfun) - GET may have params, check route ---
    server.tool("syra_v2_pump", "Pump.fun / Workfun data (trending, etc.)." + PAYMENT_NOTE, {}, async () => {
        const { status, body } = await fetchV2("/v2/pump");
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Memecoin screens (all no-param GET) ---
    const memecoinTools = [
        { name: "syra_v2_memecoin_fastest_holder_growth", path: "/v2/memecoin/fastest-holder-growth", description: "Fastest growing memecoins by holder growth rate." + PAYMENT_NOTE },
        { name: "syra_v2_memecoin_most_mentioned_smart_money_x", path: "/v2/memecoin/most-mentioned-by-smart-money-x", description: "Memecoins most mentioned by smart money on X." + PAYMENT_NOTE },
        { name: "syra_v2_memecoin_accumulating_before_cex_rumors", path: "/v2/memecoin/accumulating-before-CEX-rumors", description: "Memecoins accumulating before CEX listing rumors." + PAYMENT_NOTE },
        { name: "syra_v2_memecoin_strong_narrative_low_mcap", path: "/v2/memecoin/strong-narrative-low-market-cap", description: "Strong narrative, low market cap memecoins." + PAYMENT_NOTE },
        { name: "syra_v2_memecoin_by_experienced_devs", path: "/v2/memecoin/by-experienced-devs", description: "Memecoins by experienced developers." + PAYMENT_NOTE },
        { name: "syra_v2_memecoin_unusual_whale_behavior", path: "/v2/memecoin/unusual-whale-behavior", description: "Unusual whale behavior in memecoins." + PAYMENT_NOTE },
        { name: "syra_v2_memecoin_trending_on_x_not_dex", path: "/v2/memecoin/trending-on-x-not-dex", description: "Memecoins trending on X but not yet on DEX." + PAYMENT_NOTE },
        { name: "syra_v2_memecoin_organic_traction", path: "/v2/memecoin/organic-traction", description: "Memecoins with organic traction." + PAYMENT_NOTE },
        { name: "syra_v2_memecoin_surviving_market_dumps", path: "/v2/memecoin/surviving-market-dumps", description: "Memecoins surviving market dumps." + PAYMENT_NOTE },
    ];
    for (const { name, path, description } of memecoinTools) {
        server.tool(name, description, {}, async () => {
            const { status, body } = await fetchV2(path);
            return { content: [{ type: "text", text: formatToolResult(status, body) }] };
        });
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(() => {
    process.exit(1);
});
