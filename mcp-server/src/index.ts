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
    "Trading signals: default Binance spot OHLC + technical engine; source = coinbase | okx | bybit | kraken | bitget | kucoin | upbit | cryptocom (alias crypto.com) for other venues; n8n | webhook for legacy n8n AI signal (requires N8N_WEBHOOK_URL_SIGNAL). Optional instId, bar, limit." +
      PAYMENT_NOTE,
    {
      token: z.string().optional().default("bitcoin").describe("Token name (e.g. solana, bitcoin)"),
      source: z
        .string()
        .optional()
        .describe(
          "Omit = binance. Other CEX: coinbase, okx, bybit, kraken, bitget, kucoin, upbit, cryptocom. n8n | webhook for n8n.",
        ),
      instId: z
        .string()
        .optional()
        .describe("Venue symbol override (e.g. BTCUSDT, BTC-USDT, KRW-BTC, BTC_USDT, XBTUSDT)"),
      bar: z.string().optional().describe("Candle interval e.g. 1m, 1h, 4h, 1d (venue-specific)"),
      limit: z.number().optional().describe("Candle count (venue max varies; default 200)"),
    },
    async ({ token, source, instId, bar, limit }) => {
      const params: Record<string, string> = { token: token ?? "bitcoin" };
      if (source != null && source !== "") params.source = source;
      if (instId != null && instId !== "") params.instId = instId;
      if (bar != null && bar !== "") params.bar = bar;
      if (limit != null) params.limit = String(limit);
      const { status, body } = await fetchV2("/signal", params);
      return { content: [{ type: "text" as const, text: formatToolResult(status, body) }] };
    },
  );

  // --- No-param GET endpoints ---
  const noParamTools: Array<{ name: string; path: string; description: string }> = [
    { name: "syra_v2_check_status", path: "/health", description: "Health check: verify API server status and connectivity (GET /health)." + PAYMENT_NOTE },
    { name: "syra_v2_sundown_digest", path: "/sundown-digest", description: "Get the daily sundown digest (crypto roundup)." + PAYMENT_NOTE },
    { name: "syra_v2_smart_money", path: "/smart-money", description: "Smart money tracking: net flow, holdings, DEX trades, DCA patterns." + PAYMENT_NOTE },
    { name: "syra_v2_trending_jupiter", path: "/trending-jupiter", description: "Trending tokens on Jupiter." + PAYMENT_NOTE },
    { name: "syra_v2_analytics_summary", path: "/analytics/summary", description: "Analytics summary: trending-jupiter, Nansen smart money, Binance correlation." + PAYMENT_NOTE },
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
    "Syra Brain: single-question API. Send a natural language question; Syra selects and runs relevant tools (news, sentiment, Jupiter trending, Nansen, etc.) and returns one synthesized answer. Ideal for integrating Syra chat in one call. Swap execution not supported (use agent chat for swaps)." +
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
    "syra_v2_pumpfun_agents_swap",
    "pump.fun fun-block swap (buy/sell on bonding curve or AMM). POST /pumpfun/agents/swap; returns base64 VersionedTransaction. Requires inputMint, outputMint, amount (smallest units), user (trader pubkey)." +
      PAYMENT_NOTE,
    {
      inputMint: z.string().describe("Input token mint (e.g. wrapped SOL So11111111111111111111111111111111111111112)"),
      outputMint: z.string().describe("Output token mint"),
      amount: z.string().describe("Amount in smallest units of the input mint"),
      user: z.string().describe("Trader / fee payer Solana pubkey"),
    },
    async ({ inputMint, outputMint, amount, user }) => {
      const { status, body } = await fetchPost("/pumpfun/agents/swap", {
        inputMint,
        outputMint,
        amount,
        user,
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(() => {
  process.exit(1);
});
