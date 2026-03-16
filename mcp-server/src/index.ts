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
const SYRA_USE_DEV_ROUTES =
  process.env.SYRA_USE_DEV_ROUTES === "true" || process.env.SYRA_USE_DEV_ROUTES === "1";

const PAYMENT_NOTE =
  " Note: production API requires x402 payment; you may get 402 if payment is not provided.";

/** GET request to API path with optional query params. When SYRA_USE_DEV_ROUTES, appends /dev to path. */
async function fetchV2(
  path: string,
  params: Record<string, string> = {}
): Promise<{ status: number; body: string }> {
  const resolvedPath = SYRA_USE_DEV_ROUTES ? `${path}/dev` : path;
  const url = new URL(resolvedPath, SYRA_API_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

/** POST request to API path with JSON body. When SYRA_USE_DEV_ROUTES, appends /dev to path. */
async function fetchPost(path: string, bodyObj: Record<string, unknown>): Promise<{ status: number; body: string }> {
  const resolvedPath = SYRA_USE_DEV_ROUTES ? `${path}/dev` : path;
  const url = new URL(resolvedPath, SYRA_API_BASE_URL);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(bodyObj),
  });
  const body = await res.text();
  return { status: res.status, body };
}

/** 8004 API: path is /8004/... or /8004/dev/... when SYRA_USE_DEV_ROUTES (no trailing /dev from fetchV2). */
async function fetch8004(
  pathSuffix: string,
  params: Record<string, string> = {}
): Promise<{ status: number; body: string }> {
  const base = SYRA_USE_DEV_ROUTES ? "/8004/dev" : "/8004";
  const path = `${base}${pathSuffix.startsWith("/") ? pathSuffix : `/${pathSuffix}`}`;
  const url = new URL(path, SYRA_API_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

function formatToolResult(status: number, body: string): string {
  if (status === 200) return body;
  return `API returned ${status}. Body:\n${body}`;
}

async function main() {
  const server = new McpServer(
    { name: "syra-mcp-server", version: "0.2.0" },
    { capabilities: { tools: {} } },
  );

  // --- News & event (with optional dev path) ---
  server.tool(
    "syra_v2_news",
    "Fetch latest crypto news from Syra API. Optional ticker (e.g. BTC, ETH) or 'general' for all news." + PAYMENT_NOTE,
    {
      ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    },
    async ({ ticker }) => {
      const { status, body } = await fetchV2("/news", { ticker: ticker ?? "general" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_event",
    "Fetch upcoming and recent crypto events, conferences, and launches." + PAYMENT_NOTE,
    {
      ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    },
    async ({ ticker }) => {
      const { status, body } = await fetchV2("/event", { ticker: ticker ?? "general" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Ticker-based (ticker param) ---
  server.tool(
    "syra_v2_sentiment",
    "Get market sentiment analysis for crypto assets over last 30 days. Optional ticker or 'general'." + PAYMENT_NOTE,
    {
      ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    },
    async ({ ticker }) => {
      const { status, body } = await fetchV2("/sentiment", { ticker: ticker ?? "general" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_trending_headline",
    "Get trending crypto headlines. Optional ticker or 'general'." + PAYMENT_NOTE,
    {
      ticker: z.string().optional().default("general").describe("Ticker (e.g. BTC, ETH) or 'general'"),
    },
    async ({ ticker }) => {
      const { status, body } = await fetchV2("/trending-headline", { ticker: ticker ?? "general" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Signal (token param) ---
  server.tool(
    "syra_v2_signal",
    "Get AI-generated trading signals with entry/exit recommendations. Optional token name." + PAYMENT_NOTE,
    {
      token: z.string().optional().default("bitcoin").describe("Token name (e.g. solana, bitcoin)"),
    },
    async ({ token }) => {
      const { status, body } = await fetchV2("/signal", { token: token ?? "bitcoin" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- No-param GET endpoints ---
  const noParamTools: Array<{ name: string; path: string; description: string }> = [
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
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    });
  }

  // --- Syra Brain (POST: single question → tools + LLM answer) ---
  server.tool(
    "syra_v2_brain",
    "Syra Brain: single-question API. Send a natural language question; Syra selects and runs relevant tools (news, sentiment, trending pools, etc.) and returns one synthesized answer. Ideal for integrating Syra chat in one call. Swap execution not supported (use agent chat for swaps)." +
      PAYMENT_NOTE,
    {
      question: z.string().describe("Natural language question (e.g. What is the latest BTC news?, Give me trending pools on Solana)"),
    },
    async ({ question }) => {
      const { status, body } = await fetchPost("/brain", { question: question ?? "" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Query param (required or optional) ---
  server.tool(
    "syra_v2_jupiter_swap_order",
    "Get a Jupiter Ultra swap order (buy/sell token on Solana). Returns a transaction to sign and submit. Requires inputMint, outputMint, amount (smallest units), taker (wallet pubkey)." + PAYMENT_NOTE,
    {
      inputMint: z.string().describe("Input token mint address (e.g. SOL: So11111111111111111111111111111111111111112)"),
      outputMint: z.string().describe("Output token mint address (e.g. USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)"),
      amount: z.string().describe("Amount in smallest units (e.g. lamports for SOL)"),
      taker: z.string().describe("Wallet public key that will execute the swap"),
    },
    async ({ inputMint, outputMint, amount, taker }) => {
      const { status, body } = await fetchV2("/jupiter/swap/order", {
        inputMint,
        outputMint,
        amount,
        taker,
      });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_squid_route",
    "Get cross-chain route/quote from Squid Router (100+ chains). Returns route and transactionRequest for first leg; user signs on source chain. Requires fromAddress, fromChain, fromToken, fromAmount, toChain, toToken, toAddress; optional slippage (default 1)." +
      PAYMENT_NOTE,
    {
      fromAddress: z.string().describe("Source chain wallet address"),
      fromChain: z.string().describe("Source chain ID (e.g. 56 BNB, 42161 Arbitrum, 8453 Base)"),
      fromToken: z.string().describe("Source token contract address"),
      fromAmount: z.string().describe("Amount in smallest units"),
      toChain: z.string().describe("Destination chain ID"),
      toToken: z.string().describe("Destination token contract address"),
      toAddress: z.string().describe("Destination wallet address"),
      slippage: z.number().optional().default(1).describe("Slippage tolerance percent"),
    },
    async (params) => {
      const bodyObj: Record<string, unknown> = {
        fromAddress: params.fromAddress,
        fromChain: params.fromChain,
        fromToken: params.fromToken,
        fromAmount: params.fromAmount,
        toChain: params.toChain,
        toToken: params.toToken,
        toAddress: params.toAddress,
        slippage: params.slippage ?? 1,
      };
      const { status, body } = await fetchPost("/squid/route", bodyObj);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_squid_status",
    "Check status of a cross-chain transaction (Squid Router). Requires transactionId, requestId, fromChainId, toChainId; optional quoteId (required for Coral V2)." +
      PAYMENT_NOTE,
    {
      transactionId: z.string().describe("Source chain transaction hash"),
      requestId: z.string().describe("x-request-id from route response"),
      fromChainId: z.string().describe("Source chain ID"),
      toChainId: z.string().describe("Destination chain ID"),
      quoteId: z.string().optional().describe("quoteId from route response (Coral V2)"),
    },
    async ({ transactionId, requestId, fromChainId, toChainId, quoteId }) => {
      const params: Record<string, string> = {
        transactionId,
        requestId,
        fromChainId,
        toChainId,
      };
      if (quoteId != null && quoteId !== "") params.quoteId = quoteId;
      const { status, body } = await fetchV2("/squid/status", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_exa_search",
    "EXA AI web search. Only the search query is dynamic (e.g. latest news on Nvidia, crypto market analysis)." + PAYMENT_NOTE,
    {
      query: z.string().describe("Search query (e.g. latest news on Nvidia, crypto market analysis)"),
    },
    async ({ query }) => {
      const { status, body } = await fetchV2("/exa-search", { query });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Address / token address param ---
  server.tool(
    "syra_v2_token_report",
    "Get token report from Rugcheck. Requires token contract address." + PAYMENT_NOTE,
    {
      address: z.string().describe("Token contract address"),
    },
    async ({ address }) => {
      const { status, body } = await fetchV2("/token-report", { address });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_token_risk_alerts",
    "Token risk alerts: tokens from Rugcheck (new/recent/trending/verified) with risk score at or above threshold. Use from dev with SYRA_USE_DEV_ROUTES=true and SYRA_API_BASE_URL to skip payment." + PAYMENT_NOTE,
    {
      rugScoreMin: z.number().optional().default(80).describe("Minimum normalised risk score 0-100 (default 80)"),
      source: z
        .string()
        .optional()
        .default("new_tokens,recent,trending,verified")
        .describe("Comma-separated: new_tokens, recent, trending, verified (default all)"),
      limit: z.number().optional().default(20).describe("Max tokens to check 1-50 (default 20)"),
    },
    async ({ rugScoreMin, source, limit }) => {
      const params: Record<string, string> = {};
      if (rugScoreMin != null) params.rugScoreMin = String(rugScoreMin);
      if (source) params.source = source;
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/token-risk/alerts", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_token_god_mode",
    "Nansen token god mode: deep research for a token. Requires token address." + PAYMENT_NOTE,
    {
      tokenAddress: z.string().describe("Token address for research"),
    },
    async ({ tokenAddress }) => {
      const { status, body } = await fetchV2("/token-god-mode", { tokenAddress });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_bubblemaps_maps",
    "Bubblemaps holder/concentration map data for a Solana token. Requires contract address." + PAYMENT_NOTE,
    {
      address: z.string().describe("Solana token contract address"),
    },
    async ({ address }) => {
      const { status, body } = await fetchV2("/bubblemaps/maps", { address });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Binance ---
  server.tool(
    "syra_v2_binance_correlation",
    "Get Binance correlation for a symbol (top correlated assets). Optional symbol, default BTCUSDT." + PAYMENT_NOTE,
    {
      symbol: z.string().optional().default("BTCUSDT").describe("Symbol (e.g. BTCUSDT, ETHUSDT)"),
    },
    async ({ symbol }) => {
      const { status, body } = await fetchV2("/binance/correlation", { symbol: symbol ?? "BTCUSDT" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_binance_correlation_matrix",
    "Get full Binance correlation matrix. Optional symbol (API returns full matrix; symbol is ignored)." + PAYMENT_NOTE,
    {
      symbol: z.string().optional().default("").describe("Symbol (e.g. BTCUSDT); default empty, API returns full matrix"),
    },
    async ({ symbol }) => {
      const params: Record<string, string> = {};
      if (symbol) params.symbol = symbol;
      const { status, body } = await fetchV2("/binance/correlation-matrix", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Kraken market (ticker, orderbook, ohlc, trades, status, server-time) ---
  server.tool(
    "syra_v2_kraken_ticker",
    "Kraken ticker (market data, no auth). Optional pair (default BTCUSD), comma-separated for multiple." + PAYMENT_NOTE,
    {
      pair: z.string().optional().default("BTCUSD").describe("Pair(s) comma-separated (e.g. BTCUSD, ETHUSD)"),
    },
    async ({ pair }) => {
      const params: Record<string, string> = {};
      if (pair) params.pair = pair;
      const { status, body } = await fetchV2("/kraken/ticker", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_kraken_orderbook",
    "Kraken order book (market data, no auth). Optional pair (default BTCUSD), count (default 25)." + PAYMENT_NOTE,
    {
      pair: z.string().optional().default("BTCUSD").describe("Pair (e.g. BTCUSD, ETHUSD)"),
      count: z.number().optional().default(25).describe("Depth (default 25, max 500)"),
    },
    async ({ pair, count }) => {
      const params: Record<string, string> = {};
      if (pair) params.pair = pair;
      if (count != null) params.count = String(count);
      const { status, body } = await fetchV2("/kraken/orderbook", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_kraken_ohlc",
    "Kraken OHLC candles (market data, no auth). Optional pair (default BTCUSD), interval (default 60)." + PAYMENT_NOTE,
    {
      pair: z.string().optional().default("BTCUSD").describe("Pair (e.g. BTCUSD)"),
      interval: z.number().optional().default(60).describe("Interval in minutes (default 60)"),
    },
    async ({ pair, interval }) => {
      const params: Record<string, string> = {};
      if (pair) params.pair = pair;
      if (interval != null) params.interval = String(interval);
      const { status, body } = await fetchV2("/kraken/ohlc", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_kraken_trades",
    "Kraken recent trades (market data, no auth). Optional pair (default BTCUSD), count (default 100)." + PAYMENT_NOTE,
    {
      pair: z.string().optional().default("BTCUSD").describe("Pair (e.g. BTCUSD)"),
      count: z.number().optional().default(100).describe("Number of trades (default 100, max 1000)"),
    },
    async ({ pair, count }) => {
      const params: Record<string, string> = {};
      if (pair) params.pair = pair;
      if (count != null) params.count = String(count);
      const { status, body } = await fetchV2("/kraken/trades", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_kraken_status",
    "Kraken system status (market data, no auth)." + PAYMENT_NOTE,
    {},
    async () => {
      const { status, body } = await fetchV2("/kraken/status");
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_kraken_server_time",
    "Kraken server time (market data, no auth)." + PAYMENT_NOTE,
    {},
    async () => {
      const { status, body } = await fetchV2("/kraken/server-time");
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- OKX market (ticker, tickers, books, candles, trades, funding-rate, open-interest, mark-price, time) ---
  server.tool(
    "syra_v2_okx_ticker",
    "OKX ticker (market data, no auth). Optional instId (default BTC-USDT). Spot or swap (e.g. ETH-USDT-SWAP)." + PAYMENT_NOTE,
    {
      instId: z.string().optional().default("BTC-USDT").describe("Instrument ID (e.g. BTC-USDT, ETH-USDT-SWAP)"),
    },
    async ({ instId }) => {
      const params: Record<string, string> = {};
      if (instId) params.instId = instId;
      const { status, body } = await fetchV2("/okx/ticker", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_tickers",
    "OKX all tickers by instrument type. Optional instType (default SPOT)." + PAYMENT_NOTE,
    {
      instType: z.string().optional().default("SPOT").describe("SPOT, SWAP, FUTURES, OPTION, MARGIN"),
    },
    async ({ instType }) => {
      const params: Record<string, string> = {};
      if (instType) params.instType = instType;
      const { status, body } = await fetchV2("/okx/tickers", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_books",
    "OKX order book snapshot. Optional instId (default BTC-USDT), sz (depth, default 20, max 400)." + PAYMENT_NOTE,
    {
      instId: z.string().optional().default("BTC-USDT").describe("Instrument ID"),
      sz: z.number().optional().default(20).describe("Depth (default 20, max 400)"),
    },
    async ({ instId, sz }) => {
      const params: Record<string, string> = {};
      if (instId) params.instId = instId;
      if (sz != null) params.sz = String(sz);
      const { status, body } = await fetchV2("/okx/books", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_candles",
    "OKX OHLC candles. Optional instId (default BTC-USDT), bar (1m,1H,1D, etc.), limit (default 100)." + PAYMENT_NOTE,
    {
      instId: z.string().optional().default("BTC-USDT").describe("Instrument ID"),
      bar: z.string().optional().default("1H").describe("Candle interval: 1m,3m,5m,15m,30m,1H,2H,4H,6H,12H,1D,1W,1M"),
      limit: z.number().optional().default(100).describe("Candles (default 100, max 300)"),
    },
    async ({ instId, bar, limit }) => {
      const params: Record<string, string> = {};
      if (instId) params.instId = instId;
      if (bar) params.bar = bar;
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/okx/candles", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_trades",
    "OKX recent trades. Optional instId (default BTC-USDT), limit (default 100, max 500)." + PAYMENT_NOTE,
    {
      instId: z.string().optional().default("BTC-USDT").describe("Instrument ID"),
      limit: z.number().optional().default(100).describe("Trades (default 100, max 500)"),
    },
    async ({ instId, limit }) => {
      const params: Record<string, string> = {};
      if (instId) params.instId = instId;
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/okx/trades", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_funding_rate",
    "OKX funding rate for perpetual swap. Optional instId (default BTC-USDT-SWAP)." + PAYMENT_NOTE,
    {
      instId: z.string().optional().default("BTC-USDT-SWAP").describe("Perpetual swap instId"),
    },
    async ({ instId }) => {
      const params: Record<string, string> = {};
      if (instId) params.instId = instId;
      const { status, body } = await fetchV2("/okx/funding-rate", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_open_interest",
    "OKX open interest for perpetual swap. Optional instId (default BTC-USDT-SWAP)." + PAYMENT_NOTE,
    {
      instId: z.string().optional().default("BTC-USDT-SWAP").describe("Perpetual swap instId"),
    },
    async ({ instId }) => {
      const params: Record<string, string> = {};
      if (instId) params.instId = instId;
      const { status, body } = await fetchV2("/okx/open-interest", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_mark_price",
    "OKX mark price for derivatives. Optional instId (default BTC-USDT-SWAP)." + PAYMENT_NOTE,
    {
      instId: z.string().optional().default("BTC-USDT-SWAP").describe("Derivatives instId"),
    },
    async ({ instId }) => {
      const params: Record<string, string> = {};
      if (instId) params.instId = instId;
      const { status, body } = await fetchV2("/okx/mark-price", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_time",
    "OKX server time (market data, no auth)." + PAYMENT_NOTE,
    {},
    async () => {
      const { status, body } = await fetchV2("/okx/time");
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- OKX DEX / On-chain Market (token by contract address + chain) ---
  server.tool(
    "syra_v2_okx_dex_price",
    "OKX DEX: on-chain single token price by contract address and chain (e.g. solana, ethereum, base). Omit address to use default token for chain (e.g. WETH on ethereum, wrapped SOL on solana)." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token contract address (default: chain default token)"),
      chain: z.string().optional().default("ethereum").describe("Chain (ethereum, solana, base, bsc, arbitrum, xlayer)"),
    },
    async ({ address, chain }) => {
      const params: Record<string, string> = { address: address ?? "", chain: chain ?? "ethereum" };
      const { status, body } = await fetchV2("/okx/dex/price", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_prices",
    "OKX DEX: on-chain batch token prices. Omit tokens to use default token for chain." + PAYMENT_NOTE,
    {
      tokens: z.string().optional().default("").describe("Comma-separated chainIndex:address or addresses (default: chain default token)"),
      chain: z.string().optional().default("ethereum").describe("Default chain when tokens omitted or plain addresses"),
    },
    async ({ tokens, chain }) => {
      const params: Record<string, string> = { tokens: tokens ?? "", chain: chain ?? "ethereum" };
      const { status, body } = await fetchV2("/okx/dex/prices", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_kline",
    "OKX DEX: on-chain candlesticks (K-line) by token address and chain. Omit address for default token. bar default 1H, limit default 100." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token contract address (default: chain default token)"),
      chain: z.string().optional().default("ethereum").describe("Chain"),
      bar: z.string().optional().default("1H").describe("Candle interval: 1m, 1H, 1D, etc."),
      limit: z.number().optional().default(100).describe("Candles (default 100, max 299)"),
    },
    async ({ address, chain, bar, limit }) => {
      const params: Record<string, string> = { address: address ?? "", chain: chain ?? "ethereum" };
      if (bar) params.bar = bar;
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/okx/dex/kline", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_trades",
    "OKX DEX: recent on-chain DEX trades for a token. Omit address for default token. limit default 100." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token contract address (default: chain default token)"),
      chain: z.string().optional().default("ethereum").describe("Chain"),
      limit: z.number().optional().default(100).describe("Trades (default 100, max 500)"),
    },
    async ({ address, chain, limit }) => {
      const params: Record<string, string> = { address: address ?? "", chain: chain ?? "ethereum" };
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/okx/dex/trades", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_index",
    "OKX DEX: on-chain index price (aggregated) by token address and chain. Use empty address for native token." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token address; empty for native token"),
      chain: z.string().optional().default("ethereum").describe("Chain"),
    },
    async ({ address, chain }) => {
      const params: Record<string, string> = { chain: chain ?? "ethereum" };
      if (address !== undefined) params.address = address;
      const { status, body } = await fetchV2("/okx/dex/index", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_signal_chains",
    "OKX DEX: chains that support market signals (smart money / whale / KOL). Requires onchainos CLI when used from server." + PAYMENT_NOTE,
    {},
    async () => {
      const { status, body } = await fetchV2("/okx/dex/signal-chains");
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_signal_list",
    "OKX DEX: latest buy-direction signals by chain. wallet-type: 1=Smart Money, 2=KOL, 3=Whale." + PAYMENT_NOTE,
    {
      chain: z.string().optional().default("solana").describe("Chain (e.g. solana, ethereum)"),
      walletType: z.string().optional().default("").describe("Comma-separated 1,2,3 (default: all)"),
      minAmountUsd: z.string().optional().default("").describe("Minimum transaction amount in USD"),
    },
    async ({ chain, walletType, minAmountUsd }) => {
      const params: Record<string, string> = { chain: chain ?? "solana" };
      if (walletType) params.walletType = walletType;
      if (minAmountUsd) params.minAmountUsd = minAmountUsd;
      const { status, body } = await fetchV2("/okx/dex/signal-list", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_memepump_chains",
    "OKX DEX: supported chains and protocols for meme pump (e.g. pumpfun, bonkers). Requires onchainos CLI when used from server." + PAYMENT_NOTE,
    {},
    async () => {
      const { status, body } = await fetchV2("/okx/dex/memepump-chains");
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_memepump_tokens",
    "OKX DEX: list meme pump tokens by chain and stage (NEW, MIGRATING, MIGRATED)." + PAYMENT_NOTE,
    {
      chain: z.string().optional().default("solana").describe("Chain"),
      stage: z.enum(["NEW", "MIGRATING", "MIGRATED"]).optional().default("NEW").describe("Token stage (default NEW)"),
    },
    async ({ chain, stage }) => {
      const params: Record<string, string> = { chain: chain ?? "solana", stage };
      const { status, body } = await fetchV2("/okx/dex/memepump-tokens", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_memepump_token_details",
    "OKX DEX: detailed meme pump token info and audit tags. Omit address for default token (e.g. wrapped SOL on solana)." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token contract address (default: chain default token)"),
      chain: z.string().optional().default("solana").describe("Chain"),
    },
    async ({ address, chain }) => {
      const params: Record<string, string> = { address: address ?? "", chain: chain ?? "solana" };
      const { status, body } = await fetchV2("/okx/dex/memepump-token-details", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_memepump_token_dev_info",
    "OKX DEX: developer reputation and holding info for a meme token. Omit address for default token." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token contract address (default: chain default token)"),
      chain: z.string().optional().default("solana").describe("Chain"),
    },
    async ({ address, chain }) => {
      const params: Record<string, string> = { address: address ?? "", chain: chain ?? "solana" };
      const { status, body } = await fetchV2("/okx/dex/memepump-token-dev-info", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_memepump_similar_tokens",
    "OKX DEX: similar tokens by same creator. Omit address for default token." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token contract address (default: chain default token)"),
      chain: z.string().optional().default("solana").describe("Chain"),
    },
    async ({ address, chain }) => {
      const params: Record<string, string> = { address: address ?? "", chain: chain ?? "solana" };
      const { status, body } = await fetchV2("/okx/dex/memepump-similar-tokens", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_memepump_token_bundle_info",
    "OKX DEX: bundle/sniper analysis for a meme token. Omit address for default token." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token contract address (default: chain default token)"),
      chain: z.string().optional().default("solana").describe("Chain"),
    },
    async ({ address, chain }) => {
      const params: Record<string, string> = { address: address ?? "", chain: chain ?? "solana" };
      const { status, body } = await fetchV2("/okx/dex/memepump-token-bundle-info", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_okx_dex_memepump_aped_wallet",
    "OKX DEX: aped (same-car) wallet list for a token. Omit address for default token." + PAYMENT_NOTE,
    {
      address: z.string().optional().default("").describe("Token contract address (default: chain default token)"),
      chain: z.string().optional().default("solana").describe("Chain"),
      wallet: z.string().optional().default("").describe("Wallet address to highlight in list"),
    },
    async ({ address, chain, wallet }) => {
      const params: Record<string, string> = { address: address ?? "", chain: chain ?? "solana" };
      if (wallet) params.wallet = wallet;
      const { status, body } = await fetchV2("/okx/dex/memepump-aped-wallet", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- CoinGecko x402 simple price & onchain token price ---
  server.tool(
    "syra_v2_coingecko_simple_price",
    "CoinGecko x402: USD price and market data for coins by symbol (e.g. btc,eth,sol) or CoinGecko id (e.g. bitcoin,ethereum). Provide either symbols or ids." + PAYMENT_NOTE,
    {
      symbols: z.string().optional().describe("Comma-separated symbols (e.g. btc,eth,sol)"),
      ids: z
        .string()
        .optional()
        .default("bitcoin")
        .describe("Comma-separated CoinGecko ids (e.g. bitcoin,ethereum,solana); default bitcoin when neither symbols nor ids provided"),
      vs_currencies: z.string().optional().default("usd").describe("e.g. usd"),
      include_market_cap: z.string().optional().describe("true/false"),
      include_24hr_vol: z.string().optional().describe("true/false"),
      include_24hr_change: z.string().optional().describe("true/false"),
    },
    async ({ symbols, ids, vs_currencies, include_market_cap, include_24hr_vol, include_24hr_change }) => {
      const params: Record<string, string> = { vs_currencies: vs_currencies ?? "usd" };
      if (symbols) params.symbols = symbols;
      if (ids) params.ids = ids;
      // API requires either symbols or ids; schema default is bitcoin when both omitted
      if (!params.symbols && !params.ids) params.ids = ids ?? "bitcoin";
      if (include_market_cap) params.include_market_cap = include_market_cap;
      if (include_24hr_vol) params.include_24hr_vol = include_24hr_vol;
      if (include_24hr_change) params.include_24hr_change = include_24hr_change;
      const { status, body } = await fetchV2("/coingecko/simple-price", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_coingecko_onchain_token_price",
    "CoinGecko x402: token price(s) by contract address on a network. Supports multiple addresses comma-separated. Requires address; network defaults to base." + PAYMENT_NOTE,
    {
      network: z.string().optional().default("base").describe("Network id (e.g. base, solana, eth); default base"),
      address: z.string().describe("Token contract address (comma-separated for multiple)"),
      include_market_cap: z.string().optional().describe("true/false"),
      include_24hr_vol: z.string().optional().describe("true/false"),
      include_24hr_price_change: z.string().optional().describe("true/false"),
    },
    async ({ network, address, include_market_cap, include_24hr_vol, include_24hr_price_change }) => {
      const params: Record<string, string> = { network: network ?? "base", address: address ?? "" };
      if (include_market_cap) params.include_market_cap = include_market_cap;
      if (include_24hr_vol) params.include_24hr_vol = include_24hr_vol;
      if (include_24hr_price_change) params.include_24hr_price_change = include_24hr_price_change;
      const { status, body } = await fetchV2("/coingecko/onchain/token-price", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- CoinGecko x402 onchain ---
  server.tool(
    "syra_v2_coingecko_search_pools",
    "CoinGecko x402: search pools and tokens by name, symbol, or contract address on a network (e.g. solana, base)." + PAYMENT_NOTE,
    {
      query: z.string().describe("Search query (name, symbol, or contract address)"),
      network: z.string().optional().default("solana").describe("Network id (e.g. solana, base)"),
      page: z.string().optional().describe("Page number"),
      include: z.string().optional().describe("Comma-separated: base_token, quote_token, dex"),
    },
    async ({ query, network, page, include }) => {
      const params: Record<string, string> = { query: query ?? "", network: network ?? "solana" };
      if (page) params.page = page;
      if (include) params.include = include;
      const { status, body } = await fetchV2("/coingecko/onchain/search-pools", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_coingecko_trending_pools",
    "CoinGecko x402: trending pools and tokens by network (e.g. base, solana). Optional duration (e.g. 5m)." + PAYMENT_NOTE,
    {
      network: z.string().optional().default("base").describe("Network id (e.g. base, solana)"),
      duration: z.string().optional().default("5m").describe("Duration (e.g. 5m)"),
      page: z.string().optional().describe("Page number"),
      include_gt_community_data: z.string().optional().describe("Include community data (true/false)"),
      include: z.string().optional().describe("Comma-separated fields"),
    },
    async ({ network, duration, page, include_gt_community_data, include }) => {
      const params: Record<string, string> = { network: network ?? "base", duration: duration ?? "5m" };
      if (page) params.page = page;
      if (include_gt_community_data) params.include_gt_community_data = include_gt_community_data;
      if (include) params.include = include;
      const { status, body } = await fetchV2("/coingecko/onchain/trending-pools", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_coingecko_onchain_token",
    "CoinGecko x402: token data by contract address on a network (price, liquidity, top pools). Requires address; network defaults to base." + PAYMENT_NOTE,
    {
      network: z.string().optional().default("base").describe("Network id (e.g. base, solana, eth); default base"),
      address: z.string().describe("Token contract address"),
      include: z.string().optional().describe("e.g. top_pools"),
      include_composition: z.string().optional().describe("true/false"),
    },
    async ({ network, address, include, include_composition }) => {
      const params: Record<string, string> = { network: network ?? "base", address: address ?? "" };
      if (include) params.include = include;
      if (include_composition) params.include_composition = include_composition;
      const { status, body } = await fetchV2("/coingecko/onchain/token", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- CoinMarketCap x402 (single proxy: endpoint + params; all params have defaults for easy testing) ---
  server.tool(
    "syra_v2_coinmarketcap",
    "CoinMarketCap x402: cryptocurrency quotes latest, listing latest, DEX pairs quotes, DEX search, or MCP. Set endpoint to one of: quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp. All params have defaults so you can call with no args to get Bitcoin quote." + PAYMENT_NOTE,
    {
      endpoint: z
        .string()
        .optional()
        .default("quotes-latest")
        .describe("One of: quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp"),
      id: z.string().optional().default("1").describe("CMC id (default 1 = Bitcoin) for quotes/listing"),
      slug: z.string().optional().default("").describe("Slug for quotes/listing (e.g. bitcoin)"),
      symbol: z.string().optional().default("").describe("Symbol(s) for quotes/listing (e.g. BTC,ETH)"),
      start: z.string().optional().default("1").describe("Start rank for listing (default 1)"),
      limit: z.string().optional().default("10").describe("Limit for listing (default 10)"),
      convert: z.string().optional().default("USD").describe("Convert to (default USD)"),
      q: z.string().optional().default("pepe").describe("Search query for dex-search (default pepe)"),
      chain_id: z.string().optional().default("8453").describe("Chain id for DEX (default 8453 = Base)"),
      pair_address: z.string().optional().default("").describe("Pair address for DEX pairs quotes"),
    },
    async ({
      endpoint,
      id,
      slug,
      symbol,
      start,
      limit,
      convert,
      q,
      chain_id,
      pair_address,
    }) => {
      const params: Record<string, string> = { endpoint: endpoint ?? "quotes-latest" };
      if (id != null && id !== "") params.id = id;
      if (slug != null && slug !== "") params.slug = slug;
      if (symbol != null && symbol !== "") params.symbol = symbol;
      if (start != null && start !== "") params.start = start;
      if (limit != null && limit !== "") params.limit = limit;
      if (convert != null && convert !== "") params.convert = convert;
      if (q != null && q !== "") params.q = q;
      if (chain_id != null && chain_id !== "") params.chain_id = chain_id;
      if (pair_address != null && pair_address !== "") params.pair_address = pair_address;
      const { status, body } = await fetchV2("/coinmarketcap", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Messari x402 ---
  server.tool(
    "syra_v2_messari_ai",
    "Messari AI chat: ask any crypto research question powered by Messari data." + PAYMENT_NOTE,
    {
      question: z.string().describe("Natural language question (e.g. What is the latest on Bitcoin?)"),
    },
    async ({ question }) => {
      const { status, body } = await fetchV2("/messari/ai", { question });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_assets_details",
    "Messari asset details: detailed profiles by slug — sector, category, description." + PAYMENT_NOTE,
    {
      slugs: z.string().describe("Comma-separated asset slugs (e.g. bitcoin,ethereum)"),
    },
    async ({ slugs }) => {
      const { status, body } = await fetchV2("/messari/assets/details", { slugs });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_ath",
    "Messari all-time highs: ATH price, date, and drawdown for assets." + PAYMENT_NOTE,
    {
      slugs: z.string().describe("Comma-separated asset slugs (e.g. bitcoin,ethereum,solana)"),
    },
    async ({ slugs }) => {
      const { status, body } = await fetchV2("/messari/ath", { slugs });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_roi",
    "Messari ROI: return on investment across time-frames." + PAYMENT_NOTE,
    {
      slugs: z.string().describe("Comma-separated asset slugs (e.g. bitcoin,ethereum)"),
    },
    async ({ slugs }) => {
      const { status, body } = await fetchV2("/messari/roi", { slugs });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_timeseries",
    "Messari timeseries: historical data for asset metrics (price, volume, etc.)." + PAYMENT_NOTE,
    {
      assetId: z.string().describe("Asset ID or slug (e.g. bitcoin)"),
      datasetSlug: z.string().describe("Dataset slug (e.g. price, volume)"),
      granularity: z.string().optional().default("1d").describe("5m, 15m, 1h, 1d"),
      start: z.string().optional().default("").describe("ISO date start"),
      end: z.string().optional().default("").describe("ISO date end"),
    },
    async ({ assetId, datasetSlug, granularity, start, end }) => {
      const params: Record<string, string> = { assetId, datasetSlug };
      if (granularity) params.granularity = granularity;
      if (start) params.start = start;
      if (end) params.end = end;
      const { status, body } = await fetchV2("/messari/timeseries", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_signal",
    "Messari signal: real-time social intelligence and sentiment." + PAYMENT_NOTE,
    {
      limit: z.number().optional().default(20).describe("Max results"),
    },
    async ({ limit }) => {
      const params: Record<string, string> = {};
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/messari/signal", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_mindshare_gainers",
    "Messari mindshare gainers: assets gaining the most social mindshare." + PAYMENT_NOTE,
    {
      period: z.string().optional().default("24h").describe("24h or 7d"),
    },
    async ({ period }) => {
      const { status, body } = await fetchV2("/messari/mindshare-gainers", { period: period ?? "24h" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_mindshare_losers",
    "Messari mindshare losers: assets losing the most social mindshare." + PAYMENT_NOTE,
    {
      period: z.string().optional().default("24h").describe("24h or 7d"),
    },
    async ({ period }) => {
      const { status, body } = await fetchV2("/messari/mindshare-losers", { period: period ?? "24h" });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_news",
    "Messari news: latest news and research articles." + PAYMENT_NOTE,
    {
      assetSlugs: z.string().optional().default("").describe("Filter by asset slugs (e.g. bitcoin,solana)"),
      limit: z.number().optional().default(10).describe("Max results"),
    },
    async ({ assetSlugs, limit }) => {
      const params: Record<string, string> = {};
      if (assetSlugs) params.assetSlugs = assetSlugs;
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/messari/news", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_token_unlocks",
    "Messari token unlocks: upcoming and past unlock events for an asset." + PAYMENT_NOTE,
    {
      assetId: z.string().describe("Messari asset ID (e.g. arbitrum)"),
    },
    async ({ assetId }) => {
      const { status, body } = await fetchV2("/messari/token-unlocks", { assetId });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_token_unlocks_vesting",
    "Messari vesting schedule: full allocation breakdown for an asset." + PAYMENT_NOTE,
    {
      assetId: z.string().describe("Messari asset ID (e.g. arbitrum)"),
    },
    async ({ assetId }) => {
      const { status, body } = await fetchV2("/messari/token-unlocks/vesting", { assetId });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_fundraising",
    "Messari fundraising: recent crypto fundraising rounds." + PAYMENT_NOTE,
    {
      limit: z.number().optional().default(10).describe("Max results"),
      roundTypes: z.string().optional().default("").describe("seed, series-a, series-b, etc."),
    },
    async ({ limit, roundTypes }) => {
      const params: Record<string, string> = {};
      if (limit != null) params.limit = String(limit);
      if (roundTypes) params.roundTypes = roundTypes;
      const { status, body } = await fetchV2("/messari/fundraising", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_fundraising_investors",
    "Messari fundraising investors: top crypto investors and their investments." + PAYMENT_NOTE,
    {
      limit: z.number().optional().default(10).describe("Max results"),
    },
    async ({ limit }) => {
      const params: Record<string, string> = {};
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/messari/fundraising/investors", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_stablecoins",
    "Messari stablecoins: market overview and supply data." + PAYMENT_NOTE,
    {
      limit: z.number().optional().default(20).describe("Max results"),
    },
    async ({ limit }) => {
      const params: Record<string, string> = {};
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/messari/stablecoins", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_networks",
    "Messari networks: chain metrics and rankings." + PAYMENT_NOTE,
    {
      limit: z.number().optional().default(20).describe("Max results"),
    },
    async ({ limit }) => {
      const params: Record<string, string> = {};
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/messari/networks", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_messari_x_users",
    "Messari X-users: influential crypto accounts on X/Twitter." + PAYMENT_NOTE,
    {
      limit: z.number().optional().default(20).describe("Max results"),
    },
    async ({ limit }) => {
      const params: Record<string, string> = {};
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/messari/x-users", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- 8004 Trustless Agent Registry (Solana) ---
  server.tool(
    "syra_v2_8004_stats",
    "8004 global stats: total agents, feedbacks, trust tiers." + PAYMENT_NOTE,
    {},
    async () => {
      const { status, body } = await fetch8004("/stats");
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_8004_leaderboard",
    "8004 leaderboard by trust tier. Optional minTier (0-4), limit, collection." + PAYMENT_NOTE,
    {
      minTier: z.number().optional().describe("Min trust tier (0-4, e.g. 2 = Silver+)"),
      limit: z.number().optional().default(20).describe("Max results"),
    },
    async ({ minTier, limit }) => {
      const params: Record<string, string> = {};
      if (minTier != null) params.minTier = String(minTier);
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetch8004("/leaderboard", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_8004_agents_search",
    "8004 search agents by owner, creator, collection. Optional limit, offset." + PAYMENT_NOTE,
    {
      owner: z.string().optional().describe("Owner public key"),
      creator: z.string().optional().describe("Creator public key"),
      collection: z.string().optional().describe("Collection public key"),
      limit: z.number().optional().default(20).describe("Max results"),
      offset: z.number().optional().default(0).describe("Offset"),
    },
    async ({ owner, creator, collection, limit, offset }) => {
      const params: Record<string, string> = {};
      if (owner) params.owner = owner;
      if (creator) params.creator = creator;
      if (collection) params.collection = collection;
      if (limit != null) params.limit = String(limit);
      if (offset != null) params.offset = String(offset);
      const { status, body } = await fetch8004("/agents/search", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_8004_agent_liveness",
    "8004 liveness check for an agent: reachability of MCP/A2A endpoints. Requires agent asset (NFT) public key." + PAYMENT_NOTE,
    {
      asset: z.string().describe("Agent asset (NFT) public key (base58)"),
    },
    async ({ asset }) => {
      const { status, body } = await fetch8004(`/agent/${asset}/liveness`);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_8004_agent_integrity",
    "8004 integrity check for an agent: indexer vs on-chain consistency. Requires agent asset public key." + PAYMENT_NOTE,
    {
      asset: z.string().describe("Agent asset (NFT) public key (base58)"),
    },
    async ({ asset }) => {
      const { status, body } = await fetch8004(`/agent/${asset}/integrity`);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_8004_agent_by_wallet",
    "8004 resolve agent by operational wallet public key." + PAYMENT_NOTE,
    {
      wallet: z.string().describe("Operational wallet public key (base58)"),
    },
    async ({ wallet }) => {
      const { status, body } = await fetch8004(`/agent-by-wallet/${wallet}`);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Quicknode RPC (balance, transaction status, raw RPC) ---
  server.tool(
    "syra_v2_quicknode_balance",
    "Quicknode: get native balance for a wallet on Solana or Base. chain (solana|base) and address required." + PAYMENT_NOTE,
    {
      chain: z.enum(["solana", "base"]).describe("Chain: solana or base"),
      address: z.string().describe("Wallet address (base58 for Solana, 0x for Base)"),
    },
    async ({ chain, address }) => {
      const { status, body } = await fetchV2("/quicknode/balance", { chain, address });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_quicknode_transaction",
    "Quicknode: get transaction status on Solana (signature) or Base (txHash). chain and signature or txHash required." + PAYMENT_NOTE,
    {
      chain: z.enum(["solana", "base"]).describe("Chain: solana or base"),
      signature: z.string().optional().describe("Solana transaction signature (required when chain=solana)"),
      txHash: z.string().optional().describe("EVM transaction hash 0x... (required when chain=base)"),
    },
    async ({ chain, signature, txHash }) => {
      const params: Record<string, string> = { chain };
      if (signature) params.signature = signature;
      if (txHash) params.txHash = txHash;
      const { status, body } = await fetchV2("/quicknode/transaction", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_quicknode_rpc",
    "Quicknode: forward a raw JSON-RPC request (chain: solana or base; method and params in body)." + PAYMENT_NOTE,
    {
      chain: z.enum(["solana", "base"]).describe("Chain: solana or base"),
      method: z.string().describe("JSON-RPC method (e.g. getBalance, eth_blockNumber)"),
      params: z.string().optional().describe("JSON array of params as string, e.g. '[\\\"address\\\"]'"),
    },
    async ({ chain, method, params }) => {
      const bodyObj: { chain: string; method: string; params?: unknown; id?: number } = { chain, method };
      if (params != null && params !== "") {
        try {
          bodyObj.params = JSON.parse(params) as unknown[];
        } catch {
          bodyObj.params = [];
        }
      } else {
        bodyObj.params = [];
      }
      const { status, body } = await fetchPost("/quicknode/rpc", bodyObj);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- Bankr (agent prompts, job status, balances) ---
  server.tool(
    "syra_v2_bankr_balances",
    "Bankr: wallet balances across chains. Optional chains query (e.g. base,solana). Requires BANKR_API_KEY in API." + PAYMENT_NOTE,
    {
      chains: z.string().optional().describe("Comma-separated: base, polygon, mainnet, unichain, solana"),
    },
    async ({ chains }) => {
      const params: Record<string, string> = {};
      if (chains) params.chains = chains;
      const { status, body } = await fetchV2("/bankr/balances", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_bankr_prompt",
    "Bankr: submit a natural language prompt to the Bankr agent. Returns jobId and threadId; poll syra_v2_bankr_job for result." + PAYMENT_NOTE,
    {
      prompt: z.string().describe("Natural language prompt (e.g. What is my ETH balance?)"),
      threadId: z.string().optional().describe("Optional thread ID to continue conversation"),
    },
    async ({ prompt, threadId }) => {
      const bodyObj: { prompt: string; threadId?: string } = { prompt };
      if (threadId) bodyObj.threadId = threadId;
      const { status, body } = await fetchPost("/bankr/prompt", bodyObj);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_bankr_job",
    "Bankr: get job status and result. Use jobId from syra_v2_bankr_prompt. Poll until status is completed, failed, or cancelled." + PAYMENT_NOTE,
    {
      jobId: z.string().describe("Bankr job ID (e.g. job_abc123)"),
    },
    async ({ jobId }) => {
      const path = `/bankr/job/${encodeURIComponent(jobId)}`;
      const url = new URL(SYRA_USE_DEV_ROUTES ? `${path}/dev` : path, SYRA_API_BASE_URL);
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const body = await res.text();
      return { content: [{ type: "text" as const, text: formatToolResult(res.status, body) }] };
    },
  );

  server.tool(
    "syra_v2_bankr_job_cancel",
    "Bankr: cancel a pending or processing job." + PAYMENT_NOTE,
    {
      jobId: z.string().describe("Bankr job ID to cancel"),
    },
    async ({ jobId }) => {
      const path = `/bankr/job/${encodeURIComponent(jobId)}/cancel`;
      const url = new URL(SYRA_USE_DEV_ROUTES ? `${path}/dev` : path, SYRA_API_BASE_URL);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: "{}",
      });
      const body = await res.text();
      return { content: [{ type: "text" as const, text: formatToolResult(res.status, body) }] };
    },
  );

  // --- Neynar Farcaster API ---
  server.tool(
    "syra_v2_neynar_user",
    "Neynar: Farcaster user by username or by FIDs (query: username or fids)." + PAYMENT_NOTE,
    {
      username: z.string().optional().describe("Farcaster username (e.g. dwr.eth)"),
      fids: z.string().optional().describe("Comma-separated FIDs (e.g. 1,2,3)"),
    },
    async ({ username, fids }) => {
      const params: Record<string, string> = {};
      if (username) params.username = username;
      if (fids) params.fids = fids;
      const { status, body } = await fetchV2("/neynar/user", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_neynar_feed",
    "Neynar: Farcaster feed (feed_type, fid, channel_id, limit, cursor)." + PAYMENT_NOTE,
    {
      feed_type: z.string().optional().describe("e.g. following, channel, trending"),
      fid: z.number().optional().describe("User FID for user feed"),
      channel_id: z.string().optional().describe("Channel ID"),
      limit: z.number().optional().default(25),
      cursor: z.string().optional(),
    },
    async ({ feed_type, fid, channel_id, limit, cursor }) => {
      const params: Record<string, string> = {};
      if (feed_type) params.feed_type = feed_type;
      if (fid != null) params.fid = String(fid);
      if (channel_id) params.channel_id = channel_id;
      if (limit != null) params.limit = String(limit);
      if (cursor) params.cursor = cursor;
      const { status, body } = await fetchV2("/neynar/feed", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_neynar_cast",
    "Neynar: get single Farcaster cast by hash or URL (identifier)." + PAYMENT_NOTE,
    { identifier: z.string().describe("Cast hash or Warpcast URL") },
    async ({ identifier }) => {
      const { status, body } = await fetchV2("/neynar/cast", { identifier });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_neynar_search",
    "Neynar: search Farcaster casts. q required." + PAYMENT_NOTE,
    {
      q: z.string().describe("Search query"),
      limit: z.number().optional().default(20),
      channel_id: z.string().optional(),
    },
    async ({ q, limit, channel_id }) => {
      const params: Record<string, string> = { q };
      if (limit != null) params.limit = String(limit);
      if (channel_id) params.channel_id = channel_id;
      const { status, body } = await fetchV2("/neynar/search", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- SIWA Sign-In With Agent ---
  server.tool(
    "syra_v2_siwa_nonce",
    "SIWA: get nonce for Sign-In With Agent (body: address, agentId, agentRegistry?)." + PAYMENT_NOTE,
    {
      address: z.string().describe("Ethereum address (0x...)"),
      agentId: z.number().describe("ERC-8004 agent ID"),
      agentRegistry: z.string().optional().describe("Agent registry (e.g. eip155:1:0x...)"),
    },
    async ({ address, agentId, agentRegistry }) => {
      const bodyObj: { address: string; agentId: number; agentRegistry?: string } = { address, agentId };
      if (agentRegistry) bodyObj.agentRegistry = agentRegistry;
      const { status, body } = await fetchPost("/siwa/nonce", bodyObj);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  server.tool(
    "syra_v2_siwa_verify",
    "SIWA: verify signed message (body: message, signature). Returns valid, agentId, receipt." + PAYMENT_NOTE,
    {
      message: z.string().describe("SIWA message that was signed"),
      signature: z.string().describe("Signature (hex)"),
    },
    async ({ message, signature }) => {
      const { status, body } = await fetchPost("/siwa/verify", { message, signature });
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(() => {
  process.exit(1);
});
