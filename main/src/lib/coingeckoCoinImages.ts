/**
 * CoinGecko public API (free tier, no key) for official coin thumbnails.
 * @see https://docs.coingecko.com/reference/coins-markets
 */

const MARKETS_ENDPOINT = "https://api.coingecko.com/api/v3/coins/markets";
const BATCH_SIZE = 12;

/**
 * Trading experiment / Binance builder uses CoinGecko **coin ids** (e.g. `bitcoin`),
 * while `/coins/markets?symbols=` expects **tickers** (`btc`). Querying `symbols=bitcoin`
 * returns unrelated tokens whose symbol is literally "bitcoin".
 */
const COINGECKO_ID_OR_ALIAS_TO_TICKER: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  xrp: "XRP",
  ripple: "XRP",
  dogecoin: "DOGE",
  cardano: "ADA",
  bnb: "BNB",
  binancecoin: "BNB",
  polygon: "MATIC",
  "matic-network": "MATIC",
  maticnetwork: "MATIC",
  matic: "MATIC",
  avalanche: "AVAX",
  "avalanche-2": "AVAX",
  chainlink: "LINK",
  polkadot: "DOT",
  litecoin: "LTC",
};

export type CoinGeckoMarketRow = {
  symbol: string;
  image: string;
  market_cap_rank?: number | null;
  market_cap?: number | null;
};

function isMarketRow(v: unknown): v is CoinGeckoMarketRow {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.symbol === "string" && typeof o.image === "string";
}

function tickerFromCoingeckoIdOrAlias(fragment: string): string | null {
  const f = fragment.trim();
  if (!f) return null;
  const variants = [
    f.toLowerCase(),
    f.toLowerCase().replace(/_/g, "-"),
    f.toLowerCase().replace(/[-_\s]+/g, ""),
  ];
  for (const v of variants) {
    const t = COINGECKO_ID_OR_ALIAS_TO_TICKER[v];
    if (t) return t;
  }
  return null;
}

function rankScore(marketCapRank: number | null | undefined): number {
  if (typeof marketCapRank === "number" && Number.isFinite(marketCapRank) && marketCapRank > 0) {
    return marketCapRank;
  }
  return 999_999;
}

function pickBetterMarket(a: CoinGeckoMarketRow, b: CoinGeckoMarketRow): CoinGeckoMarketRow {
  const ra = rankScore(a.market_cap_rank);
  const rb = rankScore(b.market_cap_rank);
  if (ra !== rb) return ra < rb ? a : b;
  const ma = typeof a.market_cap === "number" && Number.isFinite(a.market_cap) ? a.market_cap : 0;
  const mb = typeof b.market_cap === "number" && Number.isFinite(b.market_cap) ? b.market_cap : 0;
  return ma >= mb ? a : b;
}

/**
 * Normalizes tickers, CoinGecko ids, or pair strings to an uppercase ticker for
 * CoinGecko `symbols=` and CDN filenames (e.g. `bitcoin` → `BTC`, `BTC_USDT` → `BTC`).
 */
export function coinGeckoLookupKey(raw: string): string {
  let s = raw.trim();
  if (!s) return "";

  const direct = tickerFromCoingeckoIdOrAlias(s);
  if (direct) return direct;

  const slash = s.indexOf("/");
  if (slash > 0) s = s.slice(0, slash);
  const pairBase = s.split(/[_/]/)[0]?.trim() ?? s;
  const fromPair = tickerFromCoingeckoIdOrAlias(pairBase);
  if (fromPair) return fromPair;

  s = pairBase.replace(/[-\s]/g, "");
  let upper = s.toUpperCase();
  const stripped = upper.replace(/(USDT|USDC|USD|PERP|BUSD|FDUSD|EUR)$/i, "");
  return stripped.length > 0 ? stripped : upper;
}

/**
 * Fetches `thumb`-quality image URLs from CoinGecko, keyed by {@link coinGeckoLookupKey}.
 */
export async function fetchCoinGeckoImagesBatch(lookupKeys: readonly string[]): Promise<Record<string, string>> {
  const keys = [...new Set(lookupKeys.map((k) => coinGeckoLookupKey(k)).filter((k) => k.length > 0))];
  if (keys.length === 0) return {};

  const out: Record<string, string> = {};

  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const chunk = keys.slice(i, i + BATCH_SIZE);
    const q = chunk.map((k) => k.toLowerCase()).join(",");
    const url = `${MARKETS_ENDPOINT}?vs_currency=usd&symbols=${encodeURIComponent(q)}&per_page=250&page=1`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const json: unknown = await res.json();
    if (!Array.isArray(json)) continue;

    const bestByTicker: Record<string, CoinGeckoMarketRow> = {};
    for (const item of json) {
      if (!isMarketRow(item)) continue;
      const k = item.symbol.toUpperCase();
      const prev = bestByTicker[k];
      if (!prev) bestByTicker[k] = item;
      else bestByTicker[k] = pickBetterMarket(prev, item);
    }
    for (const [k, row] of Object.entries(bestByTicker)) {
      if (!out[k]) out[k] = row.image;
    }
  }

  return out;
}
