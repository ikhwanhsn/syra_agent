/**
 * Internal news agent — RSS sources, timeouts, ticker keywords.
 */

export const INTERNAL_NEWS_RSS_TIMEOUT_MS = Math.min(
  30_000,
  Math.max(3_000, Number.parseInt(process.env.INTERNAL_NEWS_RSS_TIMEOUT_MS || "8000", 10)),
);

export const INTERNAL_NEWS_CACHE_TTL_MS = Math.min(
  600_000,
  Math.max(30_000, Number.parseInt(process.env.INTERNAL_NEWS_CACHE_TTL_MS || "90000", 10)),
);

/** How often the sentiment pipeline runs (default 6h). */
export const INTERNAL_NEWS_SENTIMENT_CRON_MS = Math.min(
  24 * 60 * 60 * 1000,
  Math.max(60_000, Number.parseInt(process.env.INTERNAL_NEWS_SENTIMENT_CRON_MS || String(6 * 60 * 60 * 1000), 10)),
);

/** Rolling sentiment window (days) returned by /sentiment. */
export const INTERNAL_NEWS_SENTIMENT_LOOKBACK_DAYS = Math.min(
  90,
  Math.max(7, Number.parseInt(process.env.INTERNAL_NEWS_SENTIMENT_LOOKBACK_DAYS || "30", 10)),
);

/** Max articles fed to LLM per sentiment tick. */
export const INTERNAL_NEWS_SENTIMENT_BATCH_SIZE = Math.min(
  80,
  Math.max(10, Number.parseInt(process.env.INTERNAL_NEWS_SENTIMENT_BATCH_SIZE || "40", 10)),
);

/**
 * @typedef {{ id: string; name: string; url: string }} RssSource
 */

/** @type {readonly RssSource[]} */
export const INTERNAL_NEWS_RSS_SOURCES = Object.freeze([
  { id: "coindesk", name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { id: "cointelegraph", name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { id: "decrypt", name: "Decrypt", url: "https://decrypt.co/feed" },
  { id: "theblock", name: "The Block", url: "https://www.theblock.co/rss.xml" },
  { id: "cryptoslate", name: "CryptoSlate", url: "https://cryptoslate.com/feed/" },
  { id: "bitcoinmagazine", name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed" },
  { id: "cryptobriefing", name: "CryptoBriefing", url: "https://cryptobriefing.com/feed/" },
  { id: "beincrypto", name: "BeInCrypto", url: "https://beincrypto.com/feed/" },
  { id: "newsbtc", name: "NewsBTC", url: "https://www.newsbtc.com/feed/" },
  { id: "coinjournal", name: "CoinJournal", url: "https://coinjournal.net/feed/" },
]);

/** CoinMarketCal public RSS (events). */
export const COINMARKETCAL_RSS_URL =
  (process.env.COINMARKETCAL_RSS_URL || "https://coinmarketcal.com/en/rss").trim();

/**
 * Ticker → lowercase keywords for article matching.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const TICKER_KEYWORD_MAP = Object.freeze({
  BTC: ["bitcoin", "btc", "$btc"],
  ETH: ["ethereum", "eth", "$eth", "ether"],
  SOL: ["solana", "sol", "$sol"],
  BNB: ["bnb", "binance coin", "$bnb"],
  XRP: ["xrp", "ripple", "$xrp"],
  ADA: ["cardano", "ada", "$ada"],
  DOGE: ["dogecoin", "doge", "$doge"],
  AVAX: ["avalanche", "avax", "$avax"],
  DOT: ["polkadot", "dot", "$dot"],
  MATIC: ["polygon", "matic", "$matic", "pol"],
  LINK: ["chainlink", "link", "$link"],
  UNI: ["uniswap", "uni", "$uni"],
  ATOM: ["cosmos", "atom", "$atom"],
  LTC: ["litecoin", "ltc", "$ltc"],
  NEAR: ["near protocol", "near", "$near"],
  APT: ["aptos", "apt", "$apt"],
  ARB: ["arbitrum", "arb", "$arb"],
  OP: ["optimism", "$op", " op "],
  SUI: ["sui", "$sui"],
  PEPE: ["pepe", "$pepe"],
  WIF: ["dogwifhat", "wif", "$wif"],
  TRUMP: ["trump", "$trump", "maga"],
});

/**
 * @param {string} ticker
 * @returns {string[]}
 */
export function keywordsForTicker(ticker) {
  const t = String(ticker || "").trim().toUpperCase();
  if (!t || t === "GENERAL") return [];
  const mapped = TICKER_KEYWORD_MAP[t];
  if (mapped) return [...mapped];
  return [t.toLowerCase(), `$${t.toLowerCase()}`];
}
