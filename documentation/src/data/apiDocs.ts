/**
 * API documentation content for each x402 endpoint.
 * Base URL: https://api.syraa.fun/v2
 */

export interface ApiParam {
  name: string;
  type: string;
  required: string;
  description: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST";
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

const BASE_URL = "https://api.syraa.fun/v2";
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
      "This document defines the standard structure and conventions for all Syra x402 API documentation. Every paid API uses the v2 path prefix and requires payment via the x402 protocol before returning data.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/check-status",
        description: "Health check example. All v2 endpoints follow the same payment flow.",
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
        path: "/v2/check-status",
        description: "Health check.",
        requestExample: `curl ${BASE_URL}/check-status`,
        responseExample: `{
  "status": "ok",
  "message": "Check status server is running"
}`,
      },
      {
        method: "POST",
        path: "/v2/check-status",
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
        path: "/v2/news",
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
        path: "/v2/news",
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
        path: "/v2/sentiment",
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
        path: "/v2/sentiment",
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
        path: "/v2/trending-headline",
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
        path: "/v2/trending-headline",
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
        path: "/v2/sundown-digest",
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

  browse: doc({
    title: "Browse API",
    overview:
      "Scrape and extract information from websites using AI-powered browsing. Send a query and receive extracted data. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/browse",
        description: "Scrape information from websites based on a query.",
        params: [
          { name: "query", type: "string", required: "Yes", description: "Search query or URL to browse and extract information from." },
        ],
        requestExample: `curl "${BASE_URL}/browse?query=Find%20the%20latest%20Bitcoin%20price%20from%20CoinMarketCap"`,
        responseExample: `{
  "query": "Find the latest Bitcoin price from CoinMarketCap",
  "result": "{\\"status\\":\\"finished\\",\\"data\\":\\"Bitcoin price is $45,230...\\"}"
}`,
      },
      {
        method: "POST",
        path: "/v2/browse",
        description: "Browse via POST.",
        bodyExample: `{ "query": "Extract product prices from example-shop.com" }`,
        requestExample: `curl -X POST ${BASE_URL}/browse \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Extract all product prices from example-shop.com"}'`,
        responseExample: `{
  "query": "Extract all product prices from example-shop.com",
  "result": "{\\"status\\":\\"finished\\",\\"data\\":\\"Product A: $99, Product B: $149...\\"}"
}`,
      },
    ],
  }),

  research: doc({
    title: "Research API",
    overview:
      "AI-powered research with Quick (30–60s) or Deep (2–5 min) modes. Gathers and synthesizes information from multiple web sources to answer your research queries.",
    useCases: [
      "Quick facts and overviews (quick mode)",
      "In-depth reports with citations (deep mode)",
      "Market analysis, token research, and trend reports",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/v2/research",
        description: "Perform research on any topic.",
        params: [
          { name: "query", type: "string", required: "Yes", description: "Research query (e.g. token analysis, market trends)." },
          { name: "type", type: "string", required: "No", description: "'quick' or 'deep'. Default: quick." },
        ],
        requestExample: `# Quick research (default)
curl "${BASE_URL}/research?query=What%20is%20Bitcoin%20ETF"

# Deep research
curl "${BASE_URL}/research?query=Analyze%20Bitcoin%20ETFs%20impact&type=deep"`,
        responseExample: `{
  "status": "success",
  "content": "# Bitcoin ETF Analysis\\n\\nA Bitcoin ETF tracks the price of Bitcoin...",
  "sources": [
    { "url": "https://...", "title": "...", "relevance": "..." }
  ]
}`,
      },
      {
        method: "POST",
        path: "/v2/research",
        description: "Research via POST.",
        bodyExample: `{ "query": "Compare L1 vs L2 scaling", "type": "deep" }`,
        requestExample: `curl -X POST ${BASE_URL}/research \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Compare Layer 1 vs Layer 2 blockchain scaling", "type": "deep"}'`,
        responseExample: `{
  "status": "success",
  "content": "# Layer 1 vs Layer 2 Scaling\\n\\nLayer 1 blockchains scale by changing consensus or block size...",
  "sources": [
    { "url": "https://ethereum.org/scaling", "title": "Ethereum Scaling", "relevance": "high" }
  ]
}`,
      },
    ],
  }),

  "x-search": doc({
    title: "X Search API",
    overview: "Deep research on X (Twitter) for crypto trends and discussions. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/x-search",
        description: "Search X for crypto content.",
        params: [
          { name: "query", type: "string", required: "Yes", description: "Search query for X/Twitter research (e.g. token name, topic)." },
        ],
        requestExample: `curl "${BASE_URL}/x-search?query=bitcoin"`,
        responseExample: `{
  "query": "bitcoin",
  "result": "AI-summarized findings from X/Twitter...",
  "citations": [],
  "toolCalls": []
}`,
      },
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
        path: "/v2/exa-search",
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
        path: "/v2/exa-search",
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

  gems: doc({
    title: "Gems API",
    overview: "Discover hidden gem crypto projects trending on X/Twitter. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/gems",
        description: "Fetch AI-analyzed hidden gem projects.",
        requestExample: `curl ${BASE_URL}/gems`,
        responseExample: `{
  "query": "...",
  "result": "AI-analyzed hidden gem projects with potential and risks...",
  "citations": [],
  "toolCalls": []
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
        path: "/v2/signal",
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
        path: "/v2/signal",
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
        path: "/v2/event",
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
        path: "/v2/event",
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

  kol: doc({
    title: "KOL API (X KOL)",
    overview: "Get key opinion leader (KOL) insights and mentions for crypto from X/Twitter. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/x-kol",
        description: "Fetch KOL data.",
        requestExample: `curl ${BASE_URL}/x-kol`,
        responseExample: `{
  "query": "X KOL crypto insights",
  "result": "Key opinion leaders this week: @influencer1 highlighted Bitcoin ETF flows; @influencer2 discussed Solana DeFi growth. Summary of top mentions and sentiment.",
  "citations": [
    { "url": "https://x.com/...", "title": "Post by @influencer1" }
  ],
  "toolCalls": []
}`,
      },
    ],
  }),

  "crypto-kol": doc({
    title: "Crypto KOL API",
    overview: "Crypto-specific KOL analysis and sentiment. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/crypto-kol",
        description: "Fetch crypto KOL data.",
        requestExample: `curl ${BASE_URL}/crypto-kol`,
        responseExample: `{
  "data": [
    {
      "kol": "@crypto_analyst",
      "mentionCount": 42,
      "sentiment": "bullish",
      "topics": ["BTC", "ETH"],
      "lastActive": "2024-01-15T12:00:00Z"
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
        path: "/v2/smart-money",
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
        path: "/v2/token-god-mode",
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

  dexscreener: doc({
    title: "DexScreener API",
    overview: "Partner API with DexScreener for DEX data and token metrics. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/dexscreener",
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
        path: "/v2/trending-jupiter",
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

  "token-report": doc({
    title: "Token Report API (Rugcheck)",
    overview: "Partner API with Rugcheck for token safety and report data. Requires a token contract address. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/token-report",
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
        path: "/v2/token-statistic",
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
        path: "/v2/token-risk/alerts",
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
          "When NODE_ENV is not production, GET /v2/token-risk/alerts/dev accepts the same query parameters and returns the same response shape without x402 payment. Use for local testing.",
      },
    ],
  }),

  "bubblemaps-maps": doc({
    title: "Bubblemaps Maps API",
    overview: "Partner API with Bubblemaps for holder distribution and map data. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/bubblemaps/maps",
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

  "binance-correlation": doc({
    title: "Binance Correlation API",
    overview: "Binance listing correlation and CEX-related signals. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/binance/correlation",
        description: "Fetch Binance correlation data.",
        requestExample: `curl ${BASE_URL}/binance/correlation`,
        responseExample: `{
  "data": {
    "correlations": [],
    "signals": [],
    "listingRumors": []
  }
}`,
      },
    ],
  }),

  pump: doc({
    title: "Pump API (Workfun)",
    overview: "Partner API with Workfun for pump.fun token data. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/pump",
        description: "Fetch pump.fun token data.",
        requestExample: `curl ${BASE_URL}/pump`,
        responseExample: `{
  "data": {
    "tokens": [],
    "trending": [],
    "recent": []
  }
}`,
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
        path: "/v2/coingecko/simple-price",
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
        path: "/v2/coingecko/onchain/token-price",
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
        path: "/v2/coingecko/onchain/search-pools",
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
        path: "/v2/coingecko/onchain/trending-pools",
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
        path: "/v2/coingecko/onchain/token",
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
          "When NODE_ENV is not production, GET /v2/coingecko/simple-price/dev, /v2/coingecko/onchain/token-price/dev, /v2/coingecko/onchain/search-pools/dev, /v2/coingecko/onchain/trending-pools/dev, and /v2/coingecko/onchain/token/dev accept the same query parameters and return the same response shape without x402 payment. PAYER_KEYPAIR must be set for the server to pay CoinGecko x402.",
      },
    ],
  }),

  "memecoin-fastest-holder-growth": doc({
    title: "Memecoin: Fastest Holder Growth",
    overview: "Get the fastest growing memecoins by holder growth rate. Uses the x402 payment protocol.",
    endpoints: [
      { method: "GET", path: "/v2/memecoin/fastest-holder-growth", description: "Fetch list.", requestExample: `curl ${BASE_URL}/memecoin/fastest-holder-growth`, responseExample: `{
  "query": "...",
  "result": "AI-summarized memecoins with fastest holder growth...",
  "citations": [],
  "toolCalls": []
}`,
      },
    ],
  }),

  "memecoin-most-mentioned-smart-money-x": doc({
    title: "Memecoin: Most Mentioned Smart Money (X)",
    overview: "Memecoins most mentioned by smart money on X. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/memecoin/most-mentioned-by-smart-money-x",
        description: "Fetch memecoins most mentioned by smart money on X.",
        requestExample: `curl ${BASE_URL}/memecoin/most-mentioned-by-smart-money-x`,
        responseExample: `{
  "query": "Memecoins most mentioned by smart money on X",
  "result": "AI-summarized list with token names, mention counts, and smart money wallet context.",
  "citations": [],
  "toolCalls": []
}`,
      },
    ],
  }),

  "memecoin-accumulating-before-cex-rumors": doc({
    title: "Memecoin: Accumulating Before CEX Rumors",
    overview: "Memecoins with accumulation signals before CEX listing rumors. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/memecoin/accumulating-before-CEX-rumors",
        description: "Fetch memecoins accumulating before CEX rumors.",
        requestExample: `curl ${BASE_URL}/memecoin/accumulating-before-CEX-rumors`,
        responseExample: `{
  "query": "Memecoins accumulating before CEX rumors",
  "result": "AI-summarized list with tokens showing accumulation and CEX listing speculation.",
  "citations": [],
  "toolCalls": []
}`,
      },
    ],
  }),

  "memecoin-strong-narrative-low-market-cap": doc({
    title: "Memecoin: Strong Narrative, Low Market Cap",
    overview: "Memecoins with strong narrative and low market cap. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/memecoin/strong-narrative-low-market-cap",
        description: "Fetch memecoins with strong narrative and low market cap.",
        requestExample: `curl ${BASE_URL}/memecoin/strong-narrative-low-market-cap`,
        responseExample: `{
  "query": "Memecoins with strong narrative and low market cap",
  "result": "AI-summarized list with token names, narrative summary, and market cap ranges.",
  "citations": [],
  "toolCalls": []
}`,
      },
    ],
  }),

  "memecoin-by-experienced-devs": doc({
    title: "Memecoin: By Experienced Devs",
    overview: "Memecoins built by experienced developers. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/memecoin/by-experienced-devs",
        description: "Fetch memecoins by experienced developers.",
        requestExample: `curl ${BASE_URL}/memecoin/by-experienced-devs`,
        responseExample: `{
  "query": "Memecoins by experienced developers",
  "result": "AI-summarized list with token names and dev background context.",
  "citations": [],
  "toolCalls": []
}`,
      },
    ],
  }),

  "memecoin-unusual-whale-behavior": doc({
    title: "Memecoin: Unusual Whale Behavior",
    overview: "Memecoins with unusual whale accumulation or selling. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/memecoin/unusual-whale-behavior",
        description: "Fetch memecoins with unusual whale behavior.",
        requestExample: `curl ${BASE_URL}/memecoin/unusual-whale-behavior`,
        responseExample: `{
  "query": "Memecoins with unusual whale behavior",
  "result": "AI-summarized list with tokens and whale activity context.",
  "citations": [],
  "toolCalls": []
}`,
      },
    ],
  }),

  "memecoin-trending-on-x-not-dex": doc({
    title: "Memecoin: Trending on X (Not DEX)",
    overview: "Memecoins trending on X before DEX volume. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/memecoin/trending-on-x-not-dex",
        description: "Fetch memecoins trending on X but not yet on DEX.",
        requestExample: `curl ${BASE_URL}/memecoin/trending-on-x-not-dex`,
        responseExample: `{
  "query": "Memecoins trending on X not DEX",
  "result": "AI-summarized list with tokens trending on X before significant DEX volume.",
  "citations": [],
  "toolCalls": []
}`,
      },
    ],
  }),

  "memecoin-organic-traction": doc({
    title: "Memecoin: Organic Traction",
    overview: "Memecoins with organic community and traction. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/memecoin/organic-traction",
        description: "Fetch memecoins with organic traction.",
        requestExample: `curl ${BASE_URL}/memecoin/organic-traction`,
        responseExample: `{
  "query": "Memecoins with organic traction",
  "result": "AI-summarized list with tokens showing organic community growth and engagement.",
  "citations": [],
  "toolCalls": []
}`,
      },
    ],
  }),

  "memecoin-surviving-market-dumps": doc({
    title: "Memecoin: Surviving Market Dumps",
    overview: "Memecoins that held up during market dumps. Uses the x402 payment protocol.",
    endpoints: [
      {
        method: "GET",
        path: "/v2/memecoin/surviving-market-dumps",
        description: "Fetch memecoins that survived market dumps.",
        requestExample: `curl ${BASE_URL}/memecoin/surviving-market-dumps`,
        responseExample: `{
  "query": "Memecoins surviving market dumps",
  "result": "AI-summarized list with tokens that held up during recent market dumps.",
  "citations": [],
  "toolCalls": []
}`,
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
