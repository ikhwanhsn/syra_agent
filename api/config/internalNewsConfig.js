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
 * @typedef {{ id: string; name: string; url: string; category?: string }} RssSource
 */

/** Crypto-native publishers */
/** @type {readonly RssSource[]} */
export const INTERNAL_NEWS_RSS_SOURCES_CRYPTO = Object.freeze([
  { id: "coindesk", name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto" },
  { id: "cointelegraph", name: "Cointelegraph", url: "https://cointelegraph.com/rss", category: "crypto" },
  { id: "decrypt", name: "Decrypt", url: "https://decrypt.co/feed", category: "crypto" },
  { id: "theblock", name: "The Block", url: "https://www.theblock.co/rss.xml", category: "crypto" },
  { id: "cryptoslate", name: "CryptoSlate", url: "https://cryptoslate.com/feed/", category: "crypto" },
  { id: "bitcoinmagazine", name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed", category: "crypto" },
  { id: "cryptobriefing", name: "CryptoBriefing", url: "https://cryptobriefing.com/feed/", category: "crypto" },
  { id: "beincrypto", name: "BeInCrypto", url: "https://beincrypto.com/feed/", category: "crypto" },
  { id: "newsbtc", name: "NewsBTC", url: "https://www.newsbtc.com/feed/", category: "crypto" },
  { id: "coinjournal", name: "CoinJournal", url: "https://coinjournal.net/feed/", category: "crypto" },
  { id: "blockworks", name: "Blockworks", url: "https://blockworks.co/feed", category: "crypto" },
  { id: "dlnews", name: "DL News", url: "https://www.dlnews.com/arc/outboundfeeds/rss/", category: "crypto" },
  { id: "utoday", name: "U.Today", url: "https://u.today/rss", category: "crypto" },
  { id: "dailyhodl", name: "The Daily Hodl", url: "https://dailyhodl.com/feed/", category: "crypto" },
]);

/** Markets, business, macro — helps tokenized equities & macro context */
/** @type {readonly RssSource[]} */
export const INTERNAL_NEWS_RSS_SOURCES_MARKETS = Object.freeze([
  { id: "reuters-business", name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews", category: "markets" },
  { id: "cnbc-top", name: "CNBC Top News", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", category: "markets" },
  { id: "cnbc-finance", name: "CNBC Finance", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258", category: "markets" },
  { id: "marketwatch", name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/", category: "markets" },
  { id: "yahoo-finance", name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", category: "markets" },
  { id: "bbc-business", name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "markets" },
  { id: "npr-business", name: "NPR Business", url: "https://feeds.npr.org/1007/rss.xml", category: "markets" },
  { id: "seekingalpha", name: "Seeking Alpha", url: "https://seekingalpha.com/market_currents.xml", category: "markets" },
  { id: "benzinga", name: "Benzinga", url: "https://www.benzinga.com/feed", category: "markets" },
  { id: "businessinsider", name: "Business Insider", url: "https://www.businessinsider.com/rss", category: "markets" },
  { id: "forbes-business", name: "Forbes Business", url: "https://www.forbes.com/business/feed/", category: "markets" },
  { id: "investing-news", name: "Investing.com", url: "https://www.investing.com/rss/news.rss", category: "markets" },
  { id: "ap-business", name: "AP Business", url: "https://apnews.com/apf-business", category: "markets" },
]);

/** Technology — covers gaming, platforms, tech equities (e.g. Roblox, Apple) */
/** @type {readonly RssSource[]} */
export const INTERNAL_NEWS_RSS_SOURCES_TECH = Object.freeze([
  { id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "tech" },
  { id: "theverge", name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "tech" },
  { id: "arstechnica", name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", category: "tech" },
  { id: "wired", name: "Wired", url: "https://www.wired.com/feed/rss", category: "tech" },
  { id: "bbc-tech", name: "BBC Technology", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", category: "tech" },
  { id: "engadget", name: "Engadget", url: "https://www.engadget.com/rss.xml", category: "tech" },
  { id: "venturebeat", name: "VentureBeat", url: "https://venturebeat.com/feed/", category: "tech" },
  { id: "gamesindustry", name: "GamesIndustry.biz", url: "https://www.gamesindustry.biz/feed", category: "tech" },
]);

/**
 * Optional extra feeds from env — comma-separated URLs.
 * Example: INTERNAL_NEWS_EXTRA_RSS_URLS=https://example.com/feed.xml,https://other.com/rss
 * @returns {RssSource[]}
 */
export function parseExtraRssSourcesFromEnv() {
  const raw = String(process.env.INTERNAL_NEWS_EXTRA_RSS_URLS || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((url) => /^https?:\/\//i.test(url))
    .map((url, i) => {
      let hostname = "Extra";
      try {
        hostname = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        /* keep default */
      }
      return {
        id: `extra-${i}-${hostname.replace(/[^a-z0-9]+/gi, "-").slice(0, 24)}`,
        name: hostname,
        url,
        category: "extra",
      };
    });
}

/**
 * All RSS sources used by the internal news agent.
 * @returns {readonly RssSource[]}
 */
export function getInternalNewsRssSources() {
  return Object.freeze([
    ...INTERNAL_NEWS_RSS_SOURCES_CRYPTO,
    ...INTERNAL_NEWS_RSS_SOURCES_MARKETS,
    ...INTERNAL_NEWS_RSS_SOURCES_TECH,
    ...parseExtraRssSourcesFromEnv(),
  ]);
}

/** @deprecated Use getInternalNewsRssSources() — kept for imports that expect a static list */
export const INTERNAL_NEWS_RSS_SOURCES = getInternalNewsRssSources();

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

/**
 * Build asset-scoped search keywords (name-first; no unrelated crypto fallback terms).
 * @param {{ ticker?: string; name?: string; coinName?: string; assetId?: string }} input
 * @returns {{ primary: string[]; all: string[] }}
 */
export function keywordsForAsset(input = {}) {
  /** @type {Set<string>} */
  const primary = new Set();
  /** @type {Set<string>} */
  const all = new Set();
  const ticker = String(input.ticker || "").trim().toUpperCase();

  for (const raw of [input.name, input.coinName]) {
    if (!raw) continue;
    let cleaned = String(raw).trim();
    if (!cleaned) continue;
    cleaned = cleaned
      .replace(/\s*xstock\s*/gi, " ")
      .replace(/-xstock$/i, "")
      .replace(/_/g, " ")
      .trim();
    if (cleaned.length >= 3) {
      all.add(cleaned.toLowerCase());
      const first = cleaned.split(/[\s-]+/)[0];
      if (first && first.length >= 3) {
        primary.add(first.toLowerCase());
        all.add(first.toLowerCase());
      }
    }
  }

  if (ticker && ticker !== "GENERAL") {
    const mapped = TICKER_KEYWORD_MAP[ticker];
    if (mapped) {
      for (const kw of mapped) {
        primary.add(kw.toLowerCase());
        all.add(kw.toLowerCase());
      }
    } else {
      all.add(ticker.toLowerCase());
      all.add(`$${ticker.toLowerCase()}`);
      if (/X{1,2}$/.test(ticker) && ticker.length > 3) {
        const base = ticker.replace(/X{1,2}$/, "");
        if (base.length >= 2) {
          all.add(base.toLowerCase());
          all.add(`$${base.toLowerCase()}`);
        }
      }
    }
  }

  for (const raw of [input.assetId]) {
    if (!raw) continue;
    const id = String(raw)
      .trim()
      .replace(/-xstock$/i, "")
      .replace(/_/g, " ");
    if (id.length >= 3 && !id.includes(" ")) {
      all.add(id.toLowerCase());
    }
  }

  return {
    primary: [...primary],
    all: [...all],
  };
}
