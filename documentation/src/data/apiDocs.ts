/**
 * API documentation content for each x402 endpoint.
 * Base URL: https://api.syraa.fun. Paid routes use unversioned paths (e.g. /news, /analytics/summary).
 * Discovery: GET /.well-known/x402, GET /openapi.json (gateway catalog), GET /mpp-openapi.json (MPP / AgentCash).
 * Implementation lives under api/routes/ and api/libs/.
 */

export interface ApiParam {
  name: string;
  type: string;
  required: string;
  description: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  params?: ApiParam[];
  bodyExample?: string;
  requestExample: string;
  responseExample: string;
}

export interface ApiDoc {
  title: string;
  overview: string;
  baseUrl: string;
  price: string;
  authNote: string;
  endpoints: ApiEndpoint[];
  paymentFlow: { step1: string; step2: string; step3: string; response402: string };
  responseCodes: { code: string; description: string }[];
  supportLink: string;
  useCases?: string[];
  extraSections?: { title: string; content: string }[];
}

const BASE_URL = "https://api.syraa.fun";
const NANSEN_BASE = "https://api.nansen.ai";
const PURCH_VAULT_BASE = "https://api.purch.xyz";
const SUPPORT = "https://t.me/ikhwanhsn";

const standard402 = (price: number) => `{
  "error": "Payment Required",
  "price": ${price},
  "currency": "USD",
  "paymentInstructions": {
    "method": "x402",
    "details": "..."
  }
}`;

const standardResponseCodes = [
  { code: "200", description: "Success — data returned" },
  { code: "402", description: "Payment Required — complete payment first" },
  { code: "5xx", description: "Server error — retry later" },
];

function doc(partial: Partial<ApiDoc> & Pick<ApiDoc, "title" | "overview" | "endpoints">): ApiDoc {
  return {
    baseUrl: BASE_URL,
    price: "$0.01 USD per request",
    authNote:
      "This API uses the x402 payment protocol. On first request without payment, you'll receive a 402 Payment Required response with payment instructions.",
    paymentFlow: {
      step1: "Initial request returns 402 with payment instructions.",
      step2: "Complete payment (process payment header, submit via specified method, receive payment proof/token).",
      step3: "Retry request with payment proof in headers to receive the data.",
      response402: standard402(0.01),
    },
    responseCodes: standardResponseCodes,
    supportLink: SUPPORT,
    ...partial,
  };
}

export const apiDocs: Record<string, ApiDoc> = {
  "x402-api-standard": doc({
    title: "x402 API Documentation Standard",
    overview:
      "This document defines the standard structure and conventions for all Syra x402 API documentation. Every paid API uses unversioned paths and requires payment via the x402 protocol before returning data. The live HTTP discovery list is `GET " + BASE_URL + "/.well-known/x402` (canonical x402 resource URLs). Many partner and automation tools are **not** in that list—they run through the agent: `GET " + BASE_URL + "/agent/tools` and `POST " + BASE_URL + "/agent/tools/call` (tool ids, agent wallet or treasury billing).",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Health check example. All x402 endpoints follow the same payment flow.",
        requestExample: `curl ${BASE_URL}/health`,
        responseExample: `{
  "ok": true,
  "status": "healthy",
  "service": "syra-api",
  "message": "API is operational and accepting requests.",
  "timestamp": "2026-04-23T12:00:00.000Z"
}`,
      },
    ],
    extraSections: [
      {
        title: "URL Conventions",
        content: "Use full URL in examples: " + BASE_URL + "/{resource} (e.g. " + BASE_URL + "/news, " + BASE_URL + "/signal?token=btc).",
      },
      {
        title: "Direct x402 vs agent tools",
        content:
          "Per-page docs below may still show example `curl` paths for EXA, crawl, browser-use, or partner APIs. If a route is not listed in `GET /.well-known/x402`, use the Syra Agent (chat) or `POST " +
          BASE_URL +
          "/agent/tools/call` with the tool id from `GET " +
          BASE_URL +
          "/agent/tools`—that is the supported path after server-side agent migration.",
      },
    ],
  }),

  health: doc({
    title: "API Health",
    overview:
      "Liveness and connectivity check for the API. Minimal-cost x402 endpoint; response includes `ok`, `status: \"healthy\"`, `service`, and `timestamp`. The legacy path `/check-status` redirects 308 to `/health`.",
    price: "$0.0001 USD per request",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Health check.",
        requestExample: `curl ${BASE_URL}/health`,
        responseExample: `{
  "ok": true,
  "status": "healthy",
  "service": "syra-api",
  "message": "API is operational and accepting requests.",
  "timestamp": "2026-04-23T12:00:00.000Z"
}`,
      },
      {
        method: "POST",
        path: "/health",
        description: "Health check via POST.",
        requestExample: `curl -X POST ${BASE_URL}/health \\
  -H "Content-Type: application/json"`,
        responseExample: `{
  "ok": true,
  "status": "healthy",
  "service": "syra-api",
  "message": "API is operational and accepting requests.",
  "timestamp": "2026-04-23T12:00:00.000Z"
}`,
      },
    ],
    paymentFlow: {
      step1: "Initial request returns 402 with payment instructions.",
      step2: "Complete payment (process payment header, submit via specified method, receive payment proof/token).",
      step3: "Retry request with payment proof in headers to receive the status.",
      response402: standard402(0.0001),
    },
    responseCodes: [
      { code: "200", description: "Success — server status returned" },
      { code: "402", description: "Payment Required — complete payment first" },
    ],
  }),

  news: doc({
    title: "News API",
    overview:
      "Get cryptocurrency news articles. Filter by ticker (e.g. BTC, ETH) or fetch general market news. Paid API using the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/news",
        description: "Fetch cryptocurrency news.",
        params: [
          { name: "ticker", type: "string", required: "No", description: "Ticker (e.g. BTC, ETH). Omit or use 'general' for all news." },
        ],
        requestExample: `# General news
curl ${BASE_URL}/news

# Specific ticker
curl "${BASE_URL}/news?ticker=BTC"`,
        responseExample: `{
  "news": [
    {
      "title": "Bitcoin Reaches New Milestone",
      "description": "Latest developments in cryptocurrency...",
      "source": "CryptoNews",
      "url": "https://example.com/article",
      "date": "2024-01-15T10:30:00Z"
    }
  ]
}`,
      },
      {
        method: "POST",
        path: "/news",
        description: "Fetch news via POST.",
        bodyExample: `{ "ticker": "ETH" }`,
        requestExample: `curl -X POST ${BASE_URL}/news \\
  -H "Content-Type: application/json" \\
  -d '{"ticker": "ETH"}'`,
        responseExample: `{
  "news": [
    {
      "title": "Ethereum Upgrade Goes Live",
      "description": "Latest developments in Ethereum...",
      "source": "CryptoNews",
      "url": "https://example.com/article",
      "date": "2024-01-15T10:30:00Z"
    }
  ]
}`,
      },
    ],
  }),

  sentiment: doc({
    title: "Sentiment API",
    overview:
      "Get market sentiment analysis for crypto assets (positive, negative, neutral percentages) over the last 30 days. Supports market-wide or ticker-specific sentiment.",
    endpoints: [
      {
        method: "GET",
        path: "/sentiment",
        description: "Fetch sentiment analysis.",
        params: [
          { name: "ticker", type: "string", required: "No", description: "Ticker (e.g. BTC, ETH) or 'general'. Default: general." },
        ],
        requestExample: `curl ${BASE_URL}/sentiment
curl "${BASE_URL}/sentiment?ticker=BTC"`,
        responseExample: `{
  "sentimentAnalysis": [
    {
      "date": "2024-01-15",
      "general": { "positive": 45, "negative": 20, "neutral": 35 }
    }
  ]
}`,
      },
      {
        method: "POST",
        path: "/sentiment",
        description: "Fetch sentiment via POST.",
        bodyExample: `{ "ticker": "ETH" }`,
        requestExample: `curl -X POST ${BASE_URL}/sentiment \\
  -H "Content-Type: application/json" \\
  -d '{"ticker": "BTC"}'`,
        responseExample: `{
  "sentimentAnalysis": [
    {
      "date": "2024-01-15",
      "general": { "positive": 45, "negative": 20, "neutral": 35 }
    }
  ]
}`,
      },
    ],
  }),

  "trending-headline": doc({
    title: "Trending Headline API",
    overview: "Get trending headlines and top stories in the crypto market. Optional ticker filter. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/trending-headline",
        description: "Fetch trending headlines.",
        params: [
          { name: "ticker", type: "string", required: "No", description: "Ticker (e.g. BTC, ETH) or 'general'. Default: general." },
        ],
        requestExample: `curl ${BASE_URL}/trending-headline
curl "${BASE_URL}/trending-headline?ticker=BTC"`,
        responseExample: `{
  "trendingHeadline": [
    {
      "title": "Bitcoin ETF Approval Sparks Rally",
      "source": "CoinDesk",
      "url": "https://example.com/article",
      "date": "2024-01-15T14:00:00Z"
    }
  ]
}`,
      },
      {
        method: "POST",
        path: "/trending-headline",
        description: "Fetch trending headlines via POST.",
        bodyExample: `{ "ticker": "ETH" }`,
        requestExample: `curl -X POST ${BASE_URL}/trending-headline \\
  -H "Content-Type: application/json" \\
  -d '{"ticker": "BTC"}'`,
        responseExample: `{
  "trendingHeadline": [
    {
      "title": "Bitcoin ETF Approval Sparks Rally",
      "source": "CoinDesk",
      "url": "https://example.com/article",
      "date": "2024-01-15T14:00:00Z"
    }
  ]
}`,
      },
    ],
  }),

  "sundown-digest": doc({
    title: "Sundown Digest API",
    overview: "Daily end-of-day summary of key crypto market events and movements. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/sundown-digest",
        description: "Fetch the sundown digest.",
        requestExample: `curl ${BASE_URL}/sundown-digest`,
        responseExample: `{
  "sundownDigest": [
    {
      "summary": "Bitcoin held above $42k; ETH staking yield steady.",
      "key_events": ["ETF flows positive", "Solana upgrade completed"],
      "highlights": ["BTC +2%", "ETH flat"]
    }
  ]
}`,
      },
    ],
  }),

  brain: doc({
    title: "Syra Brain API",
    overview:
      "Single-question API that runs Syra's AI brain: the service selects relevant tools from your question, runs them (news, sentiment, trending pools, etc.), and returns one synthesized answer. Ideal for integrating Syra chat into your app with one x402-paid request. Tools are run server-side (treasury-paid); swap execution is not supported (use agent chat with a connected wallet for swaps). Supports both GET (question in query) and POST (question in body).",
    price: "$0.05 USD per request",
    useCases: [
      "Integrate Syra Q&A into your app or bot with one API call",
      "Ask natural language questions (e.g. latest BTC news, trending pools on Solana)",
      "Get a single text answer with optional tool usage details",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/brain",
        description: "Send a natural language question as a query parameter. Syra selects tools, runs them, and returns one answer.",
        params: [
          { name: "question", type: "string", required: "Yes", description: "Natural language question (e.g. What is the latest BTC news?, Give me trending pools on Solana)." },
        ],
        requestExample: `curl "${BASE_URL}/brain?question=What%20is%20the%20latest%20BTC%20news"`,
        responseExample: `{
  "success": true,
  "response": "Here are the latest headlines affecting Bitcoin...",
  "toolUsages": [
    { "name": "Crypto news", "status": "complete" }
  ]
}`,
      },
      {
        method: "POST",
        path: "/brain",
        description: "Send a natural language question in the request body. Syra selects tools, runs them, and returns one answer.",
        params: [
          { name: "question", type: "string", required: "Yes", description: "Natural language question (e.g. What is the latest BTC news?, Give me trending pools on Solana)." },
        ],
        bodyExample: `{ "question": "What is the latest BTC news?" }`,
        requestExample: `curl -X POST ${BASE_URL}/brain \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What is the latest BTC news?"}'`,
        responseExample: `{
  "success": true,
  "response": "Here are the latest headlines affecting Bitcoin...",
  "toolUsages": [
    { "name": "Crypto news", "status": "complete" }
  ]
}`,
      },
    ],
    paymentFlow: {
      step1: "POST without payment returns 402 with payment instructions.",
      step2: "Complete payment (x402), then retry with PAYMENT-SIGNATURE (or X-Payment) header.",
      step3: "Retry POST with the same body and payment header to receive the answer.",
      response402: standard402(0.05),
    },
    responseCodes: [
      { code: "200", description: "Success — response and optional toolUsages returned" },
      { code: "400", description: "Bad Request — question is required" },
      { code: "402", description: "Payment Required — complete payment first" },
      { code: "5xx", description: "Server error — retry later" },
    ],
  }),

  "exa-search": doc({
    title: "EXA Search API",
    overview:
      "EXA AI web search. Only the search query is dynamic; options (numResults, type, contents) are fixed. Uses the x402 payment protocol. **Primary access:** Syra Agent chat or `POST " + BASE_URL + "/agent/tools/call` with tool id `exa-search` (agent wallet pays). Public `GET/POST " + BASE_URL + "/exa-search` may be disabled; use the agent path if a direct call returns 404.",
    useCases: [
      "Latest news and articles on any topic (e.g. Nvidia, crypto)",
      "Semantic web search with highlights",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/exa-search",
        description: "Run an EXA search. Only the query parameter is accepted.",
        params: [
          { name: "query", type: "string", required: "Yes", description: "Search query (e.g. latest news on Nvidia, crypto market analysis)." },
        ],
        requestExample: `curl "${BASE_URL}/exa-search?query=Latest%20news%20on%20Nvidia"`,
        responseExample: `{
  "query": "Latest news on Nvidia",
  "results": [
    { "title": "...", "url": "https://...", "score": 0.95, "highlights": ["..."] }
  ],
  "autopromptString": null
}`,
      },
      {
        method: "POST",
        path: "/exa-search",
        description: "EXA search via POST. Body must include query only.",
        bodyExample: `{ "query": "Latest news on Nvidia" }`,
        requestExample: `curl -X POST ${BASE_URL}/exa-search \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Latest news on Nvidia"}'`,
        responseExample: `{
  "query": "Latest news on Nvidia",
  "results": [ { "title": "...", "url": "https://...", "score": 0.95, "highlights": ["..."] } ],
  "autopromptString": null
}`,
      },
    ],
  }),

  "crawl": doc({
    title: "Website Crawl API",
    overview:
      "Crawl a website from a starting URL using Cloudflare Browser Rendering. Discovers pages via links/sitemaps, renders in headless browser, returns content as Markdown. Uses the x402 payment protocol. **Primary access:** `POST " + BASE_URL + "/agent/tools/call` with tool id `website-crawl` (or as listed on `GET " + BASE_URL + "/agent/tools`).",
    useCases: [
      "Summarize or research content across a site",
      "Build RAG/knowledge bases from docs or blogs",
    ],
    endpoints: [
      {
        method: "POST",
        path: "/crawl",
        description: "Start a crawl job. Polls until complete (up to ~2 min). Returns up to 50 pages with Markdown.",
        params: [],
        bodyExample: `{ "url": "https://blog.cloudflare.com/", "limit": 20, "depth": 2 }`,
        requestExample: `curl -X POST ${BASE_URL}/crawl \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://blog.cloudflare.com/","limit":20,"depth":2}'`,
        responseExample: `{
  "jobId": "...",
  "status": "completed",
  "total": 20,
  "finished": 20,
  "records": [
    { "url": "https://...", "title": "...", "markdown": "# ..." }
  ],
  "truncated": false
}`,
      },
      {
        method: "GET",
        path: "/crawl",
        description: "Same as POST; pass url, limit, depth as query parameters.",
        params: [
          { name: "url", type: "string", required: "Yes", description: "Starting URL to crawl." },
          { name: "limit", type: "number", required: "No", description: "Max pages (default 20, max 500)." },
          { name: "depth", type: "number", required: "No", description: "Max link depth (default 2)." },
        ],
        requestExample: `curl "${BASE_URL}/crawl?url=https%3A%2F%2Fblog.cloudflare.com%2F&limit=20&depth=2"`,
        responseExample: `{ "jobId": "...", "status": "completed", "records": [...] }`,
      },
    ],
  }),

  "browser-use": doc({
    title: "Browser Use API",
    overview:
      "Run a natural-language browser automation task (Browser Use Cloud) and get structured or text output. **Primary access:** `POST " + BASE_URL + "/agent/tools/call` with tool id `browser-use` (see `GET " + BASE_URL + "/agent/tools`). Public HTTP may be disabled. Requires `BROWSER_USE_API_KEY` on the server. Uses the x402 payment protocol.",
    price: "$0.08 USD per request (production list price; non-production is lower — see 402 body)",
    endpoints: [
      {
        method: "POST",
        path: "/browser-use",
        description: "Execute a task. Body: task (required), optional start_url, model (bu-mini | bu-max), maxCostUsd.",
        bodyExample: `{ "task": "What is the top post on Hacker News?", "start_url": "https://news.ycombinator.com", "model": "bu-mini" }`,
        requestExample: `curl -X POST ${BASE_URL}/browser-use \\
  -H "Content-Type: application/json" \\
  -d '{"task":"What is the top story on Hacker News?"}'`,
        responseExample: `{
  "success": true,
  "output": "...",
  "id": "...",
  "status": "stopped",
  "liveUrl": "https://...",
  "totalCostUsd": "0.02"
}`,
      },
      {
        method: "GET",
        path: "/browser-use",
        description: "Same as POST with task, start_url, model, maxCostUsd as query parameters.",
        params: [
          { name: "task", type: "string", required: "Yes", description: "Natural language task" },
          { name: "start_url", type: "string", required: "No", description: "Optional start URL" },
          { name: "model", type: "string", required: "No", description: "bu-mini (default) or bu-max" },
          { name: "maxCostUsd", type: "string", required: "No", description: "Cost cap in USD" },
        ],
        requestExample: `curl "${BASE_URL}/browser-use?task=What%20is%20the%20price%20of%20SOL%20on%20CoinGecko"`,
        responseExample: `{ "success": true, "output": "...", "id": "...", "status": "stopped" }`,
      },
    ],
    paymentFlow: {
      step1: "Initial request returns 402 with payment instructions.",
      step2: "Complete x402 payment, then retry with PAYMENT-SIGNATURE or X-Payment header.",
      step3: "Retry with the same payload and payment header to receive the result.",
      response402: standard402(0.08),
    },
  }),

  arbitrage: doc({
    title: "Arbitrage API",
    overview:
      "Single paid bundle aligned with the Syra Agent **Arbitrage experiment** page: CoinMarketCap-style top tradable assets (stablecoins skipped), live cross-venue USDT spot snapshots from public CEX streams, and ranked best buy/sell routes by gross spread (before fees, slippage, transfer, and latency — not financial advice). Uses the x402 payment protocol.",
    price: "$0.04 USD base per request (production list price $0.40; non-production lower — see 402 body)",
    useCases: [
      "Compare theoretical cross-venue spreads on majors in one call",
      "Power dashboards or agents with the same ranking as the arbitrage experiment UI",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/arbitrage",
        description: "Returns { success, data } with aggregatedAt, cmcTop, snapshots, ranked, best, runnerUp.",
        params: [
          {
            name: "limit",
            type: "integer",
            required: "No",
            description: "Number of top assets to scan (default 10, max 25).",
          },
        ],
        requestExample: `curl "${BASE_URL}/arbitrage?limit=10"`,
        responseExample: `{
  "success": true,
  "data": {
    "aggregatedAt": "2026-04-19T12:00:00.000Z",
    "cmcTop": { "source": "coinmarketcap", "fetchedAt": "...", "assets": [...] },
    "snapshots": [{ "asset": {...}, "snapshot": { "token": "bitcoin", "venues": [...], "strategy": {...} } }],
    "ranked": [{ "rank": 1, "asset": {...}, "spreadPct": 0.12, "buyAt": {...}, "sellAt": {...}, "strategyNote": "..." }],
    "best": { "asset": {...}, "spreadPct": 0.12, "buyAt": {...}, "sellAt": {...}, "strategyNote": "..." },
    "runnerUp": []
  }
}`,
      },
      {
        method: "POST",
        path: "/arbitrage",
        description: "Same as GET; optional JSON body { \"limit\": 10 }.",
        bodyExample: `{ "limit": 10 }`,
        requestExample: `curl -X POST ${BASE_URL}/arbitrage \\
  -H "Content-Type: application/json" \\
  -d '{"limit":10}'`,
        responseExample: `{ "success": true, "data": { "aggregatedAt": "...", "cmcTop": {...}, "ranked": [...], "best": {...}, "runnerUp": [...] } }`,
      },
    ],
    paymentFlow: {
      step1: "Initial request returns 402 with payment instructions.",
      step2: "Complete x402 payment, then retry with PAYMENT-SIGNATURE or X-Payment header.",
      step3: "Retry with the same URL/body and payment header to receive the bundle.",
      response402: standard402(0.04),
    },
    responseCodes: [
      { code: "200", description: "Success — bundle returned" },
      { code: "400", description: "Bad Request — invalid limit" },
      { code: "402", description: "Payment Required" },
      { code: "502", description: "Upstream error (e.g. CoinMarketCap) when CMC is configured" },
      { code: "5xx", description: "Server error — retry later" },
    ],
  }),

  quicknode: doc({
    title: "Quicknode RPC API",
    overview:
      "Proxy to Quicknode for Solana and Base: native balance, transaction status, and raw JSON-RPC. Returns 503 if `QUICKNODE_SOLANA_RPC_URL` / `QUICKNODE_BASE_RPC_URL` are not configured on the gateway. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/quicknode/balance",
        description: "Native balance for an address.",
        params: [
          { name: "chain", type: "string", required: "Yes", description: "solana | base" },
          { name: "address", type: "string", required: "Yes", description: "Wallet address (base58 Solana or 0x Base)" },
        ],
        requestExample: `curl "${BASE_URL}/quicknode/balance?chain=solana&address=<BASE58>"`,
        responseExample: `{ "chain": "solana", "address": "...", "balance": 1000000 }`,
      },
      {
        method: "GET",
        path: "/quicknode/transaction",
        description: "Transaction status. Solana: signature query param. Base: txHash query param.",
        params: [
          { name: "chain", type: "string", required: "Yes", description: "solana | base" },
          { name: "signature", type: "string", required: "No", description: "Solana transaction signature (required when chain=solana)" },
          { name: "txHash", type: "string", required: "No", description: "EVM tx hash (required when chain=base)" },
        ],
        requestExample: `curl "${BASE_URL}/quicknode/transaction?chain=solana&signature=<SIG>"`,
        responseExample: `{ "status": "confirmed", ... }`,
      },
      {
        method: "POST",
        path: "/quicknode/rpc",
        description: "Forward a JSON-RPC call to the configured Quicknode endpoint for the chain.",
        bodyExample: `{ "chain": "solana", "method": "getBalance", "params": ["<address>"] }`,
        requestExample: `curl -X POST ${BASE_URL}/quicknode/rpc \\
  -H "Content-Type: application/json" \\
  -d '{"chain":"base","method":"eth_blockNumber","params":[]}'`,
        responseExample: `{ "jsonrpc": "2.0", "id": 1, "result": "0x..." }`,
      },
    ],
  }),

  "analytics-summary": doc({
    title: "Analytics Summary API",
    overview:
      "Aggregated analytics in one paid request: Jupiter trending (Corbits), Nansen smart money (netflow, holdings, historical holdings, DEX trades, DCAs), and Binance correlation (Pearson on OHLC). Uses the x402 payment protocol.",
    price: "See x402 response for current price (typically higher than single-endpoint calls).",
    endpoints: [
      {
        method: "GET",
        path: "/analytics/summary",
        description: "Fetch analytics summary (trending Jupiter, smart money bundle, Binance correlation).",
        requestExample: `curl ${BASE_URL}/analytics/summary`,
        responseExample: `{
  "trendingJupiter": {},
  "smartMoney": {},
  "binanceCorrelation": {}
}`,
      },
      {
        method: "POST",
        path: "/analytics/summary",
        description: "Fetch analytics summary via POST.",
        requestExample: `curl -X POST ${BASE_URL}/analytics/summary \\
  -H "Content-Type: application/json"`,
        responseExample: `{
  "trendingJupiter": {},
  "smartMoney": {},
  "binanceCorrelation": {}
}`,
      },
    ],
  }),

  signal: doc({
    title: "Signal API",
    overview:
      "Trading signal from public spot OHLC candles plus a technical analysis engine (RSI, MACD, levels, action plan). If you omit `source`, the API uses **Binance** spot klines. Set `source` to another supported CEX (coinbase, okx, bybit, kraken, bitget, kucoin, upbit, cryptocom) or use `n8n` / `webhook` for the legacy n8n webhook when configured. Optional `instId`, `bar`, and `limit` tune the candle series per venue. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/signal",
        description: "Get a trading signal for a token (default exchange: Binance).",
        params: [
          { name: "token", type: "string", required: "No", description: "Token name (e.g. solana, bitcoin). Default: bitcoin." },
          {
            name: "source",
            type: "string",
            required: "No",
            description:
              "Default: binance. Other: coinbase, okx, bybit, kraken, bitget, kucoin, upbit, cryptocom (alias crypto.com → cryptocom). Legacy: n8n | webhook.",
          },
          {
            name: "instId",
            type: "string",
            required: "No",
            description: "Override pair symbol per venue (e.g. BTCUSDT, BTC-USDT, XBTUSDT, KRW-BTC, BTC_USDT).",
          },
          {
            name: "bar",
            type: "string",
            required: "No",
            description: "Candle interval (venue-specific; e.g. 1m, 15m, 1h, 4h, 1d).",
          },
          {
            name: "limit",
            type: "string",
            required: "No",
            description: "Number of candles (venue max varies; default 200).",
          },
        ],
        requestExample: `curl "${BASE_URL}/signal?token=bitcoin"
curl "${BASE_URL}/signal?token=solana&source=okx"
curl "${BASE_URL}/signal?token=bitcoin&source=n8n"`,
        responseExample: `{
  "signal": {
    "recommendation": "BUY",
    "entryPrice": 45000,
    "targets": [48000, 52000],
    "analysis": "Technical metrics from spot OHLC; RSI, MACD, levels — not financial advice.",
    "source": "binance"
  }
}`,
      },
      {
        method: "POST",
        path: "/signal",
        description: "Same as GET; JSON body accepts token, source, instId, bar, limit.",
        bodyExample: `{ "token": "solana", "source": "binance", "bar": "1h", "limit": 200 }`,
        requestExample: `curl -X POST ${BASE_URL}/signal \\
  -H "Content-Type: application/json" \\
  -d '{"token":"solana","source":"okx"}'`,
        responseExample: `{
  "signal": {
    "recommendation": "BUY",
    "entryPrice": 98.5,
    "targets": [105, 112],
    "analysis": "Technical analysis from exchange OHLC...",
    "source": "okx"
  }
}`,
      },
    ],
  }),

  event: doc({
    title: "Event API",
    overview:
      "Get upcoming and recent cryptocurrency events (conferences, launches, network upgrades). Filter by ticker or get general market events.",
    endpoints: [
      {
        method: "GET",
        path: "/event",
        description: "Fetch cryptocurrency events.",
        params: [
          { name: "ticker", type: "string", required: "No", description: "Ticker (e.g. BTC, ETH) or 'general'. Default: general." },
        ],
        requestExample: `curl ${BASE_URL}/event
curl "${BASE_URL}/event?ticker=BTC"`,
        responseExample: `{
  "event": [
    {
      "date": "2024-01-20",
      "general": [
        {
          "title": "Bitcoin Conference 2024",
          "description": "Annual Bitcoin conference",
          "location": "Miami, FL",
          "time": "09:00 AM EST"
        }
      ]
    }
  ]
}`,
      },
      {
        method: "POST",
        path: "/event",
        description: "Fetch events via POST.",
        bodyExample: `{ "ticker": "ETH" }`,
        requestExample: `curl -X POST ${BASE_URL}/event \\
  -H "Content-Type: application/json" \\
  -d '{"ticker": "BTC"}'`,
        responseExample: `{
  "event": [
    {
      "date": "2024-01-20",
      "general": [
        {
          "title": "Bitcoin Conference 2024",
          "description": "Annual Bitcoin conference",
          "location": "Miami, FL",
          "time": "09:00 AM EST"
        }
      ]
    }
  ]
}`,
      },
    ],
  }),

  "smart-money": doc({
    title: "Smart Money API (Nansen)",
    overview: "Partner API with Nansen for smart money wallet tracking and flows. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/smart-money",
        description: "Fetch smart money data.",
        requestExample: `curl ${BASE_URL}/smart-money`,
        responseExample: `{
  "data": {
    "wallets": [
      {
        "address": "0x...",
        "label": "Smart money",
        "netFlowUsd": 125000,
        "lastActivity": "2024-01-15T10:00:00Z"
      }
    ],
    "flows": []
  }
}`,
      },
    ],
  }),

  "token-god-mode": doc({
    title: "Token God Mode API (Nansen)",
    overview: "Partner API with Nansen for comprehensive token analytics. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/token-god-mode",
        description: "Fetch token god mode data.",
        requestExample: `curl ${BASE_URL}/token-god-mode`,
        responseExample: `{
  "data": {
    "token": {},
    "holders": [],
    "topHolders": [],
    "transfers": [],
    "analytics": {}
  }
}`,
      },
    ],
  }),

  "nansen-endpoints": doc({
    title: "Nansen Endpoints API",
    overview:
      "Nansen x402 API is called directly at api.nansen.ai (no Syra proxy). Use POST with JSON body. Basic tier: $0.01/call. Premium/Smart Money tier: $0.05/call. The Syra Agent invokes Nansen tools by calling api.nansen.ai with the user's agent wallet. The API Playground also calls api.nansen.ai directly; pay with your connected wallet when you get 402.",
    price: "Basic: $0.01/request; Premium/Smart Money: $0.05/request",
    endpoints: [
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/address/current-balance",
        description: "Current token holdings for a wallet or entity. GET or POST. Params: chain (required), address, entity_name, hide_spam_token, filters, pagination, order_by.",
        params: [
          { name: "chain", type: "string", required: "Yes", description: "e.g. solana, ethereum" },
          { name: "address", type: "string", required: "No", description: "Wallet address" },
        ],
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/address/current-balance?chain=solana&address=YourWallet..."`,
        responseExample: `{ "pagination": {}, "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/address/historical-balances",
        description: "Historical balances for a wallet. GET or POST.",
        params: [
          { name: "chain", type: "string", required: "Yes", description: "Chain" },
          { name: "address", type: "string", required: "No", description: "Wallet address" },
        ],
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/address/historical-balances?chain=solana&address=..."`,
        responseExample: `{ "pagination": {}, "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/perp-positions",
        description: "Profiler perp positions. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/perp-positions"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/address/transactions",
        description: "Address transactions. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/address/transactions"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/perp-trades",
        description: "Profiler perp trades. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/perp-trades"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/address/related-wallets",
        description: "Related wallets for an address. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/address/related-wallets"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/address/pnl-summary",
        description: "PnL summary for an address. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/address/pnl-summary"`,
        responseExample: `{ "data": {} }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/address/pnl",
        description: "PnL for an address. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/address/pnl"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/profiler/address/counterparties",
        description: "Address counterparties (Premium $0.05). GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/profiler/address/counterparties"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/token-screener",
        description: "Token screener. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/token-screener"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/perp-screener",
        description: "Perp screener. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/perp-screener"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/perp-leaderboard",
        description: "Perp leaderboard (Premium $0.05). GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/perp-leaderboard"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/transfers",
        description: "TGM transfers. GET or POST. Params: chain, token_address, date, filters, pagination, order_by.",
        params: [
          { name: "chain", type: "string", required: "Yes", description: "e.g. solana" },
          { name: "token_address", type: "string", required: "No", description: "Token contract address" },
        ],
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/transfers?chain=solana"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/jup-dca",
        description: "TGM Jupiter DCA. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/jup-dca"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/flow-intelligence",
        description: "TGM flow intelligence. GET or POST. Params: chain, token_address, timeframe, filters.",
        params: [
          { name: "chain", type: "string", required: "Yes", description: "e.g. solana" },
          { name: "token_address", type: "string", required: "Yes", description: "Token contract address" },
        ],
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/flow-intelligence?chain=solana&token_address=..."`,
        responseExample: `{ "data": {} }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/who-bought-sold",
        description: "TGM who bought/sold. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/who-bought-sold"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/dex-trades",
        description: "TGM DEX trades. GET or POST. Params: chain, token_address, date, filters.",
        params: [
          { name: "chain", type: "string", required: "Yes", description: "e.g. solana" },
          { name: "token_address", type: "string", required: "No", description: "Token contract address" },
        ],
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/dex-trades?chain=solana"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/flows",
        description: "TGM flows. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/flows"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/holders",
        description: "TGM holders (Premium $0.05). GET or POST. Params: chain, token_address, pagination, filters, order_by.",
        params: [
          { name: "chain", type: "string", required: "Yes", description: "e.g. solana" },
          { name: "token_address", type: "string", required: "Yes", description: "Token contract address" },
        ],
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/holders?chain=solana&token_address=..."`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/pnl-leaderboard",
        description: "TGM PnL leaderboard (Premium $0.05). GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/pnl-leaderboard"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/perp-pnl-leaderboard",
        description: "TGM perp PnL leaderboard (Premium $0.05). GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/perp-pnl-leaderboard"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/perp-positions",
        description: "TGM perp positions. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/perp-positions"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/tgm/perp-trades",
        description: "TGM perp trades. GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/tgm/perp-trades"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/smart-money/netflow",
        description: "Smart money net flow (Premium $0.05). GET or POST. Params: chains, filters, pagination, order_by.",
        params: [
          { name: "chains", type: "string", required: "No", description: "JSON array e.g. [\"solana\"]" },
          { name: "pagination", type: "string", required: "No", description: "JSON e.g. {\"page\":1,\"per_page\":25}" },
        ],
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/smart-money/netflow?chains=[\"solana\"]"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/smart-money/holdings",
        description: "Smart money holdings (Premium $0.05). GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/smart-money/holdings"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/smart-money/dex-trades",
        description: "Smart money DEX trades (Premium $0.05). GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/smart-money/dex-trades"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/smart-money/historical-holdings",
        description: "Smart money historical holdings (Premium $0.05). GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/smart-money/historical-holdings"`,
        responseExample: `{ "data": [] }`,
      },
      {
        method: "POST",
        path: "https://api.nansen.ai/api/v1/smart-money/dcas",
        description: "Smart money DCAs (Premium $0.05). GET or POST.",
        requestExample: `curl -X POST "${NANSEN_BASE}/api/v1/smart-money/dcas"`,
        responseExample: `{ "data": [] }`,
      },
    ],
    extraSections: [
      {
        title: "Pricing tiers",
        content:
          "Basic ($0.01/call): profiler current/historical balance, transactions, perp positions/trades, related wallets, PnL, token screener, perp screener, TGM transfers, jup-dca, flow-intelligence, who-bought-sold, dex-trades, flows, perp-positions, perp-trades. Premium ($0.05/call): profiler counterparties, TGM holders, pnl-leaderboard, perp-pnl-leaderboard, perp-leaderboard, smart-money netflow, holdings, dex-trades, historical-holdings, dcas.",
      },
      {
        title: "Request body (POST)",
        content:
          "For POST, send a JSON body with the same parameters expected by the Nansen API (e.g. chain, address, filters, pagination, order_by, date). Nansen API reference: https://docs.nansen.ai/getting-started/x402-payments",
      },
      {
        title: "Direct usage",
        content:
          "Call https://api.nansen.ai/api/v1/... (e.g. /api/v1/profiler/address/current-balance) with POST and a JSON body. On 402, pay with x402 (e.g. Solana wallet in the Playground, or agent wallet when using the Syra Agent). Nansen API reference: https://docs.nansen.ai/getting-started/x402-payments",
      },
    ],
  }),

  "trending-jupiter": doc({
    title: "Trending Jupiter API",
    overview: "Trending tokens on Jupiter (Solana DEX). Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/trending-jupiter",
        description: "Fetch trending Jupiter tokens.",
        requestExample: `curl ${BASE_URL}/trending-jupiter`,
        responseExample: `{
  "trending": [
    {
      "address": "TokenMintAddress...",
      "symbol": "BONK",
      "name": "Bonk",
      "volume24h": 1500000,
      "priceUsd": 0.00002
    }
  ]
}`,
      },
    ],
  }),

  "pumpfun-agents-swap": doc({
    title: "pump.fun Agents Swap API",
    overview:
      "Build a buy/sell transaction via pump.fun fun-block (bonding curve or graduated AMM). Returns a base64 VersionedTransaction for the trader to sign. Requires inputMint, outputMint, amount (smallest units), and user (trader pubkey). Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "POST",
        path: "/pumpfun/agents/swap",
        description: "Create swap transaction. JSON body fields required unless noted optional.",
        params: [
          { name: "inputMint", type: "string", required: "Yes", description: "Input token mint (e.g. wrapped SOL for buys)." },
          { name: "outputMint", type: "string", required: "Yes", description: "Output token mint." },
          { name: "amount", type: "string", required: "Yes", description: "Amount in smallest units of the input mint." },
          { name: "user", type: "string", required: "Yes", description: "Trader / fee payer Solana pubkey." },
        ],
        requestExample: `curl -X POST "${BASE_URL}/pumpfun/agents/swap" -H "Content-Type: application/json" -d '{"inputMint":"So11111111111111111111111111111111111111112","outputMint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","amount":"1000000","user":"YourWalletPubkey"}'`,
        responseExample: `{
  "transaction": "base64-encoded-versioned-transaction...",
  "pumpMintInfo": {}
}`,
      },
    ],
  }),

  "squid-route": doc({
    title: "Squid Cross-Chain Route API",
    overview:
      "Get a cross-chain route/quote from Squid Router (100+ chains). Returns the optimal route and transactionRequest for the first leg; the user signs and submits on the source chain. Requires SQUID_INTEGRATOR_ID in API env. Uses the x402 payment protocol.",
    price: "$0.02 USD per request",
    endpoints: [
      {
        method: "POST",
        path: "/squid/route",
        description: "Get cross-chain route. Body params required.",
        params: [
          { name: "fromAddress", type: "string", required: "Yes", description: "Source chain wallet address." },
          { name: "fromChain", type: "string", required: "Yes", description: "Source chain ID (e.g. 8453 Base, 42161 Arbitrum, 56 BNB)." },
          { name: "fromToken", type: "string", required: "Yes", description: "Source token contract address." },
          { name: "fromAmount", type: "string", required: "Yes", description: "Amount in smallest units." },
          { name: "toChain", type: "string", required: "Yes", description: "Destination chain ID." },
          { name: "toToken", type: "string", required: "Yes", description: "Destination token contract address." },
          { name: "toAddress", type: "string", required: "Yes", description: "Destination wallet address." },
          { name: "slippage", type: "number", required: "No", description: "Slippage tolerance percent (default 1)." },
        ],
        requestExample: `curl -X POST "${BASE_URL}/squid/route" -H "Content-Type: application/json" -d '{"fromAddress":"0x...","fromChain":"8453","fromToken":"0x...","fromAmount":"1000000","toChain":"42161","toToken":"0x...","toAddress":"0x..."}'`,
        responseExample: `{
  "route": { "transactionRequest": { "target": "0x...", "data": "0x...", "value": "0", "gasLimit": "..." }, "quoteId": "..." },
  "requestId": "uuid-from-header"
}`,
      },
    ],
  }),

  "squid-status": doc({
    title: "Squid Cross-Chain Status API",
    overview:
      "Check the status of a cross-chain transaction. Use transactionId (source chain tx hash), requestId (from route response header), fromChainId, toChainId, and optionally quoteId (from route, required for Coral V2). Uses the x402 payment protocol.",
    price: "$0.01 USD per request",
    endpoints: [
      {
        method: "GET",
        path: "/squid/status",
        description: "Get transaction status. Query params required.",
        params: [
          { name: "transactionId", type: "string", required: "Yes", description: "Source chain transaction hash." },
          { name: "requestId", type: "string", required: "Yes", description: "x-request-id from route response." },
          { name: "fromChainId", type: "string", required: "Yes", description: "Source chain ID." },
          { name: "toChainId", type: "string", required: "Yes", description: "Destination chain ID." },
          { name: "quoteId", type: "string", required: "No", description: "quoteId from route (Coral V2)." },
        ],
        requestExample: `curl "${BASE_URL}/squid/status?transactionId=0x...&requestId=...&fromChainId=8453&toChainId=42161"`,
        responseExample: `{
  "squidTransactionStatus": "success",
  "message": "..."
}`,
      },
    ],
  }),

  "rise": doc({
    title: "RISE (rise.rich) API",
    overview:
      "Read RISE markets, market details, transactions, OHLC, quotes, portfolio, borrow capacity, and build buy/sell/borrow/repay transactions on Solana. These examples are captured from live calls against public.rise.rich.",
    baseUrl: "https://public.rise.rich",
    price: "$0.01 USD per agent call (rise-* tools via /agent/tools/call). Upstream RISE is key-gated by x-api-key.",
    authNote:
      "Direct RISE calls require the x-api-key header. In Syra Agent mode, these endpoints are exposed as rise-* tools and routed server-side through POST /agent/tools/call.",
    endpoints: [
      {
        method: "GET",
        path: "/markets",
        description: "List markets (optional pagination).",
        params: [
          { name: "page", type: "number", required: "No", description: "Page number." },
          { name: "limit", type: "number", required: "No", description: "Items per page." },
        ],
        requestExample: `curl "https://public.rise.rich/markets?page=1&limit=2" -H "x-api-key: $RISE_API_KEY"`,
        responseExample: `{
  "ok": true,
  "count": 2,
  "total": 651,
  "page": 1,
  "limit": 2,
  "totalPages": 326,
  "markets": [
    {
      "rise_market_address": "2khM9v1FoJoyh5xMxocNWFSkLfgipfUtJaJQCAKrk2hg",
      "mint_token": "Bph53REQJvDyXNLWAiNpJm7R51MxzqAJHjfWdMvorise",
      "token_name": "SOLDOG",
      "token_symbol": "SOLDOG",
      "price": "0.000028217134025268698",
      "market_cap_usd": "147.52813464367208",
      "volume_h24_usd": "101.17"
    }
  ]
}`,
      },
      {
        method: "GET",
        path: "/markets/:address",
        description: "Get market details by token mint or market address.",
        params: [{ name: "address", type: "string", required: "Yes", description: "Token mint or market address." }],
        requestExample: `curl "https://public.rise.rich/markets/DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise" -H "x-api-key: $RISE_API_KEY"`,
        responseExample: `{
  "ok": true,
  "market": {
    "rise_market_address": "DCxsd9rZETcvV8KWVq2ExWhA9cbWRzBMSuSqoaLRaNFB",
    "mint_token": "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise",
    "token_name": "Up Only",
    "token_symbol": "UPONLY",
    "price": "0.0005401873654795783",
    "market_cap_usd": "111445.05967642697",
    "volume_h24_usd": "69290.30",
    "holders_count": 117,
    "creator_fee_percent": 5
  }
}`,
      },
      {
        method: "GET",
        path: "/markets/:address/transactions",
        description: "Get market transaction history.",
        params: [
          { name: "address", type: "string", required: "Yes", description: "Token mint or market address." },
          { name: "page", type: "number", required: "No", description: "Page number." },
          { name: "limit", type: "number", required: "No", description: "Items per page." },
        ],
        requestExample: `curl "https://public.rise.rich/markets/DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise/transactions?page=1&limit=3" -H "x-api-key: $RISE_API_KEY"`,
        responseExample: `{
  "ok": true,
  "page": 1,
  "limit": 3,
  "total": 0,
  "totalPages": 0,
  "count": 0,
  "transactions": []
}`,
      },
      {
        method: "GET",
        path: "/markets/:address/ohlc/:timeframe",
        description: "Get OHLC candles by timeframe.",
        params: [
          { name: "address", type: "string", required: "Yes", description: "Token mint or market address." },
          { name: "timeframe", type: "string", required: "Yes", description: "1m, 5m, 1h, 1d." },
          { name: "limit", type: "number", required: "No", description: "Max candles to return." },
        ],
        requestExample: `curl "https://public.rise.rich/markets/DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise/ohlc/1h?limit=3" -H "x-api-key: $RISE_API_KEY"`,
        responseExample: `{
  "ok": true,
  "timeframe": "1hour",
  "count": 0,
  "data": []
}`,
      },
      {
        method: "POST",
        path: "/markets/:address/quote",
        description: "Get buy/sell quote. amount must be RAW units.",
        params: [
          { name: "address", type: "string", required: "Yes", description: "Token mint or market address." },
          { name: "amount", type: "number", required: "Yes", description: "RAW units." },
          { name: "direction", type: "string", required: "Yes", description: "buy or sell." },
        ],
        bodyExample: `{ "amount": 1000000, "direction": "buy" }`,
        requestExample: `curl -X POST "https://public.rise.rich/markets/DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise/quote" -H "Content-Type: application/json" -H "x-api-key: $RISE_API_KEY" -d '{"amount":1000000,"direction":"buy"}'`,
        responseExample: `{
  "ok": true,
  "quote": {
    "direction": "buy",
    "amountIn": 1000000,
    "amountOut": 1828069412,
    "feeRate": 0.0125,
    "feeAmount": 12499,
    "amountInUsd": 0.0861,
    "amountOutUsd": 0.08502375000000001,
    "currentPrice": 0.0005401873654795783,
    "newPrice": 0.0005401879139004021
  }
}`,
      },
      {
        method: "POST",
        path: "/program/buyToken",
        description: "Build a buy transaction (not submitted). cashIn/minTokenOut are RAW units.",
        params: [
          { name: "wallet", type: "string", required: "Yes", description: "Solana wallet address." },
          { name: "market", type: "string", required: "Yes", description: "Token mint or market address." },
          { name: "cashIn", type: "number", required: "Yes", description: "RAW units of input collateral." },
          { name: "minTokenOut", type: "number", required: "Yes", description: "RAW minimum token out." },
        ],
        bodyExample: `{ "wallet": "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t", "market": "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise", "cashIn": 1000000, "minTokenOut": 1 }`,
        requestExample: `curl -X POST "https://public.rise.rich/program/buyToken" -H "Content-Type: application/json" -H "x-api-key: $RISE_API_KEY" -d '{"wallet":"53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t","market":"DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise","cashIn":1000000,"minTokenOut":1}'`,
        responseExample: `{
  "ok": true,
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQALGTwF7btiOI90GSBiFpLatQsxQpTPqS/L2I4eqLYZU9H7...",
  "addresses": {
    "mainSrc": "B5vrMa66Vu7UsadTjjffxZDZhZysWFCmr37b4jqQBCKy",
    "tokenDst": "8vcBRo8L7ddDqZVswGuLm9uUjv5Ukf9xz1N1kWoeAG6w"
  }
}`,
      },
      {
        method: "POST",
        path: "/program/sellToken",
        description: "Build a sell transaction (not submitted). tokenIn/minCashOut are RAW units.",
        params: [
          { name: "wallet", type: "string", required: "Yes", description: "Solana wallet address." },
          { name: "market", type: "string", required: "Yes", description: "Token mint or market address." },
          { name: "tokenIn", type: "number", required: "Yes", description: "RAW token amount in." },
          { name: "minCashOut", type: "number", required: "Yes", description: "RAW minimum collateral out." },
        ],
        bodyExample: `{ "wallet": "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t", "market": "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise", "tokenIn": 1000, "minCashOut": 1 }`,
        requestExample: `curl -X POST "https://public.rise.rich/program/sellToken" -H "Content-Type: application/json" -H "x-api-key: $RISE_API_KEY" -d '{"wallet":"53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t","market":"DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise","tokenIn":1000,"minCashOut":1}'`,
        responseExample: `{
  "ok": true,
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAKGDwF7btiOI90GSBiFpLatQsxQpTPqS/L2I4eqLYZU9H7...",
  "addresses": {
    "tokenSrc": "8vcBRo8L7ddDqZVswGuLm9uUjv5Ukf9xz1N1kWoeAG6w",
    "mainDst": "B5vrMa66Vu7UsadTjjffxZDZhZysWFCmr37b4jqQBCKy"
  }
}`,
      },
      {
        method: "GET",
        path: "/users/:wallet/portfolio/summary",
        description: "Get wallet portfolio summary.",
        params: [{ name: "wallet", type: "string", required: "Yes", description: "Solana wallet address." }],
        requestExample: `curl "https://public.rise.rich/users/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t/portfolio/summary" -H "x-api-key: $RISE_API_KEY"`,
        responseExample: `{
  "ok": true,
  "summary": {
    "total_value_usd": "0",
    "total_pnl_usd": "0",
    "total_transactions": 0,
    "tokens_held": 0,
    "tokens_created_count": 0
  }
}`,
      },
      {
        method: "GET",
        path: "/users/:wallet/portfolio/positions",
        description: "Get wallet positions (optional pagination).",
        params: [
          { name: "wallet", type: "string", required: "Yes", description: "Solana wallet address." },
          { name: "page", type: "number", required: "No", description: "Page number." },
          { name: "limit", type: "number", required: "No", description: "Items per page." },
        ],
        requestExample: `curl "https://public.rise.rich/users/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t/portfolio/positions?page=1&limit=5" -H "x-api-key: $RISE_API_KEY"`,
        responseExample: `{
  "ok": true,
  "total": 0,
  "page": 1,
  "limit": 5,
  "totalPages": 1,
  "results": []
}`,
      },
      {
        method: "POST",
        path: "/markets/:address/borrow/quote",
        description: "Get max borrowable and required deposit for a borrow amount.",
        params: [
          { name: "address", type: "string", required: "Yes", description: "Token mint or market address." },
          { name: "wallet", type: "string", required: "Yes", description: "Solana wallet address." },
          { name: "amountToBorrow", type: "number", required: "No", description: "Requested borrow amount in RAW units." },
        ],
        bodyExample: `{ "wallet": "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t", "amountToBorrow": 1000000 }`,
        requestExample: `curl -X POST "https://public.rise.rich/markets/DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise/borrow/quote" -H "Content-Type: application/json" -H "x-api-key: $RISE_API_KEY" -d '{"wallet":"53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t","amountToBorrow":1000000}'`,
        responseExample: `{
  "ok": true,
  "depositedTokens": "0",
  "walletBalance": "0",
  "debt": "0",
  "maxBorrowable": "0",
  "maxBorrowableUsd": "0.00",
  "requiredDeposit": "3250612455",
  "grossBorrow": "1030928"
}`,
      },
      {
        method: "POST",
        path: "/program/deposit-and-borrow",
        description: "Build deposit+borrow transaction (not submitted). borrowAmount is RAW units.",
        params: [
          { name: "wallet", type: "string", required: "Yes", description: "Solana wallet address." },
          { name: "market", type: "string", required: "Yes", description: "Token mint or market address." },
          { name: "borrowAmount", type: "number", required: "Yes", description: "Target borrow amount in RAW units." },
        ],
        bodyExample: `{ "wallet": "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t", "market": "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise", "borrowAmount": 1000000 }`,
        requestExample: `curl -X POST "https://public.rise.rich/program/deposit-and-borrow" -H "Content-Type: application/json" -H "x-api-key: $RISE_API_KEY" -d '{"wallet":"53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t","market":"DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise","borrowAmount":1000000}'`,
        responseExample: `{
  "ok": true,
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAKGjwF7btiOI90GSBiFpLatQsxQpTPqS/L2I4eqLYZU9H7...",
  "depositAmount": "3250612455",
  "borrowAmount": "1030928",
  "borrowAmountAfterFee": 1000000,
  "includedDeposit": true
}`,
      },
      {
        method: "POST",
        path: "/program/repay-and-withdraw",
        description: "Build repay+withdraw transaction. Returns 400 if no personal position exists.",
        params: [
          { name: "wallet", type: "string", required: "Yes", description: "Solana wallet address." },
          { name: "market", type: "string", required: "Yes", description: "Token mint or market address." },
          { name: "withdrawAmount", type: "number", required: "Yes", description: "RAW collateral amount to withdraw." },
        ],
        bodyExample: `{ "wallet": "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t", "market": "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise", "withdrawAmount": 1000000 }`,
        requestExample: `curl -X POST "https://public.rise.rich/program/repay-and-withdraw" -H "Content-Type: application/json" -H "x-api-key: $RISE_API_KEY" -d '{"wallet":"53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t","market":"DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise","withdrawAmount":1000000}'`,
        responseExample: `{
  "error": "Personal position not found. Please deposit tokens first."
}`,
      },
      {
        method: "GET",
        path: "/markets/stream/new",
        description: "SSE stream for newly created markets (agent helper returns usage note).",
        requestExample: `curl -N "https://public.rise.rich/markets/stream/new" -H "x-api-key: $RISE_API_KEY"`,
        responseExample: `{
  "success": true,
  "message": "SSE stream endpoint is GET /markets/stream/new. Use EventSource on the client or a dedicated stream worker."
}`,
      },
    ],
    extraSections: [
      {
        title: "Syra Agent mapping",
        content:
          "The same endpoints are available to Syra Agent through `POST /agent/tools/call` with tool ids: `rise-markets`, `rise-market`, `rise-market-transactions`, `rise-market-ohlc`, `rise-market-quote`, `rise-buy-token`, `rise-sell-token`, `rise-portfolio-summary`, `rise-portfolio-positions`, `rise-borrow-quote`, `rise-deposit-and-borrow`, `rise-repay-and-withdraw`, `rise-stream-new`.",
      },
      {
        title: "Public Up Only mirror route",
        content:
          "Syra also exposes a read-only normalized market view for landing pages: `GET /uponly-rise-market/:address` (implemented in `api/routes/uponlyRiseMarket.js`).",
      },
      {
        title: "Live sample source",
        content:
          "Examples above are captured from a live run on 2026-04-26 and stored in `api/scripts/rise-api-snapshot.json` (generated by `api/scripts/runRiseApis.js`).",
      },
    ],
  }),

  "purch-vault": doc({
    title: "Purch Vault API",
    overview:
      "Purch Vault is a marketplace for AI agent skills, knowledge bases, and personas. Search, buy, and download digital assets via x402 micropayments (USDC on Solana). Base URL: api.purch.xyz. $0.01 USDC per API call; item purchase is a separate on-chain USDC transfer.",
    baseUrl: PURCH_VAULT_BASE,
    price: "$0.01 USDC per API call (search, buy, download); item price paid on-chain when buying.",
    endpoints: [
      {
        method: "GET",
        path: "/x402/vault/search",
        description: "Search vault items (skills, knowledge, personas). Optional filters: q, category, productType, minPrice, maxPrice, cursor, limit (1–100, default 30).",
        params: [
          { name: "q", type: "string", required: "No", description: "Search query." },
          { name: "category", type: "string", required: "No", description: "Filter: marketing, development, automation, career, ios, productivity." },
          { name: "productType", type: "string", required: "No", description: "Filter: skill, knowledge, persona." },
          { name: "limit", type: "string", required: "No", description: "Items per page (default 30)." },
        ],
        requestExample: `curl "${PURCH_VAULT_BASE}/x402/vault/search?category=development&limit=5"`,
        responseExample: `{
  "items": [
    { "id": "...", "slug": "faith", "title": "Faith", "productType": "knowledge", "price": 1, "category": "development", "creator": {}, "downloads": 42 }
  ],
  "nextCursor": null
}`,
      },
      {
        method: "POST",
        path: "/x402/vault/buy",
        description: "Purchase a vault item. Body: slug (required), walletAddress (Solana payer), email. Returns purchaseId, downloadToken, serializedTransaction to sign and submit on Solana; then call download with txSignature.",
        bodyExample: `{ "slug": "faith", "walletAddress": "YourSolanaWalletPubkey", "email": "user@example.com" }`,
        requestExample: `curl -X POST "${PURCH_VAULT_BASE}/x402/vault/buy" -H "Content-Type: application/json" -d '{"slug":"faith","walletAddress":"...","email":"user@example.com"}'`,
        responseExample: `{
  "purchaseId": "...",
  "downloadToken": "...",
  "serializedTransaction": "base64...",
  "item": { "slug": "faith", "title": "Faith", "productType": "knowledge", "price": 1 },
  "payment": { "amountUsdc": "1.00", "network": "solana" }
}`,
      },
      {
        method: "GET",
        path: "/x402/vault/download/:purchaseId",
        description: "Download purchased file (ZIP). Query: downloadToken (required), txSignature (required on first download). Re-downloads need only downloadToken.",
        requestExample: `curl "${PURCH_VAULT_BASE}/x402/vault/download/<purchaseId>?downloadToken=...&txSignature=..."`,
        responseExample: "Returns application/zip file.",
      },
    ],
  }),

  "bubblemaps-maps": doc({
    title: "Bubblemaps Maps API",
    overview: "Partner API with Bubblemaps for holder distribution and map data. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/bubblemaps/maps",
        description: "Fetch Bubblemaps data.",
        requestExample: `curl ${BASE_URL}/bubblemaps/maps`,
        responseExample: `{
  "data": {
    "maps": [],
    "holderDistribution": {},
    "clusterAnalysis": {}
  }
}`,
      },
    ],
  }),

  "agent-tools-partners": doc({
    title: "Syra Agent tools: Binance, Giza, Bankr, Neynar & SIWA",
    overview:
      "Binance correlation and spot, Giza yield automation, Bankr agent prompts, Neynar Farcaster, and SIWA verification are **not** exposed as public paid URLs on api.syraa.fun. They run only through the Syra Agent: the backend executes **POST /agent/tools/call** with your session **anonymousId**, a **toolId**, and optional **params**; the server checks the agent wallet (Solana USDC) and runs the tool (or returns an error without charging). Use **GET /agent/tools** to list every tool id, price, and logical path. For a **single HTTP bundle** that still includes Binance correlation (with Jupiter trending and smart money), use **GET /analytics/summary** (x402). For **free** spot-style prices without API keys, use **GET /binance-ticker** (preview, not x402).",
    price: "Per tool — see GET /agent/tools (displayPriceUsd / priceUsd); debited from agent USDC when the call succeeds.",
    authNote:
      "Requires a Syra Agent session: **anonymousId** is tied to the connected wallet on agent.syraa.fun (or your integration). Trusted browser origins may receive injected API key for listing tools. Insufficient balance returns a JSON error without executing the paid call.",
    paymentFlow: {
      step1: "User connects a wallet on the Syra Agent and funds agent USDC for paid tools.",
      step2: "Call GET /agent/tools to discover toolId values and required params.",
      step3: "POST /agent/tools/call with { anonymousId, toolId, params? }. Success returns data; failures are JSON with success: false where applicable.",
      response402:
        "/agent/tools/call does not use HTTP 402 — balance is validated server-side. Other Syra x402 routes (e.g. /news) still return 402 when called directly without payment.",
    },
    endpoints: [
      {
        method: "GET",
        path: "/agent/tools",
        description: "List tools (id, name, description, priceUsd, path, method).",
        requestExample: `curl ${BASE_URL}/agent/tools`,
        responseExample: `{ "success": true, "tools": [ { "id": "binance-correlation", "name": "Binance correlation", "description": "...", "priceUsd": 0.01, "path": "/binance/correlation", "method": "GET" } ] }`,
      },
      {
        method: "POST",
        path: "/agent/tools/call",
        description:
          "Run one tool. Body: anonymousId (required), toolId (required), params (optional object of string values). Examples: binance-correlation, binance-ticker-24h, binance-spot-order, giza-protocols, bankr-prompt, neynar-feed, siwa-nonce.",
        bodyExample: `{ "anonymousId": "<session-id>", "toolId": "binance-correlation", "params": { "symbol": "BTCUSDT", "limit": "10" } }`,
        requestExample: `curl -X POST ${BASE_URL}/agent/tools/call \\
  -H "Content-Type: application/json" \\
  -d '{"anonymousId":"<session-id>","toolId":"binance-correlation","params":{"symbol":"BTCUSDT","limit":"10"}}'`,
        responseExample: `{ "success": true, "toolId": "binance-correlation", "data": { ... } }`,
      },
    ],
    extraSections: [
      {
        title: "Public alternatives on Syra",
        content:
          "**GET /analytics/summary** — x402 bundle including Binance correlation block. **GET /binance-ticker** — free preview (Binance ticker/price proxy). **GET /bubblemaps/maps** — Bubblemaps remains a normal x402 route.",
      },
      {
        title: "Agent catalog",
        content: "Human-readable tool list with example prompts: /docs/agent/agent-catalog (Syra Agent documentation).",
      },
    ],
  }),

  "8004": doc({
    title: "8004 Trustless Agent Registry API",
    overview:
      "Read-only API for the 8004 Trustless Agent Registry on Solana: liveness checks, integrity verification, agent discovery, leaderboard, and introspection. All endpoints support GET and POST; use x402 payment in production.",
    price: "$0.01 USD per request",
    endpoints: [
      {
        method: "GET",
        path: "/8004/stats",
        description: "Global stats: total agents, feedbacks, trust tiers.",
        requestExample: `curl ${BASE_URL}/8004/stats`,
        responseExample: `{ "total_agents": 100, "total_feedbacks": 500, ... }`,
      },
      {
        method: "POST",
        path: "/8004/stats",
        description: "Same as GET (POST supported).",
        requestExample: `curl -X POST ${BASE_URL}/8004/stats -H "Content-Type: application/json"`,
        responseExample: `{ "total_agents": 100, ... }`,
      },
      {
        method: "GET",
        path: "/8004/leaderboard",
        description: "Agent leaderboard by trust tier. Query: minTier (0-4), limit, collection.",
        params: [
          { name: "minTier", type: "number", required: "optional", description: "Min trust tier (e.g. 2 = Silver+)" },
          { name: "limit", type: "number", required: "optional", description: "Max results (default 50)" },
        ],
        requestExample: `curl "${BASE_URL}/8004/leaderboard?minTier=2&limit=20"`,
        responseExample: `[ { "asset": "...", "quality_score": 8500, ... }, ... ]`,
      },
      {
        method: "GET",
        path: "/8004/agent/:asset/liveness",
        description: "Liveness report for an agent (MCP/A2A endpoint reachability).",
        params: [{ name: "asset", type: "string", required: "required", description: "Agent asset (NFT) public key (base58)" }],
        requestExample: `curl "${BASE_URL}/8004/agent/GGQfKNpXq8HchNxecLfXi8D7xz9PDppdPAPgr5Fx4Nvd/liveness"`,
        responseExample: `{ "status": "live", "okCount": 1, "totalPinged": 1, "liveServices": [...], "deadServices": [] }`,
      },
      {
        method: "GET",
        path: "/8004/agent/:asset/integrity",
        description: "Integrity check: indexer vs on-chain consistency for an agent.",
        params: [{ name: "asset", type: "string", required: "required", description: "Agent asset public key" }],
        requestExample: `curl "${BASE_URL}/8004/agent/<ASSET>/integrity"`,
        responseExample: `{ "valid": true, "status": "valid", "trustworthy": true, "chains": { "feedback": {...}, ... } }`,
      },
      {
        method: "GET",
        path: "/8004/agents/search",
        description: "Search agents by owner, creator, collection. Query: owner, creator, collection, limit, offset.",
        params: [
          { name: "owner", type: "string", required: "optional", description: "Owner public key" },
          { name: "creator", type: "string", required: "optional", description: "Creator public key" },
          { name: "limit", type: "number", required: "optional", description: "Max results (default 20)" },
          { name: "offset", type: "number", required: "optional", description: "Offset (default 0)" },
        ],
        requestExample: `curl "${BASE_URL}/8004/agents/search?limit=10"`,
        responseExample: `[ { "asset": "...", "owner": "...", ... }, ... ]`,
      },
      {
        method: "GET",
        path: "/8004/agent-by-wallet/:wallet",
        description: "Resolve agent by operational wallet public key.",
        params: [{ name: "wallet", type: "string", required: "required", description: "Operational wallet public key (base58)" }],
        requestExample: `curl "${BASE_URL}/8004/agent-by-wallet/<WALLET>"`,
        responseExample: `{ "asset": "...", "owner": "...", ... }`,
      },
    ],
    extraSections: [
      {
        title: "Dev routes (no payment)",
        content:
          "When NODE_ENV is not production, paths under /8004/dev/ (e.g. GET /8004/dev/stats, /8004/dev/leaderboard) return the same data without x402 payment.",
      },
      {
        title: "Reference",
        content: "8004 Trustless Agent Registry: https://8004.qnt.sh/skill.md. Syra registers its agent on 8004 for discoverability and reputation.",
      },
    ],
  }),

  "preview-dashboard": {
    title: "Preview & Dashboard Endpoints (no x402)",
    overview:
      "These endpoints do not use the x402 payment protocol. They are used by the landing page, dashboard, and internal tools. API key is injected by the server for trusted origins (e.g. syraa.fun, dashboard.syraa.fun). Use the paths below; do not use deprecated /v1/regular/* paths.",
    baseUrl: BASE_URL,
    price: "Free (no payment required when called from trusted origins)",
    authNote:
      "When called from a trusted origin (syraa.fun, dashboard.syraa.fun, agent.syraa.fun, playground.syraa.fun, or localhost), the API injects the key. Do not embed API keys in client bundles.",
    endpoints: [
      {
        method: "GET",
        path: "/dashboard-summary",
        description: "Market metrics and flow chart for the landing Live Dashboard. Query: period=1H|4H|1D|1W.",
        params: [{ name: "period", type: "string", required: "No", description: "1H, 4H, 1D, or 1W (default 1D)" }],
        requestExample: `curl "${BASE_URL}/dashboard-summary?period=1D"`,
        responseExample: `{ "period": "1D", "metrics": { "volume24h": "$3.6M", "activeTraders": 8901, ... }, "flowIndex": [...], "updatedAt": "..." }`,
      },
      {
        method: "GET",
        path: "/binance-ticker",
        description: "Binance ticker prices (proxy). Same response as Binance GET /api/v3/ticker/price.",
        requestExample: `curl "${BASE_URL}/binance-ticker"`,
        responseExample: `[ { "symbol": "BTCUSDT", "price": "..." }, ... ]`,
      },
      {
        method: "GET",
        path: "/preview/news",
        description: "Free news preview (same data as x402 /news, no payment).",
        params: [{ name: "ticker", type: "string", required: "No", description: "e.g. BTC, ETH, general" }],
        requestExample: `curl "${BASE_URL}/preview/news?ticker=general"`,
        responseExample: `[ { "title": "...", "url": "...", ... }, ... ]`,
      },
      {
        method: "GET",
        path: "/preview/sentiment",
        description: "Free sentiment preview (same data as x402 /sentiment, no payment).",
        params: [{ name: "ticker", type: "string", required: "No", description: "e.g. BTC, ETH, general" }],
        requestExample: `curl "${BASE_URL}/preview/sentiment?ticker=general"`,
        responseExample: `{ "sentiment": { "data": { ... } } }`,
      },
      {
        method: "GET",
        path: "/preview/signal",
        description:
          "Free signal preview (same logic as x402 /signal, no payment). Default source is Binance when omitted.",
        params: [
          { name: "token", type: "string", required: "No", description: "e.g. bitcoin, solana (preview default: solana if omitted on server)." },
          {
            name: "source",
            type: "string",
            required: "No",
            description: "Same as /signal: default binance; other CEX or n8n|webhook.",
          },
          { name: "instId", type: "string", required: "No", description: "Optional venue symbol override." },
          { name: "bar", type: "string", required: "No", description: "Candle interval." },
          { name: "limit", type: "string", required: "No", description: "Candle count." },
        ],
        requestExample: `curl "${BASE_URL}/preview/signal?token=bitcoin"
curl "${BASE_URL}/preview/signal?token=solana&source=okx"`,
        responseExample: `{ "signal": { ... , "source": "binance" }, "token": "bitcoin" }`,
      },
    ],
    paymentFlow: {
      step1: "Not applicable — these endpoints do not require x402 payment.",
      step2: "Call with GET from a trusted origin; API key is injected by the server.",
      step3: "Response returns JSON data directly.",
      response402: "N/A",
    },
    responseCodes: [
      { code: "200", description: "Success — data returned" },
      { code: "400", description: "Bad request — check query parameters" },
      { code: "5xx", description: "Server error — retry later" },
    ],
    supportLink: SUPPORT,
    extraSections: [
      {
        title: "X (Twitter) API",
        content: "X API endpoints (/x/user, /x/feed, /x/search/recent, /x/user/:username/tweets) are x402 paid. Use the x402 payment protocol; GET and POST are supported. See the X API doc for details.",
      },
      {
        title: "Deprecated paths",
        content: "Do not use /v1/regular/*. Free paths: /dashboard-summary, /binance-ticker, /preview/news, /preview/sentiment, /preview/signal.",
      },
    ],
  },

  "x-api": doc({
    title: "X (Twitter) API",
    overview:
      "X API proxy with x402 payment. User lookup, recent tweet search, user tweets, and combined feed. Both GET (query params) and POST (JSON body) are supported for each endpoint.",
    price: "$0.01 USD per request (production); lower in non-production.",
    endpoints: [
      {
        method: "GET",
        path: "/x/user",
        description: "User lookup by username. Params: username (required). POST body: { username }.",
        requestExample: `curl "${BASE_URL}/x/user?username=syra_agent"`,
        responseExample: `{ "data": { "id": "...", "name": "...", "username": "syra_agent", "public_metrics": { ... } } }`,
      },
      {
        method: "GET",
        path: "/x/search/recent",
        description: "Search recent tweets (last 7 days). Params: query (required), max_results (10–100). POST body: { query, max_results }.",
        requestExample: `curl "${BASE_URL}/x/search/recent?query=crypto%20lang:en&max_results=10"`,
        responseExample: `{ "data": [ { "id": "...", "text": "...", "created_at": "..." }, ... ] }`,
      },
      {
        method: "GET",
        path: "/x/user/:username/tweets",
        description: "Recent tweets from a user. Path: username. Params: max_results (5–100). POST body: { max_results }.",
        requestExample: `curl "${BASE_URL}/x/user/syra_agent/tweets?max_results=10"`,
        responseExample: `{ "data": [ { "id": "...", "text": "...", "created_at": "..." }, ... ] }`,
      },
      {
        method: "GET",
        path: "/x/feed",
        description: "Profile + recent tweets in one response. Params: username (default syra_agent), max_results (3–20). POST body: { username, max_results }.",
        requestExample: `curl "${BASE_URL}/x/feed?username=syra_agent&max_results=5"`,
        responseExample: `{ "user": { ... }, "tweets": [ ... ], "updatedAt": "..." }`,
      },
    ],
    extraSections: [
      {
        title: "GET and POST",
        content: "Every endpoint supports GET (query string) and POST (JSON body). Same parameter names; first request returns 402 with payment instructions; retry with payment header to receive data.",
      },
    ],
  }),
};

const LEGACY_AGENT_PARTNER_SLUGS = new Set(["binance-correlation", "binance-spot"]);

export function getApiDoc(slug: string): ApiDoc | null {
  if (LEGACY_AGENT_PARTNER_SLUGS.has(slug)) {
    return apiDocs["agent-tools-partners"] ?? null;
  }
  return apiDocs[slug] ?? null;
}

export function getAllApiSlugs(): string[] {
  return Object.keys(apiDocs);
}
