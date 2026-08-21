import { MCP_TOOL_CATALOG, type McpToolCatalogEntry } from "./generated/toolCatalog.js";

export const SYRA_SKILL_URL = "https://api.syraa.fun/skill.md";
export const SYRA_SKILL_SETUP_LINE = "set up https://api.syraa.fun/skill.md";

export const SYRA_CONSULT_SUGGESTIONS = [
  "Get BTC news",
  "What's ETH sentiment?",
  "TVL for Aave",
  "Agent economy x402 stats",
] as const;

export type ConsultCall = {
  toolName: string;
  toolId: string;
  params: Record<string, string>;
  max_cost_usd: number;
  why: string;
};

export type ConsultResult = {
  mode: "call" | "unsupported";
  billed: false;
  message: string;
  calls?: ConsultCall[];
  suggestions: string[];
};

const TICKER_ALIASES: Record<string, string> = {
  btc: "BTC",
  bitcoin: "BTC",
  eth: "ETH",
  ethereum: "ETH",
  sol: "SOL",
  solana: "SOL",
};

const TICKER_STOP = new Set([
  "and",
  "the",
  "for",
  "news",
  "latest",
  "get",
  "give",
  "show",
  "about",
  "with",
  "from",
]);

const PROTOCOL_SLUGS = [
  "aave",
  "uniswap",
  "jupiter",
  "marinade",
  "jito",
  "lido",
  "maker",
  "compound",
  "curve",
  "morpho",
] as const;

const CHAIN_NAMES: Record<string, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
  avalanche: "Avalanche",
};

const UNSUPPORTED_RE =
  /\b(hero image|landing page|generate (an? )?(image|video|audio)|send email|phone call|book a table|headless browser|scrape (this )?(url|page)|github credit|prepaid pack)\b/i;

function curatedOnly(catalog: McpToolCatalogEntry[]): McpToolCatalogEntry[] {
  return catalog.filter((entry) => entry.curated);
}

function requireTool(catalog: McpToolCatalogEntry[], toolId: string): McpToolCatalogEntry {
  const found = catalog.find((entry) => entry.toolId === toolId);
  if (!found) {
    throw new Error(`syra_consult: curated toolId "${toolId}" missing from catalog`);
  }
  return found;
}

function extractTicker(intent: string): string | undefined {
  const lower = intent.toLowerCase();
  for (const [alias, ticker] of Object.entries(TICKER_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(lower)) return ticker;
  }
  const match = lower.match(/\b([a-z0-9]{2,10})\b/g) ?? [];
  for (const token of match) {
    if (TICKER_STOP.has(token)) continue;
    if (TICKER_ALIASES[token]) return TICKER_ALIASES[token];
  }
  return undefined;
}

function extractProtocol(intent: string): string | undefined {
  const lower = intent.toLowerCase();
  return PROTOCOL_SLUGS.find((slug) => lower.includes(slug));
}

function extractChain(intent: string): string | undefined {
  const lower = intent.toLowerCase();
  for (const [alias, name] of Object.entries(CHAIN_NAMES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(lower)) return name;
  }
  return undefined;
}

function extractMint(intent: string): string | undefined {
  const match = intent.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/);
  return match?.[0];
}

function toCall(entry: McpToolCatalogEntry, params: Record<string, string>, why: string): ConsultCall {
  return {
    toolName: entry.toolName,
    toolId: entry.toolId,
    params,
    max_cost_usd: entry.priceUsd,
    why,
  };
}

function callResult(call: ConsultCall, message: string): ConsultResult {
  return {
    mode: "call",
    billed: false,
    message,
    calls: [call],
    suggestions: [...SYRA_CONSULT_SUGGESTIONS],
  };
}

function unsupported(message: string): ConsultResult {
  return {
    mode: "unsupported",
    billed: false,
    message,
    suggestions: [...SYRA_CONSULT_SUGGESTIONS],
  };
}

function scoreEntry(intent: string, entry: McpToolCatalogEntry): number {
  const hay = `${entry.toolId} ${entry.toolName} ${entry.name} ${entry.description}`.toLowerCase();
  const tokens = intent
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !TICKER_STOP.has(t));
  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) score += token.length >= 5 ? 2 : 1;
  }
  return score;
}

/**
 * Map a plain-language crypto-intel intent to one curated MCP tool.
 * Does not execute or bill.
 */
export function consultSyraIntent(
  intent: string,
  catalog: McpToolCatalogEntry[] = MCP_TOOL_CATALOG,
): ConsultResult {
  const trimmed = intent.trim();
  const curated = curatedOnly(catalog);

  if (!trimmed) {
    return unsupported(
      "No intent. Rephrase toward crypto news, sentiment, TVL, or smart money. Consult does not bill.",
    );
  }

  if (UNSUPPORTED_RE.test(trimmed)) {
    return unsupported(
      "Syra is pay-per-call crypto intel over x402, not a general tool mall. Try news, sentiment, or TVL.",
    );
  }

  const lower = trimmed.toLowerCase();
  const ticker = extractTicker(trimmed);
  const protocol = extractProtocol(trimmed);
  const chain = extractChain(trimmed);
  const mint = extractMint(trimmed);

  const news = requireTool(curated, "news");
  const sentiment = requireTool(curated, "sentiment");
  const signal = requireTool(curated, "signal");
  const tvl = requireTool(curated, "defillama-tvl");
  const agentEconomy = requireTool(curated, "agent-economy-summary");
  const nansen = requireTool(curated, "nansen-smart-money-netflow");
  const rug = requireTool(curated, "rugcheck-report");
  const pyth = requireTool(curated, "pyth-price");
  const pump = requireTool(curated, "pumpfun-scout");
  const dex = requireTool(curated, "dexscreener-pairs");
  const web = requireTool(curated, "web-search");
  const analytics = requireTool(curated, "analytics-summary");

  if (/\b(rug|scam|honeypot|risk report)\b/.test(lower) && mint) {
    return callResult(
      toCall(rug, { mint }, "Solana token risk report for the mint in the intent."),
      "Call syra_spend_rugcheck_report next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(tvl|defillama|defi llama|total value locked)\b/.test(lower)) {
    const params: Record<string, string> = {};
    if (protocol) params.protocol = protocol;
    else if (chain) params.chain = chain;
    else params.protocol = "aave";
    return callResult(
      toCall(tvl, params, "DefiLlama TVL for the protocol or chain in the intent."),
      "Call syra_spend_defillama_tvl next. Consult did not run it and did not charge.",
    );
  }

  if (
    /\b(agent\s*economy|agenteconomy|x402\s*(ecosystem|totals?|volume|stats?)|erc[- ]?8004\s*(registry|agents?)|mcp\s*registry\s*count)\b/.test(
      lower,
    )
  ) {
    return callResult(
      toCall(agentEconomy, {}, "Curated agent-economy headlines from agenteconomy.to."),
      "Call syra_spend_agent_economy_summary next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(sentiment|fear|greed|mood)\b/.test(lower)) {
    const params = ticker ? { ticker } : { ticker: "BTC" };
    return callResult(
      toCall(sentiment, params, "Market sentiment for the named ticker."),
      "Call syra_spend_sentiment next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(signal|ohlc|technical|rsi|macd)\b/.test(lower)) {
    const params = ticker ? { ticker } : { ticker: "BTC" };
    return callResult(
      toCall(signal, params, "Spot OHLC plus technical signal."),
      "Call syra_spend_signal next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(smart money|nansen|whale flow|netflow)\b/.test(lower)) {
    return callResult(
      toCall(nansen, { chains: "solana" }, "Smart-money netflow on Solana via Nansen."),
      "Call syra_spend_nansen_smart_money_netflow next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(pump\.fun|pumpfun|memecoin)\b/.test(lower)) {
    return callResult(
      toCall(pump, { segment: "alpha" }, "pump.fun scout for memecoin screens."),
      "Call syra_spend_pumpfun_scout next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(dexscreener|dex pair|liquidity pool)\b/.test(lower)) {
    return callResult(
      toCall(dex, ticker ? { q: ticker } : { q: "SOL" }, "On-chain DEX pairs from DexScreener."),
      "Call syra_spend_dexscreener_pairs next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(pyth|oracle price)\b/.test(lower)) {
    const symbol = ticker ? `${ticker}/USD` : "BTC/USD";
    return callResult(
      toCall(pyth, { symbols: symbol }, "Pyth oracle price for the named symbol."),
      "Call syra_spend_pyth_price next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(web search|search the web|duckduckgo)\b/.test(lower)) {
    return callResult(
      toCall(web, { q: trimmed }, "Web search when the intent is not a first-party intel route."),
      "Call syra_spend_web_search next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(analytics|trending headline|market pulse)\b/.test(lower)) {
    return callResult(
      toCall(analytics, {}, "Bundled analytics: trending plus smart money."),
      "Call syra_spend_analytics_summary next. Consult did not run it and did not charge.",
    );
  }

  if (/\b(news|headline|headlines)\b/.test(lower) || ticker) {
    const params = { ticker: ticker ?? "BTC" };
    return callResult(
      toCall(news, params, "Cheapest first paid Spend path for crypto news."),
      "Call syra_spend_news next. Consult did not run it and did not charge.",
    );
  }

  let best: { entry: McpToolCatalogEntry; score: number } | null = null;
  for (const entry of curated) {
    const score = scoreEntry(trimmed, entry);
    if (!best || score > best.score) best = { entry, score };
  }
  if (best && best.score >= 3) {
    const params: Record<string, string> = ticker ? { ticker } : {};
    return callResult(
      toCall(best.entry, params, `Best curated match for "${trimmed}".`),
      `Call ${best.entry.toolName} next. Consult did not run it and did not charge.`,
    );
  }

  return callResult(
    toCall(news, { ticker: "BTC" }, "Default first paid call when the intent is crypto-intel but unspecific."),
    "Call syra_spend_news next (BTC). Consult did not run it and did not charge.",
  );
}
