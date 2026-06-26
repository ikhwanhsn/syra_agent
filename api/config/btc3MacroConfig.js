/**
 * Macro Intelligence Agent (BTC3) — providers, taxonomies, intervals, env.
 */

import { resolveInternalPipelineModel } from "./internalPipelineAgents.js";

/** Pipeline tick interval (default 5 minutes). */
export const BTC3_MACRO_CRON_MS = Math.min(
  60 * 60 * 1000,
  Math.max(60_000, Number.parseInt(process.env.BTC3_MACRO_CRON_MS || String(5 * 60 * 1000), 10)),
);

export const BTC3_MACRO_RSS_TIMEOUT_MS = Math.min(
  30_000,
  Math.max(3_000, Number.parseInt(process.env.BTC3_MACRO_RSS_TIMEOUT_MS || "10000", 10)),
);

export const BTC3_MACRO_ARTICLE_BATCH_SIZE = Math.min(
  50,
  Math.max(5, Number.parseInt(process.env.BTC3_MACRO_ARTICLE_BATCH_SIZE || "20", 10)),
);

export const BTC3_MACRO_SIMILARITY_TOP_K = Math.min(
  20,
  Math.max(3, Number.parseInt(process.env.BTC3_MACRO_SIMILARITY_TOP_K || "5", 10)),
);

export const BTC3_MACRO_CRON_SECRET = (process.env.BTC3_MACRO_CRON_SECRET || "").trim();

export function isBtc3MacroCronEnabled() {
  const raw = (process.env.BTC3_MACRO_CRON_ENABLED || "true").trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "off";
}

export function resolveBtc3MacroLlmModel() {
  const fromEnv = (process.env.BTC3_MACRO_OPENROUTER_MODEL || "").trim();
  return fromEnv || resolveInternalPipelineModel(null);
}

export function getQdrantConfig() {
  const url = (process.env.QDRANT_URL || "").trim().replace(/\/$/, "");
  const apiKey = (process.env.QDRANT_API_KEY || "").trim();
  const collection = (process.env.QDRANT_COLLECTION || "btc3_macro_events").trim();
  return { url, apiKey, collection, configured: Boolean(url) };
}

export function getEmbeddingConfig() {
  const apiKey = (process.env.OPENAI_API_KEY || process.env.BTC3_EMBEDDING_API_KEY || "").trim();
  const baseUrl = (process.env.BTC3_EMBEDDING_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = (process.env.BTC3_EMBEDDING_MODEL || "text-embedding-3-small").trim();
  return { apiKey, baseUrl, model, configured: Boolean(apiKey) };
}

/** @typedef {"rss"|"api"|"unavailable"} NewsProviderType */

/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   type: NewsProviderType;
 *   url?: string;
 *   category: string;
 *   enabled: boolean;
 *   status: "active"|"todo"|"disabled";
 *   notes?: string;
 * }} Btc3NewsProviderDef
 */

/** @type {readonly Btc3NewsProviderDef[]} */
export const BTC3_NEWS_PROVIDERS = Object.freeze([
  {
    id: "reuters",
    name: "Reuters",
    type: "api",
    category: "markets",
    enabled: false,
    status: "todo",
    notes: "Requires Reuters API credentials — RSS fallback via reuters-business when enabled",
  },
  {
    id: "reuters-business",
    name: "Reuters Business (RSS)",
    type: "rss",
    url: "https://feeds.reuters.com/reuters/businessNews",
    category: "markets",
    enabled: true,
    status: "active",
  },
  {
    id: "bloomberg",
    name: "Bloomberg",
    type: "api",
    category: "markets",
    enabled: false,
    status: "todo",
    notes: "Requires Bloomberg Terminal / API subscription",
  },
  {
    id: "financial-times",
    name: "Financial Times",
    type: "api",
    category: "markets",
    enabled: false,
    status: "todo",
    notes: "Requires FT API credentials",
  },
  {
    id: "coindesk",
    name: "CoinDesk",
    type: "rss",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "crypto",
    enabled: true,
    status: "active",
  },
  {
    id: "cointelegraph",
    name: "Cointelegraph",
    type: "rss",
    url: "https://cointelegraph.com/rss",
    category: "crypto",
    enabled: true,
    status: "active",
  },
  {
    id: "theblock",
    name: "The Block",
    type: "rss",
    url: "https://www.theblock.co/rss.xml",
    category: "crypto",
    enabled: true,
    status: "active",
  },
  {
    id: "federal-reserve",
    name: "Federal Reserve",
    type: "rss",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    category: "central_bank",
    enabled: true,
    status: "active",
  },
  {
    id: "ecb",
    name: "European Central Bank",
    type: "rss",
    url: "https://www.ecb.europa.eu/rss/press.html",
    category: "central_bank",
    enabled: true,
    status: "active",
  },
  {
    id: "treasury",
    name: "US Treasury",
    type: "rss",
    url: "https://home.treasury.gov/system/files/136/TreasuryRSS.xml",
    category: "government",
    enabled: true,
    status: "active",
  },
]);

/** @type {readonly string[]} */
export const BTC3_CLASSIFICATION_CATEGORIES = Object.freeze([
  "Inflation",
  "Interest Rates",
  "Employment",
  "GDP",
  "Liquidity",
  "Politics",
  "War",
  "ETF",
  "Regulation",
  "Crypto",
  "Corporate",
  "Stablecoin",
  "Mining",
  "Bank Crisis",
  "Monetary Policy",
]);

/** @type {readonly string[]} */
export const BTC3_ENTITY_TYPES = Object.freeze([
  "person",
  "organization",
  "country",
  "asset",
  "macro_concept",
  "central_bank",
]);

import { TRADING_EXPERIMENT_STARTING_USD } from "./tradingExperimentSim.js";

export const BTC3_DEFAULT_PORTFOLIO = Object.freeze({
  btcPct: 40,
  usdcPct: 60,
  totalUsd: TRADING_EXPERIMENT_STARTING_USD,
  riskProfile: "moderate",
});

/** Paper sim defaults — mirrors BTC quant lab ($1,000 starting bank). */
export const BTC3_PAPER_SIM_DEFAULTS = Object.freeze({
  startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
  initialBtcPct: 40,
  minRebalancePct: 2,
  paperAutoExecute: true,
});

export function getBtc3PaperSimConfig(stateDoc) {
  const s = stateDoc?.simConfig || {};
  return {
    startingBankUsd: Math.max(
      100,
      Number.parseFloat(String(s.startingBankUsd ?? BTC3_PAPER_SIM_DEFAULTS.startingBankUsd)),
    ) || BTC3_PAPER_SIM_DEFAULTS.startingBankUsd,
    initialBtcPct: Math.min(
      85,
      Math.max(15, Number.parseFloat(String(s.initialBtcPct ?? BTC3_PAPER_SIM_DEFAULTS.initialBtcPct)) || 40),
    ),
    minRebalancePct: Math.max(
      0.5,
      Number.parseFloat(String(s.minRebalancePct ?? BTC3_PAPER_SIM_DEFAULTS.minRebalancePct)) || 2,
    ),
    paperAutoExecute: s.paperAutoExecute !== false,
  };
}

export const BTC3_REGIMES = Object.freeze({
  macro: ["risk_on", "risk_off", "neutral", "unknown"],
  market: ["bull", "bear", "range", "unknown"],
});

export function getBtc3RuntimeSettings() {
  return {
    cronEnabled: isBtc3MacroCronEnabled(),
    cronIntervalMs: BTC3_MACRO_CRON_MS,
    llmModel: resolveBtc3MacroLlmModel(),
    llmConfigured: Boolean((process.env.OPENROUTER_API_KEY || "").trim()),
    embedding: {
      ...getEmbeddingConfig(),
      configured: getEmbeddingConfig().configured,
    },
    qdrant: {
      ...getQdrantConfig(),
      configured: getQdrantConfig().configured,
    },
    redisConfigured: Boolean((process.env.SYRA_REDIS_URL || "").trim()),
    mongoConfigured: Boolean((process.env.MONGODB_URI || "").trim()),
    providers: BTC3_NEWS_PROVIDERS.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      category: p.category,
      enabled: p.enabled,
      status: p.status,
      notes: p.notes ?? null,
    })),
  };
}
