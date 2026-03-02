#!/usr/bin/env node
/**
 * Syra MCP Server – exposes Syra x402 API endpoints as MCP tools.
 *
 * The API uses x402 payment; without a valid payment header the API returns 402.
 * For local testing: set SYRA_API_BASE_URL (e.g. http://localhost:3000) and
 * SYRA_USE_DEV_ROUTES=true to call /.../dev for all endpoints (no payment).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const SYRA_API_BASE_URL = process.env.SYRA_API_BASE_URL || "https://api.syraa.fun";
const SYRA_USE_DEV_ROUTES = process.env.SYRA_USE_DEV_ROUTES === "true" || process.env.SYRA_USE_DEV_ROUTES === "1";
const PAYMENT_NOTE = " Note: production API requires x402 payment; you may get 402 if payment is not provided.";
/** GET request to API path with optional query params. When SYRA_USE_DEV_ROUTES, appends /dev to path. */
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
    server.tool("syra_v2_news", "Fetch latest crypto news from Syra API. Optional ticker (e.g. BTC, ETH) or 'general' for all news." + PAYMENT_NOTE, {
        ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    }, async ({ ticker }) => {
        const { status, body } = await fetchV2("/news", { ticker: ticker ?? "general" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_event", "Fetch upcoming and recent crypto events, conferences, and launches." + PAYMENT_NOTE, {
        ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    }, async ({ ticker }) => {
        const { status, body } = await fetchV2("/event", { ticker: ticker ?? "general" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Ticker-based (ticker param) ---
    server.tool("syra_v2_sentiment", "Get market sentiment analysis for crypto assets over last 30 days. Optional ticker or 'general'." + PAYMENT_NOTE, {
        ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    }, async ({ ticker }) => {
        const { status, body } = await fetchV2("/sentiment", { ticker: ticker ?? "general" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_trending_headline", "Get trending crypto headlines. Optional ticker or 'general'." + PAYMENT_NOTE, {
        ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    }, async ({ ticker }) => {
        const { status, body } = await fetchV2("/trending-headline", { ticker: ticker ?? "general" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Signal (token param) ---
    server.tool("syra_v2_signal", "Get AI-generated trading signals with entry/exit recommendations. Optional token name." + PAYMENT_NOTE, {
        token: z.string().optional().default("bitcoin").describe("Token name (e.g. solana, bitcoin)"),
    }, async ({ token }) => {
        const { status, body } = await fetchV2("/signal", { token: token ?? "bitcoin" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- No-param GET endpoints ---
    const noParamTools = [
        { name: "syra_v2_check_status", path: "/check-status", description: "Health check: verify API server status and connectivity." + PAYMENT_NOTE },
        { name: "syra_v2_sundown_digest", path: "/sundown-digest", description: "Get the daily sundown digest (crypto roundup)." + PAYMENT_NOTE },
        { name: "syra_v2_token_statistic", path: "/token-statistic", description: "Token statistic on Rugcheck (new, recent, trending, verified)." + PAYMENT_NOTE },
        { name: "syra_v2_smart_money", path: "/smart-money", description: "Smart money tracking: net flow, holdings, DEX trades, DCA patterns." + PAYMENT_NOTE },
        { name: "syra_v2_dexscreener", path: "/dexscreener", description: "DEXScreener aggregated data: token profiles, community takeovers, ads, boosted tokens." + PAYMENT_NOTE },
        { name: "syra_v2_trending_jupiter", path: "/trending-jupiter", description: "Trending tokens on Jupiter." + PAYMENT_NOTE },
        { name: "syra_v2_analytics_summary", path: "/analytics/summary", description: "Full analytics summary: dexscreener, token-statistic, trending-jupiter, smart-money, binance correlation." + PAYMENT_NOTE },
    ];
    for (const { name, path, description } of noParamTools) {
        server.tool(name, description, {}, async () => {
            const { status, body } = await fetchV2(path);
            return { content: [{ type: "text", text: formatToolResult(status, body) }] };
        });
    }
    // --- Query param (required or optional) ---
    server.tool("syra_v2_jupiter_swap_order", "Get a Jupiter Ultra swap order (buy/sell token on Solana). Returns a transaction to sign and submit. Requires inputMint, outputMint, amount (smallest units), taker (wallet pubkey)." + PAYMENT_NOTE, {
        inputMint: z.string().describe("Input token mint address (e.g. SOL: So11111111111111111111111111111111111111112)"),
        outputMint: z.string().describe("Output token mint address (e.g. USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)"),
        amount: z.string().describe("Amount in smallest units (e.g. lamports for SOL)"),
        taker: z.string().describe("Wallet public key that will execute the swap"),
    }, async ({ inputMint, outputMint, amount, taker }) => {
        const { status, body } = await fetchV2("/jupiter/swap/order", {
            inputMint,
            outputMint,
            amount,
            taker,
        });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_exa_search", "EXA AI web search. Only the search query is dynamic (e.g. latest news on Nvidia, crypto market analysis)." + PAYMENT_NOTE, {
        query: z.string().describe("Search query (e.g. latest news on Nvidia, crypto market analysis)"),
    }, async ({ query }) => {
        const { status, body } = await fetchV2("/exa-search", { query });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Address / token address param ---
    server.tool("syra_v2_token_report", "Get token report from Rugcheck. Requires token contract address." + PAYMENT_NOTE, {
        address: z.string().describe("Token contract address"),
    }, async ({ address }) => {
        const { status, body } = await fetchV2("/token-report", { address });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_token_risk_alerts", "Token risk alerts: tokens from Rugcheck (new/recent/trending/verified) with risk score at or above threshold. Use from dev with SYRA_USE_DEV_ROUTES=true and SYRA_API_BASE_URL to skip payment." + PAYMENT_NOTE, {
        rugScoreMin: z.number().optional().default(80).describe("Minimum normalised risk score 0-100 (default 80)"),
        source: z.string().optional().describe("Comma-separated: new_tokens, recent, trending, verified (default all)"),
        limit: z.number().optional().default(20).describe("Max tokens to check 1-50 (default 20)"),
    }, async ({ rugScoreMin, source, limit }) => {
        const params = {};
        if (rugScoreMin != null)
            params.rugScoreMin = String(rugScoreMin);
        if (source)
            params.source = source;
        if (limit != null)
            params.limit = String(limit);
        const { status, body } = await fetchV2("/token-risk/alerts", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_token_god_mode", "Nansen token god mode: deep research for a token. Requires token address." + PAYMENT_NOTE, {
        tokenAddress: z.string().describe("Token address for research"),
    }, async ({ tokenAddress }) => {
        const { status, body } = await fetchV2("/token-god-mode", { tokenAddress });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_bubblemaps_maps", "Bubblemaps holder/concentration map data for a Solana token. Requires contract address." + PAYMENT_NOTE, {
        address: z.string().describe("Solana token contract address"),
    }, async ({ address }) => {
        const { status, body } = await fetchV2("/bubblemaps/maps", { address });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- Binance ---
    server.tool("syra_v2_binance_correlation", "Get Binance correlation for a symbol (top correlated assets). Optional symbol, default BTCUSDT." + PAYMENT_NOTE, {
        symbol: z.string().optional().default("BTCUSDT").describe("Symbol (e.g. BTCUSDT, ETHUSDT)"),
    }, async ({ symbol }) => {
        const { status, body } = await fetchV2("/binance/correlation", { symbol: symbol ?? "BTCUSDT" });
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_binance_correlation_matrix", "Get full Binance correlation matrix. Optional symbol." + PAYMENT_NOTE, {
        symbol: z.string().optional().describe("Symbol (e.g. BTCUSDT)"),
    }, async ({ symbol }) => {
        const params = {};
        if (symbol)
            params.symbol = symbol;
        const { status, body } = await fetchV2("/binance/correlation-matrix", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- CoinGecko x402 simple price & onchain token price ---
    server.tool("syra_v2_coingecko_simple_price", "CoinGecko x402: USD price and market data for coins by symbol (e.g. btc,eth,sol) or CoinGecko id (e.g. bitcoin,ethereum). Provide either symbols or ids." + PAYMENT_NOTE, {
        symbols: z.string().optional().describe("Comma-separated symbols (e.g. btc,eth,sol)"),
        ids: z.string().optional().describe("Comma-separated CoinGecko ids (e.g. bitcoin,ethereum,solana)"),
        vs_currencies: z.string().optional().default("usd").describe("e.g. usd"),
        include_market_cap: z.string().optional().describe("true/false"),
        include_24hr_vol: z.string().optional().describe("true/false"),
        include_24hr_change: z.string().optional().describe("true/false"),
    }, async ({ symbols, ids, vs_currencies, include_market_cap, include_24hr_vol, include_24hr_change }) => {
        const params = { vs_currencies: vs_currencies ?? "usd" };
        if (symbols)
            params.symbols = symbols;
        if (ids)
            params.ids = ids;
        // API requires either symbols or ids; default to bitcoin when agent omits both
        if (!params.symbols && !params.ids)
            params.ids = "bitcoin";
        if (include_market_cap)
            params.include_market_cap = include_market_cap;
        if (include_24hr_vol)
            params.include_24hr_vol = include_24hr_vol;
        if (include_24hr_change)
            params.include_24hr_change = include_24hr_change;
        const { status, body } = await fetchV2("/coingecko/simple-price", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_coingecko_onchain_token_price", "CoinGecko x402: token price(s) by contract address on a network. Supports multiple addresses comma-separated. Requires network and address." + PAYMENT_NOTE, {
        network: z.string().describe("Network id (e.g. base, solana, eth)"),
        address: z.string().describe("Token contract address (comma-separated for multiple)"),
        include_market_cap: z.string().optional().describe("true/false"),
        include_24hr_vol: z.string().optional().describe("true/false"),
        include_24hr_price_change: z.string().optional().describe("true/false"),
    }, async ({ network, address, include_market_cap, include_24hr_vol, include_24hr_price_change }) => {
        const params = { network: network ?? "", address: address ?? "" };
        if (include_market_cap)
            params.include_market_cap = include_market_cap;
        if (include_24hr_vol)
            params.include_24hr_vol = include_24hr_vol;
        if (include_24hr_price_change)
            params.include_24hr_price_change = include_24hr_price_change;
        const { status, body } = await fetchV2("/coingecko/onchain/token-price", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    // --- CoinGecko x402 onchain ---
    server.tool("syra_v2_coingecko_search_pools", "CoinGecko x402: search pools and tokens by name, symbol, or contract address on a network (e.g. solana, base)." + PAYMENT_NOTE, {
        query: z.string().describe("Search query (name, symbol, or contract address)"),
        network: z.string().optional().default("solana").describe("Network id (e.g. solana, base)"),
        page: z.string().optional().describe("Page number"),
        include: z.string().optional().describe("Comma-separated: base_token, quote_token, dex"),
    }, async ({ query, network, page, include }) => {
        const params = { query: query ?? "", network: network ?? "solana" };
        if (page)
            params.page = page;
        if (include)
            params.include = include;
        const { status, body } = await fetchV2("/coingecko/onchain/search-pools", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_coingecko_trending_pools", "CoinGecko x402: trending pools and tokens by network (e.g. base, solana). Optional duration (e.g. 5m)." + PAYMENT_NOTE, {
        network: z.string().optional().default("base").describe("Network id (e.g. base, solana)"),
        duration: z.string().optional().default("5m").describe("Duration (e.g. 5m)"),
        page: z.string().optional().describe("Page number"),
        include_gt_community_data: z.string().optional().describe("Include community data (true/false)"),
        include: z.string().optional().describe("Comma-separated fields"),
    }, async ({ network, duration, page, include_gt_community_data, include }) => {
        const params = { network: network ?? "base", duration: duration ?? "5m" };
        if (page)
            params.page = page;
        if (include_gt_community_data)
            params.include_gt_community_data = include_gt_community_data;
        if (include)
            params.include = include;
        const { status, body } = await fetchV2("/coingecko/onchain/trending-pools", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    server.tool("syra_v2_coingecko_onchain_token", "CoinGecko x402: token data by contract address on a network (price, liquidity, top pools). Requires network and address." + PAYMENT_NOTE, {
        network: z.string().describe("Network id (e.g. base, solana, eth)"),
        address: z.string().describe("Token contract address"),
        include: z.string().optional().describe("e.g. top_pools"),
        include_composition: z.string().optional().describe("true/false"),
    }, async ({ network, address, include, include_composition }) => {
        const params = { network: network ?? "", address: address ?? "" };
        if (include)
            params.include = include;
        if (include_composition)
            params.include_composition = include_composition;
        const { status, body } = await fetchV2("/coingecko/onchain/token", params);
        return { content: [{ type: "text", text: formatToolResult(status, body) }] };
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(() => {
    process.exit(1);
});
