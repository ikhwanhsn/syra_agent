/**
 * Syra Agent tools catalog for documentation.
 * Mirrors api/config/agentTools.js with prices and example prompts for the docs.
 */

export interface AgentToolCatalogEntry {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  examplePrompt: string;
  category: "core" | "partner" | "memecoin";
}

/** Prices in USD (aligned with api/config/x402Pricing.js) */
const PRICE = {
  default: 0.01,
  checkStatus: 0.0001,
  news: 0.01,
  research: 0.01,
  nansen: 0.01,
  dexscreener: 0.01,
  pump: 0.01,
  tokenRiskAlerts: 0.02,
} as const;

export const AGENT_TOOLS_CATALOG: AgentToolCatalogEntry[] = [
  // Core
  {
    id: "check-status",
    name: "Check API status",
    description: "Health check for API server status and connectivity.",
    priceUsd: PRICE.checkStatus,
    examplePrompt: "Check status / Is the API up?",
    category: "core",
  },
  {
    id: "news",
    name: "Crypto news",
    description: "Get latest crypto news and market updates. Optional ticker: BTC, ETH, SOL, or general.",
    priceUsd: PRICE.news,
    examplePrompt: "Latest crypto news / News about BTC",
    category: "core",
  },
  {
    id: "signal",
    name: "Trading signal",
    description: "Trading signal creation and signal data for supported tokens (e.g. Bitcoin, Ethereum, Solana).",
    priceUsd: PRICE.default,
    examplePrompt: "Signal for Bitcoin / Get me a signal for SOL",
    category: "core",
  },
  {
    id: "sentiment",
    name: "Sentiment analysis",
    description: "Get market sentiment analysis.",
    priceUsd: PRICE.default,
    examplePrompt: "What's the market sentiment? / Sentiment analysis",
    category: "core",
  },
  {
    id: "event",
    name: "Event",
    description: "Event data and updates.",
    priceUsd: PRICE.default,
    examplePrompt: "Get events / Crypto events",
    category: "core",
  },
  {
    id: "browse",
    name: "Browse",
    description: "Browse and discovery data.",
    priceUsd: PRICE.default,
    examplePrompt: "Browse / Discovery data",
    category: "core",
  },
  {
    id: "x-search",
    name: "X search",
    description: "Search X (Twitter) for crypto and market content.",
    priceUsd: PRICE.default,
    examplePrompt: "Search X for Bitcoin / Twitter search",
    category: "core",
  },
  {
    id: "research",
    name: "Research",
    description: "Deep research and analysis.",
    priceUsd: PRICE.research,
    examplePrompt: "Run deep research / Do research on ETH",
    category: "core",
  },
  {
    id: "exa-search",
    name: "EXA search",
    description: "EXA AI web search; only the search query is dynamic.",
    priceUsd: PRICE.default,
    examplePrompt: "Search the web for latest Nvidia news / EXA search for crypto market",
    category: "core",
  },
  {
    id: "gems",
    name: "Gems",
    description: "Gems and curated insights.",
    priceUsd: PRICE.default,
    examplePrompt: "Show me gems / Curated insights",
    category: "core",
  },
  {
    id: "x-kol",
    name: "X KOL",
    description: "X/Twitter KOL (key opinion leader) data.",
    priceUsd: PRICE.default,
    examplePrompt: "X KOL data / Twitter key opinion leaders",
    category: "core",
  },
  {
    id: "crypto-kol",
    name: "Crypto KOL",
    description: "Crypto KOL data and insights.",
    priceUsd: PRICE.default,
    examplePrompt: "Crypto KOL / Key opinion leaders crypto",
    category: "core",
  },
  {
    id: "trending-headline",
    name: "Trending headline",
    description: "Trending headlines.",
    priceUsd: PRICE.default,
    examplePrompt: "Trending headlines / Trending headline",
    category: "core",
  },
  {
    id: "sundown-digest",
    name: "Sundown digest",
    description: "Sundown digest and daily summary.",
    priceUsd: PRICE.default,
    examplePrompt: "Sundown digest / Daily digest",
    category: "core",
  },
  // Partner: Nansen
  {
    id: "smart-money",
    name: "Smart money (Nansen)",
    description: "Smart money data from Nansen.",
    priceUsd: PRICE.nansen,
    examplePrompt: "Smart money data / Whale movement",
    category: "partner",
  },
  {
    id: "token-god-mode",
    name: "Token god mode (Nansen)",
    description: "Token god mode insights from Nansen.",
    priceUsd: PRICE.nansen,
    examplePrompt: "Token god mode / Nansen token god",
    category: "partner",
  },
  // Partner: DexScreener, Jupiter, Rugcheck, Bubblemaps, Binance, Workfun
  {
    id: "dexscreener",
    name: "DexScreener",
    description: "DexScreener data.",
    priceUsd: PRICE.dexscreener,
    examplePrompt: "DexScreener data / DEX data",
    category: "partner",
  },
  {
    id: "trending-jupiter",
    name: "Trending on Jupiter",
    description: "Trending tokens on Jupiter.",
    priceUsd: PRICE.default,
    examplePrompt: "Trending on Jupiter / Jupiter trending tokens",
    category: "partner",
  },
  {
    id: "token-report",
    name: "Token report (Rugcheck)",
    description: "Token report from Rugcheck.",
    priceUsd: PRICE.default,
    examplePrompt: "Token report / Rugcheck report",
    category: "partner",
  },
  {
    id: "token-statistic",
    name: "Token statistic (Rugcheck)",
    description: "Token statistics from Rugcheck.",
    priceUsd: PRICE.default,
    examplePrompt: "Token statistic / Rugcheck stats",
    category: "partner",
  },
  {
    id: "token-risk-alerts",
    name: "Token risk alerts (Rugcheck)",
    description: "Tokens from Rugcheck stats with risk score at or above threshold (e.g. rugScoreMin=80).",
    priceUsd: PRICE.tokenRiskAlerts,
    examplePrompt: "Token risk alerts / High-risk tokens / Rugcheck alerts",
    category: "partner",
  },
  {
    id: "bubblemaps-maps",
    name: "Bubblemaps maps",
    description: "Bubblemaps map data.",
    priceUsd: PRICE.default,
    examplePrompt: "Bubblemaps / Bubble maps",
    category: "partner",
  },
  {
    id: "binance-correlation",
    name: "Binance correlation",
    description: "Binance correlation data.",
    priceUsd: PRICE.default,
    examplePrompt: "Binance correlation / Correlation Binance",
    category: "partner",
  },
  {
    id: "pump",
    name: "Pump (Workfun)",
    description: "Pump data from Workfun.",
    priceUsd: PRICE.pump,
    examplePrompt: "Pump.fun data / Pump data",
    category: "partner",
  },
  {
    id: "coingecko-simple-price",
    name: "CoinGecko simple price",
    description: "USD price and market data for coins by symbol (e.g. btc,eth,sol) or CoinGecko id.",
    priceUsd: PRICE.default,
    examplePrompt: "What's the price of BTC? / Price of Bitcoin and Ethereum",
    category: "partner",
  },
  {
    id: "coingecko-onchain-token-price",
    name: "CoinGecko onchain token price",
    description: "Token price(s) by contract address on a network (supports multiple addresses).",
    priceUsd: PRICE.default,
    examplePrompt: "Price of this token by address on Base / Token price for 0x...",
    category: "partner",
  },
  {
    id: "coingecko-search-pools",
    name: "CoinGecko search pools",
    description: "Search pools and tokens by name, symbol, or contract address on a network (e.g. solana, base).",
    priceUsd: PRICE.default,
    examplePrompt: "Search pools for pump on Solana / CoinGecko search pools",
    category: "partner",
  },
  {
    id: "coingecko-trending-pools",
    name: "CoinGecko trending pools",
    description: "Trending pools and tokens by network (e.g. base, solana) with optional duration (e.g. 5m).",
    priceUsd: PRICE.default,
    examplePrompt: "Trending pools on Base / CoinGecko trending on Solana",
    category: "partner",
  },
  {
    id: "coingecko-onchain-token",
    name: "CoinGecko onchain token",
    description: "Token data by contract address on a network: price, liquidity, top pools.",
    priceUsd: PRICE.default,
    examplePrompt: "Token data for this address on Base / CoinGecko token by address",
    category: "partner",
  },
  // Memecoin
  {
    id: "memecoin-fastest-holder-growth",
    name: "Memecoin fastest holder growth",
    description: "Memecoins with fastest holder growth.",
    priceUsd: PRICE.default,
    examplePrompt: "Memecoins with fastest holder growth",
    category: "memecoin",
  },
  {
    id: "memecoin-most-mentioned-by-smart-money-x",
    name: "Memecoin most mentioned by smart money (X)",
    description: "Memecoins most mentioned by smart money on X.",
    priceUsd: PRICE.default,
    examplePrompt: "Most mentioned by smart money on X",
    category: "memecoin",
  },
  {
    id: "memecoin-accumulating-before-cex-rumors",
    name: "Memecoin accumulating before CEX rumors",
    description: "Memecoins accumulating before CEX listing rumors.",
    priceUsd: PRICE.default,
    examplePrompt: "Memecoins accumulating before CEX rumors",
    category: "memecoin",
  },
  {
    id: "memecoin-strong-narrative-low-market-cap",
    name: "Memecoin strong narrative low market cap",
    description: "Memecoins with strong narrative and low market cap.",
    priceUsd: PRICE.default,
    examplePrompt: "Strong narrative low market cap memecoins",
    category: "memecoin",
  },
  {
    id: "memecoin-by-experienced-devs",
    name: "Memecoin by experienced devs",
    description: "Memecoins by experienced developers.",
    priceUsd: PRICE.default,
    examplePrompt: "Memecoins by experienced devs",
    category: "memecoin",
  },
  {
    id: "memecoin-unusual-whale-behavior",
    name: "Memecoin unusual whale behavior",
    description: "Memecoins with unusual whale behavior.",
    priceUsd: PRICE.default,
    examplePrompt: "Unusual whale behavior memecoins",
    category: "memecoin",
  },
  {
    id: "memecoin-trending-on-x-not-dex",
    name: "Memecoin trending on X not DEX",
    description: "Memecoins trending on X but not yet on DEX.",
    priceUsd: PRICE.default,
    examplePrompt: "Memecoins trending on X not DEX",
    category: "memecoin",
  },
  {
    id: "memecoin-organic-traction",
    name: "Memecoin organic traction",
    description: "Memecoins with organic traction (AI).",
    priceUsd: PRICE.default,
    examplePrompt: "Organic traction memecoins",
    category: "memecoin",
  },
  {
    id: "memecoin-surviving-market-dumps",
    name: "Memecoin surviving market dumps",
    description: "Memecoins surviving market dumps.",
    priceUsd: PRICE.default,
    examplePrompt: "Memecoins surviving market dumps",
    category: "memecoin",
  },
];

function formatPrice(usd: number): string {
  if (usd < 0.001) return "< $0.001";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

export function getToolsByCategory() {
  const core = AGENT_TOOLS_CATALOG.filter((t) => t.category === "core");
  const partner = AGENT_TOOLS_CATALOG.filter((t) => t.category === "partner");
  const memecoin = AGENT_TOOLS_CATALOG.filter((t) => t.category === "memecoin");
  return { core, partner, memecoin };
}

export { formatPrice };
