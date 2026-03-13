/**
 * API documentation content for each x402 endpoint.
 * Base URL: https://api.syraa.fun. All x402 endpoints use unversioned paths (e.g. /news, /analytics/summary).
 * The API is implemented under api/routes/ and api/libs/ (refactored from the previous v2 folder structure).
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
      "This document defines the standard structure and conventions for all Syra x402 API documentation. Every paid API uses unversioned paths and requires payment via the x402 protocol before returning data.",
    endpoints: [
      {
        method: "GET",
        path: "/check-status",
        description: "Health check example. All x402 endpoints follow the same payment flow.",
        requestExample: `curl ${BASE_URL}/check-status`,
        responseExample: `{
  "status": "ok",
  "message": "Check status server is running"
}`,
      },
    ],
    extraSections: [
      {
        title: "URL Conventions",
        content: "Use full URL in examples: " + BASE_URL + "/{resource} (e.g. " + BASE_URL + "/news, " + BASE_URL + "/signal?token=btc).",
      },
    ],
  }),

  "check-status": doc({
    title: "Check Status API",
    overview:
      "Health check for the API server. Verifies that the API is running and reachable. Minimal-cost endpoint using the x402 payment protocol.",
    price: "$0.0001 USD per request",
    endpoints: [
      {
        method: "GET",
        path: "/check-status",
        description: "Health check.",
        requestExample: `curl ${BASE_URL}/check-status`,
        responseExample: `{
  "status": "ok",
  "message": "Check status server is running"
}`,
      },
      {
        method: "POST",
        path: "/check-status",
        description: "Health check via POST.",
        requestExample: `curl -X POST ${BASE_URL}/check-status \\
  -H "Content-Type: application/json"`,
        responseExample: `{
  "status": "ok",
  "message": "Check status server is running"
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
      "EXA AI web search. Only the search query is dynamic; options (numResults, type, contents) are fixed. Uses the x402 payment protocol.",
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
      "Crawl a website from a starting URL using Cloudflare Browser Rendering. Discovers pages via links/sitemaps, renders in headless browser, returns content as Markdown. Uses the x402 payment protocol.",
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

  "analytics-summary": doc({
    title: "Analytics Summary API",
    overview:
      "Full analytics summary aggregating dexscreener, token-statistic, trending-jupiter, smart-money, and Binance correlation in a single paid request. Uses the x402 payment protocol.",
    price: "See x402 response for current price (typically higher than single-endpoint calls).",
    endpoints: [
      {
        method: "GET",
        path: "/analytics/summary",
        description: "Fetch full analytics summary (DEX data, token stats, Jupiter trending, smart money, Binance correlation).",
        requestExample: `curl ${BASE_URL}/analytics/summary`,
        responseExample: `{
  "dexscreener": {},
  "tokenStatistic": {},
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
  "dexscreener": {},
  "tokenStatistic": {},
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
      "Get AI-generated trading signals with entry/exit recommendations, targets, and analysis for a given token. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/signal",
        description: "Get a trading signal for a token.",
        params: [
          { name: "token", type: "string", required: "No", description: "Token name (e.g. solana, bitcoin). Default: bitcoin." },
        ],
        requestExample: `curl "${BASE_URL}/signal?token=bitcoin"
curl "${BASE_URL}/signal?token=solana"`,
        responseExample: `{
  "signal": {
    "recommendation": "BUY",
    "entryPrice": 45000,
    "targets": [48000, 52000],
    "analysis": "Technical and on-chain metrics support a buy; RSI oversold, funding rates neutral. Target levels based on recent structure."
  }
}`,
      },
      {
        method: "POST",
        path: "/signal",
        description: "Get signal via POST.",
        bodyExample: `{ "token": "solana" }`,
        requestExample: `curl -X POST ${BASE_URL}/signal \\
  -H "Content-Type: application/json" \\
  -d '{"token": "solana"}'`,
        responseExample: `{
  "signal": {
    "recommendation": "BUY",
    "entryPrice": 98.5,
    "targets": [105, 112],
    "analysis": "Technical and sentiment analysis for Solana..."
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

  dexscreener: doc({
    title: "DexScreener API",
    overview: "Partner API with DexScreener for DEX data and token metrics. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/dexscreener",
        description: "Fetch DexScreener data.",
        requestExample: `curl ${BASE_URL}/dexscreener`,
        responseExample: `{
  "data": {
    "pairs": [
      {
        "chainId": "solana",
        "dexId": "raydium",
        "pairAddress": "...",
        "baseToken": { "symbol": "SOL", "address": "..." },
        "priceUsd": "98.50",
        "volume": { "h24": 1000000 },
        "liquidity": { "usd": 500000 }
      }
    ]
  }
}`,
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

  "jupiter-swap-order": doc({
    title: "Jupiter Swap Order API",
    overview:
      "Get a Jupiter Ultra swap order (buy/sell token on Solana via Corbits). Returns a swap order with a base64 transaction for the client to sign and submit. Requires inputMint, outputMint, amount (smallest units, e.g. lamports), and taker (wallet public key). Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/jupiter/swap/order",
        description: "Get swap order. All query params are required.",
        params: [
          { name: "inputMint", type: "string", required: "Yes", description: "Input token mint address (e.g. wrapped SOL)." },
          { name: "outputMint", type: "string", required: "Yes", description: "Output token mint address (e.g. USDC)." },
          { name: "amount", type: "string", required: "Yes", description: "Amount in smallest units (e.g. lamports for SOL)." },
          { name: "taker", type: "string", required: "Yes", description: "Wallet public key that will execute the swap." },
        ],
        requestExample: `curl "${BASE_URL}/jupiter/swap/order?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&taker=YourWalletPubkey"`,
        responseExample: `{
  "order": {},
  "transaction": "base64-encoded-transaction..."
}`,
      },
    ],
  }),

  "token-report": doc({
    title: "Token Report API (Rugcheck)",
    overview: "Partner API with Rugcheck for token safety and report data. Requires a token contract address. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/token-report",
        description: "Fetch token report for a given token contract address.",
        params: [
          { name: "address", type: "string", required: "Yes", description: "Token contract address (e.g. Solana token mint address)." },
        ],
        requestExample: `curl "${BASE_URL}/token-report?address=So11111111111111111111111111111111111111112"`,
        responseExample: `{
  "data": {
    "report": {
      "mint": "So11111111111111111111111111111111111111112",
      "risks": [],
      "holderAnalysis": {},
      "liquidity": {},
      "freezeAuthority": "revoked",
      "mintAuthority": "revoked"
    }
  }
}`,
      },
    ],
  }),

  "token-statistic": doc({
    title: "Token Statistic API (Rugcheck)",
    overview: "Token statistics and metrics from Rugcheck (new token, recent, trending, verified). Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/token-statistic",
        description: "Fetch token statistics (new, recent, trending, verified).",
        requestExample: `curl ${BASE_URL}/token-statistic`,
        responseExample: `{
  "rugcheck/new_tokens": [],
  "rugcheck/recent": [],
  "rugcheck/trending": [],
  "rugcheck/verified": []
}`,
      },
    ],
  }),

  "token-risk-alerts": doc({
    title: "Token Risk Alerts API (Rugcheck)",
    overview:
      "Anomaly and risk-alert endpoint that returns tokens from Rugcheck’s stat lists (new, recent, trending, verified) whose normalised risk score meets or exceeds a threshold. Each request fetches the stat lists, then fetches a Rugcheck token report for up to a capped number of tokens, and filters by score_normalised. Use this to surface high-risk or anomalous tokens for monitoring or dashboards. Uses the x402 payment protocol.",
    price: "$0.02 USD per request",
    paymentFlow: {
      step1: "Initial request returns 402 with payment instructions.",
      step2: "Complete payment (process payment header, submit via specified method, receive payment proof/token).",
      step3: "Retry request with payment proof in headers to receive the data.",
      response402: standard402(0.02),
    },
    useCases: [
      "Monitor high-risk tokens from new or trending lists",
      "Build dashboards of tokens above a risk threshold (e.g. score ≥ 80)",
      "Filter by source (e.g. new_tokens only) and tune limit for cost/latency",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/token-risk/alerts",
        description:
          "Fetch tokens from Rugcheck stats (new_tokens, recent, trending, verified) whose normalised risk score is at or above rugScoreMin. The API checks up to limit tokens (each triggers one Rugcheck report call) and returns only those passing the threshold. Response includes score range of checked tokens (max_score_normalised_checked, min_score_normalised_checked) to interpret empty alerts.",
        params: [
          {
            name: "rugScoreMin",
            type: "number",
            required: "No",
            description:
              "Minimum normalised risk score (0–100). Only tokens with score_normalised ≥ this value are returned. Default: 80.",
          },
          {
            name: "source",
            type: "string",
            required: "No",
            description:
              "Comma-separated list of stat sources to pull mints from: new_tokens, recent, trending, verified. Default: new_tokens,recent,trending,verified.",
          },
          {
            name: "limit",
            type: "number",
            required: "No",
            description:
              "Maximum number of tokens to check (1–50). Each checked token requires one Rugcheck report call. Default: 20.",
          },
        ],
        requestExample: `# Default: rugScoreMin=80, all sources, limit=20
curl "${BASE_URL}/token-risk/alerts"

# Only high-risk threshold 80, check up to 30 tokens
curl "${BASE_URL}/token-risk/alerts?rugScoreMin=80&limit=30"

# Lower threshold and only new tokens
curl "${BASE_URL}/token-risk/alerts?rugScoreMin=40&source=new_tokens&limit=15"`,
        responseExample: `{
  "alerts": [
    {
      "mint": "8SL2M7Y18eNxtZQTC7vdKUKAfgav7sqr7fxpxufXZNHx",
      "score": 117601,
      "score_normalised": 80,
      "risks": [
        {
          "name": "Creator history of rugged tokens",
          "value": "",
          "description": "Creator has a history of rugging tokens.",
          "score": 117600,
          "level": "danger"
        }
      ],
      "rugged": false,
      "tokenMeta": {
        "name": "AMERICA",
        "symbol": "AMERICA",
        "uri": "https://...",
        "mutable": false,
        "updateAuthority": "..."
      }
    }
  ],
  "count": 1,
  "rugScoreMin": 80,
  "source": ["new_tokens", "recent", "trending", "verified"],
  "limit": 20,
  "checked": 20,
  "max_score_normalised_checked": 80,
  "min_score_normalised_checked": 0
}`,
      },
    ],
    extraSections: [
      {
        title: "Understanding the response",
        content:
          "alerts: array of tokens that passed the threshold; each has mint, score, score_normalised, risks, rugged, tokenMeta. count: number of alerts. rugScoreMin, source, limit: echo of query params. checked: how many tokens were actually fetched and evaluated. max_score_normalised_checked and min_score_normalised_checked: range of score_normalised among the checked tokens (included when at least one report was fetched). If alerts is empty but checked > 0, these fields show the highest and lowest scores seen so you can tell whether the threshold is above the current pool (e.g. max 45 with rugScoreMin 80) or adjust rugScoreMin/limit/source.",
      },
      {
        title: "Dev route (no payment)",
        content:
          "When NODE_ENV is not production, GET /token-risk/alerts/dev accepts the same query parameters and returns the same response shape without x402 payment. Use for local testing.",
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

  "kraken-market": doc({
    title: "Kraken Market API",
    overview:
      "Kraken market data via kraken-cli (no auth): ticker, orderbook, OHLC, recent trades, system status, and server time. All endpoints support GET and POST; all params have defaults. Uses the x402 payment protocol.",
    price: "$0.01 USD per request",
    useCases: [
      "Get Kraken spot ticker for one or more pairs (e.g. BTCUSD, ETHUSD)",
      "Fetch order book depth and OHLC candles",
      "Recent trades and system status for monitoring",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/kraken/ticker",
        description: "Ticker for one or more pairs. Default pair: BTCUSD.",
        params: [
          { name: "pair", type: "string", required: "No", description: "Pair(s) comma-separated (default BTCUSD)." },
        ],
        requestExample: `curl ${BASE_URL}/kraken/ticker
curl "${BASE_URL}/kraken/ticker?pair=BTCUSD,ETHUSD"`,
        responseExample: `{ "BTCUSD": { "a": ["67234.10","1","1.000"], "b": ["67234.00","1","1.000"], ... } }`,
      },
      {
        method: "POST",
        path: "/kraken/ticker",
        description: "Same via POST; body: { \"pair\": \"BTCUSD\" }.",
        bodyExample: `{ "pair": "BTCUSD,ETHUSD" }`,
        requestExample: `curl -X POST ${BASE_URL}/kraken/ticker -H "Content-Type: application/json" -d '{"pair":"BTCUSD"}'`,
        responseExample: `{ "BTCUSD": { ... } }`,
      },
      {
        method: "GET",
        path: "/kraken/orderbook",
        description: "Order book for a pair. Default pair: BTCUSD, count: 25.",
        params: [
          { name: "pair", type: "string", required: "No", description: "Pair (default BTCUSD)." },
          { name: "count", type: "number", required: "No", description: "Depth (default 25, max 500)." },
        ],
        requestExample: `curl ${BASE_URL}/kraken/orderbook
curl "${BASE_URL}/kraken/orderbook?pair=ETHUSD&count=50"`,
        responseExample: `{ "asks": [...], "bids": [...] }`,
      },
      {
        method: "GET",
        path: "/kraken/ohlc",
        description: "OHLC candles. Default pair: BTCUSD, interval: 60.",
        params: [
          { name: "pair", type: "string", required: "No", description: "Pair (default BTCUSD)." },
          { name: "interval", type: "number", required: "No", description: "Minutes (default 60)." },
        ],
        requestExample: `curl ${BASE_URL}/kraken/ohlc`,
        responseExample: `{ "BTCUSD": { "last": 1234567890, "candles": [...] } }`,
      },
      {
        method: "GET",
        path: "/kraken/trades",
        description: "Recent trades. Default pair: BTCUSD, count: 100.",
        params: [
          { name: "pair", type: "string", required: "No", description: "Pair (default BTCUSD)." },
          { name: "count", type: "number", required: "No", description: "Number of trades (default 100, max 1000)." },
        ],
        requestExample: `curl ${BASE_URL}/kraken/trades`,
        responseExample: `{ "trades": [...] }`,
      },
      {
        method: "GET",
        path: "/kraken/status",
        description: "Kraken system status.",
        requestExample: `curl ${BASE_URL}/kraken/status`,
        responseExample: `{ "result": { "status": "online", ... } }`,
      },
      {
        method: "GET",
        path: "/kraken/server-time",
        description: "Kraken server time.",
        requestExample: `curl ${BASE_URL}/kraken/server-time`,
        responseExample: `{ "result": { "unixtime": 1234567890, "rfc1123": "..." } }`,
      },
    ],
    extraSections: [
      {
        title: "Reference",
        content:
          "Data is provided via kraken-cli (https://github.com/krakenfx/kraken-cli). Market endpoints require no API key; the Syra API uses x402 for payment only.",
      },
      {
        title: "Dev routes (no payment)",
        content:
          "When NODE_ENV is not production, GET/POST /kraken/ticker/dev, /kraken/orderbook/dev, /kraken/ohlc/dev, /kraken/trades/dev, /kraken/status/dev, and /kraken/server-time/dev return the same data without x402 payment.",
      },
    ],
  }),

  "okx-market": doc({
    title: "OKX Market API",
    overview:
      "OKX market data via OKX API v5 (no auth): ticker, tickers, order book, candles, trades, funding rate, open interest, mark price, and server time. All endpoints support GET and POST; all params have defaults. Uses the x402 payment protocol.",
    price: "$0.01 USD per request",
    useCases: [
      "Get OKX ticker for spot (BTC-USDT) or swap (BTC-USDT-SWAP)",
      "Fetch order book depth and OHLC candles in multiple timeframes",
      "Funding rate, open interest, and mark price for perpetual swaps",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/okx/ticker",
        description: "Single ticker. Default instId: BTC-USDT.",
        params: [{ name: "instId", type: "string", required: "No", description: "Instrument ID (e.g. BTC-USDT, ETH-USDT-SWAP)." }],
        requestExample: `curl ${BASE_URL}/okx/ticker
curl "${BASE_URL}/okx/ticker?instId=ETH-USDT"`,
        responseExample: `{ "result": { "instId": "BTC-USDT", "last": "97234.5", "vol24h": "12345.67", ... } }`,
      },
      {
        method: "GET",
        path: "/okx/tickers",
        description: "All tickers by instrument type. Default instType: SPOT.",
        params: [{ name: "instType", type: "string", required: "No", description: "SPOT, SWAP, FUTURES, OPTION, MARGIN." }],
        requestExample: `curl ${BASE_URL}/okx/tickers
curl "${BASE_URL}/okx/tickers?instType=SWAP"`,
        responseExample: `{ "result": [ { "instId": "BTC-USDT", "last": "...", ... }, ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/books",
        description: "Order book snapshot. Default instId: BTC-USDT, sz: 20.",
        params: [
          { name: "instId", type: "string", required: "No", description: "Instrument ID (default BTC-USDT)." },
          { name: "sz", type: "number", required: "No", description: "Depth (default 20, max 400)." },
        ],
        requestExample: `curl ${BASE_URL}/okx/books
curl "${BASE_URL}/okx/books?instId=ETH-USDT&sz=50"`,
        responseExample: `{ "result": [ { "bids": [...], "asks": [...] }, ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/candles",
        description: "OHLC candles. Bar: 1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 12H, 1D, 1W, 1M.",
        params: [
          { name: "instId", type: "string", required: "No", description: "Instrument ID (default BTC-USDT)." },
          { name: "bar", type: "string", required: "No", description: "Candle interval (default 1H)." },
          { name: "limit", type: "number", required: "No", description: "Candles to return (default 100, max 300)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/candles?instId=BTC-USDT&bar=1H&limit=100"`,
        responseExample: `{ "result": [ ["1704876900000","97234.5","97300","97100","97250","1234.56"], ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/trades",
        description: "Recent trades. Default instId: BTC-USDT, limit: 100.",
        params: [
          { name: "instId", type: "string", required: "No", description: "Instrument ID (default BTC-USDT)." },
          { name: "limit", type: "number", required: "No", description: "Trades (default 100, max 500)." },
        ],
        requestExample: `curl ${BASE_URL}/okx/trades`,
        responseExample: `{ "result": [ { "instId": "BTC-USDT", "tradeId": "...", "px": "97234.5", ... }, ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/funding-rate",
        description: "Funding rate for perpetual swap. Default instId: BTC-USDT-SWAP.",
        params: [{ name: "instId", type: "string", required: "No", description: "Perpetual swap instId (e.g. BTC-USDT-SWAP)." }],
        requestExample: `curl ${BASE_URL}/okx/funding-rate`,
        responseExample: `{ "result": { "instId": "BTC-USDT-SWAP", "fundingRate": "0.0001", ... } }`,
      },
      {
        method: "GET",
        path: "/okx/open-interest",
        description: "Open interest for perpetual swap.",
        params: [{ name: "instId", type: "string", required: "No", description: "Perpetual swap instId." }],
        requestExample: `curl ${BASE_URL}/okx/open-interest`,
        responseExample: `{ "result": { "instId": "BTC-USDT-SWAP", "oi": "123456", ... } }`,
      },
      {
        method: "GET",
        path: "/okx/mark-price",
        description: "Mark price for derivatives.",
        params: [{ name: "instId", type: "string", required: "No", description: "Derivatives instId." }],
        requestExample: `curl ${BASE_URL}/okx/mark-price`,
        responseExample: `{ "result": { "instId": "BTC-USDT-SWAP", "markPx": "97250.5", ... } }`,
      },
      {
        method: "GET",
        path: "/okx/time",
        description: "OKX server time.",
        requestExample: `curl ${BASE_URL}/okx/time`,
        responseExample: `{ "result": { "ts": "1704876900000" } }`,
      },
    ],
    extraSections: [
      {
        title: "Reference",
        content:
          "Data is provided via OKX API v5 (https://www.okx.com/docs-v5). Market endpoints require no API key; the Syra API uses x402 for payment only.",
      },
      {
        title: "Dev routes (no payment)",
        content:
          "When NODE_ENV is not production, GET/POST /okx/ticker/dev, /okx/tickers/dev, /okx/books/dev, /okx/candles/dev, /okx/trades/dev, /okx/funding-rate/dev, /okx/open-interest/dev, /okx/mark-price/dev, and /okx/time/dev return the same data without x402 payment.",
      },
    ],
  }),

  "okx-dex-market": doc({
    title: "OKX DEX Market API",
    overview:
      "OKX on-chain/DEX market data by token contract address and chain: single and batch price, kline (candlesticks), trades, index price, signal chains/list, and meme pump (memepump-chains, memepump-tokens, token details, dev info, similar tokens, bundle info, aped wallet). All endpoints use OKX web3 REST API v6; no CLI required. All parameters have defaults: omit address/tokens to use the default token for the chain (e.g. WETH on ethereum, wrapped SOL on solana). Requires OKX API key (OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE). Uses the x402 payment protocol.",
    price: "$0.01 USD per request",
    useCases: [
      "On-chain token price by contract address (e.g. Solana, Base, Ethereum)",
      "Candlesticks and recent DEX trades by token address",
      "Smart money / whale / KOL buy signals by chain",
      "Meme pump: new tokens, token details, dev reputation, bundle/sniper analysis",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/okx/dex/price",
        description: "Single on-chain token price by address and chain. Omit address for default token (e.g. WETH on ethereum, wrapped SOL on solana).",
        params: [
          { name: "address", type: "string", required: "No", description: "Token contract address (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Chain: ethereum, solana, base, bsc, arbitrum, xlayer (default ethereum)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/price?address=So11111111111111111111111111111111111111112&chain=solana"`,
        responseExample: `{ "result": { "chainIndex": "501", "tokenContractAddress": "So11...", "time": "1739439633000", "price": "245.12" } }`,
      },
      {
        method: "GET",
        path: "/okx/dex/prices",
        description: "Batch on-chain token prices. Omit tokens for default token for chain.",
        params: [
          { name: "tokens", type: "string", required: "No", description: "Comma-separated chainIndex:address or addresses (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Default chain (default ethereum)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/prices?tokens=501:So11111111111111111111111111111111111111112&chain=solana"`,
        responseExample: `{ "result": [ { "chainIndex": "501", "tokenContractAddress": "So11...", "price": "245.12" }, ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/dex/kline",
        description: "On-chain candlesticks by token address and chain. Omit address for default token.",
        params: [
          { name: "address", type: "string", required: "No", description: "Token contract address (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Chain (default ethereum)." },
          { name: "bar", type: "string", required: "No", description: "1m, 1H, 1D, etc. (default 1H)." },
          { name: "limit", type: "number", required: "No", description: "Candles (default 100, max 299)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/kline?address=So11...&chain=solana&bar=1H&limit=24"`,
        responseExample: `{ "result": [ ["ts","o","h","l","c","vol","volUsd","confirm"], ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/dex/trades",
        description: "Recent on-chain DEX trades for a token. Omit address for default token.",
        params: [
          { name: "address", type: "string", required: "No", description: "Token contract address (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Chain (default ethereum)." },
          { name: "limit", type: "number", required: "No", description: "Trades (default 100, max 500)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/trades?address=So11...&chain=solana&limit=50"`,
        responseExample: `{ "result": [ { "id": "...", "type": "buy", "price": "245.12", "volume": "1000", "txHashUrl": "...", "userAddress": "..." }, ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/dex/index",
        description: "On-chain index price (aggregated). Use empty address for native token.",
        params: [
          { name: "address", type: "string", required: "No", description: "Token address; empty for native." },
          { name: "chain", type: "string", required: "No", description: "Chain (default ethereum)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/index?address=So11...&chain=solana"`,
        responseExample: `{ "result": { "chainIndex": "501", "tokenContractAddress": "So11...", "price": "245.12", "time": "..." } }`,
      },
      {
        method: "GET",
        path: "/okx/dex/signal-chains",
        description: "Chains that support OKX market signals (smart money / whale / KOL).",
        requestExample: `curl "${BASE_URL}/okx/dex/signal-chains"`,
        responseExample: `{ "result": [ { "chainIndex": "501", "chainName": "Solana" }, ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/dex/signal-list",
        description: "Latest buy-direction signals by chain. wallet-type: 1=Smart Money, 2=KOL, 3=Whale.",
        params: [
          { name: "chain", type: "string", required: "No", description: "Chain (default solana)." },
          { name: "walletType", type: "string", required: "No", description: "Comma-separated 1,2,3 (default: all)." },
          { name: "minAmountUsd", type: "string", required: "No", description: "Minimum transaction USD." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/signal-list?chain=solana&walletType=1,2,3"`,
        responseExample: `{ "result": [ { "timestamp": "...", "walletType": "SMART_MONEY", "token": { "tokenAddress": "...", "symbol": "..." }, "amountUsd": "5000" }, ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/dex/memepump-chains",
        description: "Supported chains and protocols for meme pump (e.g. pumpfun, bonkers).",
        requestExample: `curl "${BASE_URL}/okx/dex/memepump-chains"`,
        responseExample: `{ "result": { "data": [ { "chainIndex": "501", "chainName": "Solana", "protocolList": [...] } ] } }`,
      },
      {
        method: "GET",
        path: "/okx/dex/memepump-tokens",
        description: "List meme pump tokens by chain and stage: NEW, MIGRATING, MIGRATED.",
        params: [
          { name: "chain", type: "string", required: "No", description: "Chain (default solana)." },
          { name: "stage", type: "string", required: "No", description: "NEW, MIGRATING, or MIGRATED (default NEW)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/memepump-tokens?chain=solana&stage=NEW"`,
        responseExample: `{ "result": [ { "tokenAddress": "...", "symbol": "...", "market": { "marketCapUsd": "..." }, ... }, ... ] }`,
      },
      {
        method: "GET",
        path: "/okx/dex/memepump-token-details",
        description: "Detailed meme pump token info and audit tags. Omit address for default token.",
        params: [
          { name: "address", type: "string", required: "No", description: "Token contract address (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Chain (default solana)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/memepump-token-details?address=...&chain=solana"`,
        responseExample: `{ "result": { "tokenAddress": "...", "bondingPercent": "85", "tags": { "top10HoldingsPercent": "30", ... }, ... } }`,
      },
      {
        method: "GET",
        path: "/okx/dex/memepump-token-dev-info",
        description: "Developer reputation: rug pulls, migrations, holding info. Omit address for default token.",
        params: [
          { name: "address", type: "string", required: "No", description: "Token contract address (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Chain (default solana)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/memepump-token-dev-info?address=...&chain=solana"`,
        responseExample: `{ "result": { "devLaunchedInfo": { "totalTokens": "5", "rugPullCount": "0", "migratedCount": "2" }, "devHoldingInfo": { ... } } }`,
      },
      {
        method: "GET",
        path: "/okx/dex/memepump-similar-tokens",
        description: "Similar tokens by same creator. Omit address for default token.",
        params: [
          { name: "address", type: "string", required: "No", description: "Token contract address (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Chain (default solana)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/memepump-similar-tokens?address=...&chain=solana"`,
        responseExample: `{ "result": { "data": [ { "tokenAddress": "...", "marketCapUsd": "..." }, ... ] } }`,
      },
      {
        method: "GET",
        path: "/okx/dex/memepump-token-bundle-info",
        description: "Bundle/sniper analysis for a meme token. Omit address for default token.",
        params: [
          { name: "address", type: "string", required: "No", description: "Token contract address (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Chain (default solana)." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/memepump-token-bundle-info?address=...&chain=solana"`,
        responseExample: `{ "result": { "bundlerAthPercent": "80", "totalBundlers": "5", "bundledValueNative": "100", ... } }`,
      },
      {
        method: "GET",
        path: "/okx/dex/memepump-aped-wallet",
        description: "Aped (same-car) wallet list for a token. Omit address for default token.",
        params: [
          { name: "address", type: "string", required: "No", description: "Token contract address (default: chain default token)." },
          { name: "chain", type: "string", required: "No", description: "Chain (default solana)." },
          { name: "wallet", type: "string", required: "No", description: "Wallet to highlight in list." },
        ],
        requestExample: `curl "${BASE_URL}/okx/dex/memepump-aped-wallet?address=...&chain=solana"`,
        responseExample: `{ "result": { "data": [ { "walletAddress": "...", "walletType": "Smart Money", "holdingUsd": "5000", "totalPnl": "1000" }, ... ] } }`,
      },
    ],
    extraSections: [
      {
        title: "Reference",
        content:
          "All endpoints use OKX web3 API v6 (https://web3.okx.com/onchainos/dev-docs-v5/dex-api). Set OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE; same credentials for price, kline, trades, index, signal, and memepump.",
      },
      {
        title: "Dev routes (no payment)",
        content:
          "When NODE_ENV is not production, GET/POST /okx/dex/price/dev, /okx/dex/kline/dev, etc. return the same data without x402 payment.",
      },
    ],
  }),

  "binance-correlation": doc({
    title: "Binance Correlation API",
    overview: "Binance correlation and correlation matrix. Top correlated assets for a symbol (e.g. BTCUSDT) or full correlation matrix. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/binance/correlation",
        description: "Fetch top correlated assets for a symbol.",
        params: [
          { name: "symbol", type: "string", required: "No", description: "Trading pair (e.g. BTCUSDT, ETHUSDT). Default: BTCUSDT." },
        ],
        requestExample: `curl ${BASE_URL}/binance/correlation
curl "${BASE_URL}/binance/correlation?symbol=ETHUSDT"`,
        responseExample: `{
  "data": {
    "correlations": [],
    "signals": [],
    "listingRumors": []
  }
}`,
      },
      {
        method: "GET",
        path: "/binance/correlation-matrix",
        description: "Fetch full Binance correlation matrix.",
        requestExample: `curl ${BASE_URL}/binance/correlation-matrix`,
        responseExample: `{
  "matrix": {},
  "symbols": []
}`,
      },
    ],
  }),

  "binance-spot": doc({
    title: "Binance Spot API",
    overview:
      "Binance Spot market data (24h ticker, order book, exchange info) and signed endpoints (account balances, place/cancel order). Market data requires no API key; account and order require BINANCE_API_KEY and BINANCE_API_SECRET in env or apiKey/apiSecret in request body. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/binance/spot/ticker/24hr",
        description: "24h price change statistics. Optional symbol (e.g. BTCUSDT); omit for all symbols.",
        params: [{ name: "symbol", type: "string", required: "No", description: "Trading pair. Omit for all." }],
        requestExample: `curl "${BASE_URL}/binance/spot/ticker/24hr"
curl "${BASE_URL}/binance/spot/ticker/24hr?symbol=BTCUSDT"`,
        responseExample: `{ "symbol": "BTCUSDT", "priceChange": "...", "lastPrice": "...", "volume": "...", ... }`,
      },
      {
        method: "GET",
        path: "/binance/spot/depth",
        description: "Order book (depth). Symbol required; limit optional (5, 10, 20, 50, 100, 500, 1000).",
        params: [
          { name: "symbol", type: "string", required: "Yes", description: "e.g. BTCUSDT" },
          { name: "limit", type: "string", required: "No", description: "Default 100." },
        ],
        requestExample: `curl "${BASE_URL}/binance/spot/depth?symbol=BTCUSDT&limit=100"`,
        responseExample: `{ "lastUpdateId": 0, "bids": [[ "price", "qty" ]], "asks": [[ "price", "qty" ]] }`,
      },
      {
        method: "GET",
        path: "/binance/spot/exchange-info",
        description: "Exchange trading rules and symbol info. Optional symbol or symbols.",
        params: [
          { name: "symbol", type: "string", required: "No", description: "Single symbol" },
          { name: "symbols", type: "string", required: "No", description: "Symbols filter" },
        ],
        requestExample: `curl "${BASE_URL}/binance/spot/exchange-info"`,
        responseExample: `{ "timezone": "...", "symbols": [ ... ] }`,
      },
      {
        method: "GET",
        path: "/binance/spot/account",
        description: "Spot account balances (signed). Requires Binance API key in env or body.",
        requestExample: `curl "${BASE_URL}/binance/spot/account"`,
        responseExample: `{ "balances": [ { "asset": "BTC", "free": "...", "locked": "..." }, ... ] }`,
      },
      {
        method: "POST",
        path: "/binance/spot/order",
        description: "Place spot order (signed). symbol, side (BUY/SELL), type (MARKET/LIMIT etc.), quantity or quoteOrderQty. Requires API key.",
        params: [
          { name: "symbol", type: "string", required: "Yes", description: "e.g. BTCUSDT" },
          { name: "side", type: "string", required: "Yes", description: "BUY or SELL" },
          { name: "type", type: "string", required: "Yes", description: "MARKET, LIMIT, etc." },
          { name: "quantity", type: "string", required: "No*", description: "Base quantity. *Or quoteOrderQty for MARKET." },
        ],
        requestExample: `curl -X POST "${BASE_URL}/binance/spot/order" -H "Content-Type: application/json" -d '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":"0.001"}'`,
        responseExample: `{ "orderId": 0, "symbol": "BTCUSDT", "status": "...", ... }`,
      },
      {
        method: "DELETE",
        path: "/binance/spot/order",
        description: "Cancel spot order (signed). symbol required; orderId or origClientOrderId required. Requires API key.",
        params: [
          { name: "symbol", type: "string", required: "Yes", description: "e.g. BTCUSDT" },
          { name: "orderId", type: "string", required: "No*", description: "Order ID. *Or origClientOrderId." },
        ],
        requestExample: `curl -X DELETE "${BASE_URL}/binance/spot/order?symbol=BTCUSDT&orderId=123"`,
        responseExample: `{ "orderId": 123, "symbol": "BTCUSDT", "status": "CANCELED", ... }`,
      },
    ],
  }),

  "coingecko-onchain": doc({
    title: "CoinGecko API (x402)",
    overview:
      "Partner API with CoinGecko x402: simple USD price by symbol or id, onchain token price by contract address, search pools, trending pools, and full token data. Data is sourced from CoinGecko's pay-per-use x402 API. Supports networks such as base, solana, and eth. Uses the x402 payment protocol.",
    price: "$0.01 USD per request",
    useCases: [
      "Get current USD price for BTC, ETH, SOL or other coins by symbol or CoinGecko id",
      "Get token price(s) by contract address on a network (single or multiple addresses)",
      "Search for pools and tokens by name, symbol, or contract address on a given network",
      "Get trending pools and tokens on Base or Solana (e.g. last 5 minutes)",
      "Get token profile by contract address: price, FDV, volume, top pools, composition",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/coingecko/simple-price",
        description: "USD price and market data for coins by symbol (e.g. btc,eth,sol) or CoinGecko id (e.g. bitcoin,ethereum). Requires either symbols or ids.",
        params: [
          { name: "symbols", type: "string", required: "No*", description: "Comma-separated symbols (e.g. btc,eth,sol). *Required if ids omitted." },
          { name: "ids", type: "string", required: "No*", description: "Comma-separated CoinGecko ids (e.g. bitcoin,ethereum,solana). *Required if symbols omitted." },
          { name: "vs_currencies", type: "string", required: "No", description: "e.g. usd. Default: usd." },
          { name: "include_market_cap", type: "string", required: "No", description: "true/false." },
          { name: "include_24hr_vol", type: "string", required: "No", description: "true/false." },
          { name: "include_24hr_change", type: "string", required: "No", description: "true/false." },
        ],
        requestExample: `# By symbols
curl "${BASE_URL}/coingecko/simple-price?symbols=btc,eth,sol&include_market_cap=true"

# By CoinGecko ids
curl "${BASE_URL}/coingecko/simple-price?ids=bitcoin,ethereum,solana&vs_currencies=usd"`,
        responseExample: `{
  "bitcoin": { "usd": 97234.5, "usd_market_cap": 1912345678901 },
  "ethereum": { "usd": 3456.78, "usd_market_cap": 415000000000 },
  "solana": { "usd": 234.56, "usd_market_cap": 108000000000 }
}`,
      },
      {
        method: "GET",
        path: "/coingecko/onchain/token-price",
        description: "Token price(s) by contract address on a network. Address can be comma-separated for multiple tokens.",
        params: [
          { name: "network", type: "string", required: "Yes", description: "Network id (e.g. base, solana, eth)." },
          { name: "address", type: "string", required: "Yes", description: "Token contract address (comma-separated for multiple)." },
          { name: "include_market_cap", type: "string", required: "No", description: "true/false." },
          { name: "include_24hr_vol", type: "string", required: "No", description: "true/false." },
          { name: "include_24hr_price_change", type: "string", required: "No", description: "true/false." },
        ],
        requestExample: `# Single token on Base
curl "${BASE_URL}/coingecko/onchain/token-price?network=base&address=0x4200000000000000000000000000000000000006"

# Multiple tokens (comma-separated)
curl "${BASE_URL}/coingecko/onchain/token-price?network=base&address=0x...,0x..."`,
        responseExample: `{
  "0x4200000000000000000000000000000000000006": { "usd": 2345.67 }
}`,
      },
      {
        method: "GET",
        path: "/coingecko/onchain/search-pools",
        description: "Search pools and tokens by query (name, symbol, or contract address) on a network.",
        params: [
          { name: "query", type: "string", required: "Yes", description: "Search query: token name, symbol, or contract address." },
          { name: "network", type: "string", required: "No", description: "Network id (e.g. solana, base). Default: solana." },
          { name: "page", type: "string", required: "No", description: "Page number for pagination." },
          { name: "include", type: "string", required: "No", description: "Comma-separated: base_token, quote_token, dex." },
        ],
        requestExample: `# Search for "pump" on Solana
curl "${BASE_URL}/coingecko/onchain/search-pools?query=pump&network=solana"

# Search on Base with optional include
curl "${BASE_URL}/coingecko/onchain/search-pools?query=WETH&network=base&include=base_token,quote_token,dex"`,
        responseExample: `{
  "data": [],
  "included": []
}`,
      },
      {
        method: "GET",
        path: "/coingecko/onchain/trending-pools",
        description: "Get trending pools and tokens on a network (e.g. last 5 minutes).",
        params: [
          { name: "network", type: "string", required: "No", description: "Network id (e.g. base, solana). Default: base." },
          { name: "duration", type: "string", required: "No", description: "Time window (e.g. 5m). Default: 5m." },
          { name: "page", type: "string", required: "No", description: "Page number for pagination." },
          { name: "include_gt_community_data", type: "string", required: "No", description: "Include community data (true/false)." },
          { name: "include", type: "string", required: "No", description: "Comma-separated fields to include." },
        ],
        requestExample: `# Trending on Base (default 5m)
curl "${BASE_URL}/coingecko/onchain/trending-pools?network=base"

# Trending on Solana
curl "${BASE_URL}/coingecko/onchain/trending-pools?network=solana&duration=5m"`,
        responseExample: `{
  "data": [],
  "included": []
}`,
      },
      {
        method: "GET",
        path: "/coingecko/onchain/token",
        description: "Get token data by contract address on a network: price, liquidity, FDV, volume, top pools.",
        params: [
          { name: "network", type: "string", required: "Yes", description: "Network id (e.g. base, solana, eth)." },
          { name: "address", type: "string", required: "Yes", description: "Token contract address." },
          { name: "include", type: "string", required: "No", description: "e.g. top_pools." },
          { name: "include_composition", type: "string", required: "No", description: "true/false." },
        ],
        requestExample: `# Token on Base by contract address
curl "${BASE_URL}/coingecko/onchain/token?network=base&address=0x4200000000000000000000000000000000000006"

# Token on Solana with top pools
curl "${BASE_URL}/coingecko/onchain/token?network=solana&address=So11111111111111111111111111111111111111112&include=top_pools"`,
        responseExample: `{
  "data": {
    "id": "eth_0xdac17f958d2ee523a2206206994597c13d831ec7",
    "type": "token",
    "attributes": {
      "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
      "name": "Tether USD",
      "symbol": "USDT",
      "decimals": 6,
      "price_usd": "0.999188255",
      "fdv_usd": "91700939859.6687",
      "total_reserve_in_usd": "405089394.14",
      "volume_usd": { "h24": "1142454033.37" },
      "market_cap_usd": "171798403974.784"
    },
    "relationships": { "top_pools": { "data": [] } }
  },
  "included": []
}`,
      },
    ],
    extraSections: [
      {
        title: "Networks",
        content:
          "Response data may include tokens from various networks (e.g. base, solana, eth). Payment for this API is via x402 on Solana. Syra proxies the request to CoinGecko x402 and returns the same JSON:API-style response (data, included).",
      },
      {
        title: "Dev routes (no payment)",
        content:
          "When NODE_ENV is not production, GET /coingecko/simple-price/dev, /coingecko/onchain/token-price/dev, /coingecko/onchain/search-pools/dev, /coingecko/onchain/trending-pools/dev, and /coingecko/onchain/token/dev accept the same query parameters and return the same response shape without x402 payment. PAYER_KEYPAIR must be set for the server to pay CoinGecko x402.",
      },
    ],
  }),

  coinmarketcap: doc({
    title: "CoinMarketCap API (x402)",
    overview:
      "Partner API with CoinMarketCap x402. Single proxy endpoint for cryptocurrency quotes latest, listing latest, DEX pairs quotes latest, DEX search, and MCP. Data is sourced from CoinMarketCap's pay-per-use x402 API (Base/EVM). Uses the x402 payment protocol.",
    price: "$0.01 USD per request",
    useCases: [
      "Get latest quotes for one or more cryptocurrencies by CMC id, slug, or symbol",
      "Get latest listing with optional start/limit and convert",
      "DEX pairs quotes and DEX search by chain and query",
      "MCP endpoint for model context",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/coinmarketcap",
        description:
          "Proxy to CoinMarketCap x402. Set endpoint (required) to one of: quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp. Pass id, slug, symbol, start, limit, convert, q, chain_id, pair_address as needed.",
        params: [
          {
            name: "endpoint",
            type: "string",
            required: "Yes",
            description:
              "One of: quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp",
          },
          { name: "id", type: "string", required: "No", description: "CMC id (e.g. 1 for Bitcoin) for quotes/listing" },
          { name: "slug", type: "string", required: "No", description: "Slug for quotes/listing" },
          { name: "symbol", type: "string", required: "No", description: "Symbol(s) for quotes/listing" },
          { name: "start", type: "string", required: "No", description: "Start rank for listing" },
          { name: "limit", type: "string", required: "No", description: "Limit for listing" },
          { name: "convert", type: "string", required: "No", description: "Convert to (e.g. USD)" },
          { name: "q", type: "string", required: "No", description: "Search query for dex-search" },
          { name: "chain_id", type: "string", required: "No", description: "Chain id for DEX endpoints" },
          { name: "pair_address", type: "string", required: "No", description: "Pair address for DEX" },
        ],
        requestExample: `# Quotes for Bitcoin (id=1)
curl "${BASE_URL}/coinmarketcap?endpoint=quotes-latest&id=1&convert=USD"

# Listing latest (first 10)
curl "${BASE_URL}/coinmarketcap?endpoint=listing-latest&start=1&limit=10&convert=USD"

# DEX search
curl "${BASE_URL}/coinmarketcap?endpoint=dex-search&q=SOL"`,
        responseExample: `{
  "data": {
    "1": {
      "id": 1,
      "name": "Bitcoin",
      "symbol": "BTC",
      "quote": { "USD": { "price": 97234.5, "volume_24h": 25000000000 } }
    }
  }
}`,
      },
      {
        method: "POST",
        path: "/coinmarketcap",
        description: "Same as GET; send endpoint and other params in JSON body.",
        bodyExample: `{ "endpoint": "quotes-latest", "id": "1", "convert": "USD" }`,
        requestExample: `curl -X POST ${BASE_URL}/coinmarketcap \\
  -H "Content-Type: application/json" \\
  -d '{"endpoint":"quotes-latest","id":"1","convert":"USD"}'`,
        responseExample: `{
  "data": {
    "1": {
      "id": 1,
      "name": "Bitcoin",
      "symbol": "BTC",
      "quote": { "USD": { "price": 97234.5 } }
    }
  }
}`,
      },
    ],
    extraSections: [
      {
        title: "Reference",
        content:
          "CoinMarketCap x402: https://coinmarketcap.com/api/x402/ and https://pro.coinmarketcap.com/api/documentation/v1/#tag/x402-(beta). CMC uses Base (eip155:8453) and PAYMENT-SIGNATURE (v2).",
      },
      {
        title: "Dev route (no payment)",
        content:
          "When NODE_ENV is not production, GET /coinmarketcap/dev accepts the same query/body and returns the same response without x402 payment. CMC_PAYER_PRIVATE_KEY or BASE_PAYER_PRIVATE_KEY must be set for the server to pay CoinMarketCap x402.",
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
        description: "Free signal preview (same data as x402 /signal, no payment).",
        params: [{ name: "token", type: "string", required: "No", description: "e.g. bitcoin, solana" }],
        requestExample: `curl "${BASE_URL}/preview/signal?token=bitcoin"`,
        responseExample: `{ "signal": { ... }, "token": "bitcoin" }`,
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

export function getApiDoc(slug: string): ApiDoc | null {
  return apiDocs[slug] ?? null;
}

export function getAllApiSlugs(): string[] {
  return Object.keys(apiDocs);
}
