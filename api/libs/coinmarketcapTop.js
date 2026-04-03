/**
 * CoinMarketCap top listings for arbitrage experiment token picker.
 *
 * Env: COINMARKETCAP_API_KEY — if unset, uses a static fallback list (major caps).
 * Stablecoins in the raw top N are skipped and replaced with the next ranked assets
 * so cross-venue spot comparison stays meaningful.
 */

const CMC_LISTINGS_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest";

/** Skip USD-pegged / stables when building the tradable top-10 set. */
const STABLE_SYMBOLS = new Set([
  "USDT",
  "USDC",
  "DAI",
  "BUSD",
  "FDUSD",
  "USDE",
  "TUSD",
  "USDD",
  "PYUSD",
  "USDP",
  "GUSD",
  "LUSD",
  "FRAX",
  "CRVUSD",
]);

/**
 * Map CMC `symbol` to the token slug used by Syra CEX resolvers (see binanceSignalAnalysis, etc.).
 * Prefer canonical slugs where Kraken/Binance maps differ (e.g. BTC → bitcoin).
 */
const CMC_SYMBOL_TO_CEX_TOKEN = Object.freeze({
  BTC: "bitcoin",
  ETH: "ethereum",
  XRP: "xrp",
  BNB: "bnb",
  SOL: "solana",
  USDT: "tether",
  USDC: "usd-coin",
  TRX: "tron",
  DOGE: "dogecoin",
  ADA: "cardano",
  LINK: "chainlink",
  AVAX: "avalanche",
  SHIB: "shib",
  DOT: "polkadot",
  MATIC: "polygon",
  LTC: "litecoin",
  TON: "ton",
  UNI: "uniswap",
  ATOM: "cosmos",
  NEAR: "near",
  APT: "aptos",
  HBAR: "hedera",
  PEPE: "pepe",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  CRO: "crypto-com-chain",
});

/** When API key is missing or CMC fails — representative large-cap set (non-stable). */
const FALLBACK_TOP = Object.freeze([
  { cmcRank: 1, symbol: "BTC", name: "Bitcoin", cexToken: "bitcoin" },
  { cmcRank: 2, symbol: "ETH", name: "Ethereum", cexToken: "ethereum" },
  { cmcRank: 3, symbol: "XRP", name: "XRP", cexToken: "xrp" },
  { cmcRank: 4, symbol: "BNB", name: "BNB", cexToken: "bnb" },
  { cmcRank: 5, symbol: "SOL", name: "Solana", cexToken: "solana" },
  { cmcRank: 6, symbol: "TRX", name: "TRON", cexToken: "tron" },
  { cmcRank: 7, symbol: "DOGE", name: "Dogecoin", cexToken: "dogecoin" },
  { cmcRank: 8, symbol: "ADA", name: "Cardano", cexToken: "cardano" },
  { cmcRank: 9, symbol: "LINK", name: "Chainlink", cexToken: "chainlink" },
  { cmcRank: 10, symbol: "AVAX", name: "Avalanche", cexToken: "avalanche" },
]);

/**
 * @param {string} symbol
 * @param {string} [slug] - CMC slug e.g. "bitcoin"
 * @returns {string}
 */
function cexTokenFromListing(symbol, slug) {
  const sym = String(symbol || "").trim().toUpperCase();
  if (CMC_SYMBOL_TO_CEX_TOKEN[sym]) return CMC_SYMBOL_TO_CEX_TOKEN[sym];
  const s = String(slug || "").trim().toLowerCase();
  if (s && /^[a-z0-9-]{1,64}$/.test(s)) return s;
  return sym.toLowerCase();
}

/**
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<{ source: "coinmarketcap" | "fallback"; fetchedAt: string; assets: { cmcRank: number; symbol: string; name: string; cexToken: string }[] }>}
 */
export async function fetchCmcTopTradableAssets(opts = {}) {
  const want = Math.min(25, Math.max(1, Math.floor(opts.limit ?? 10)));
  const key = (process.env.COINMARKETCAP_API_KEY || "").trim();

  if (!key) {
    return {
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      assets: FALLBACK_TOP.slice(0, want),
    };
  }

  const url = new URL(CMC_LISTINGS_URL);
  url.searchParams.set("start", "1");
  url.searchParams.set("limit", "50");
  url.searchParams.set("convert", "USD");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-CMC_PRO_API_KEY": key,
    },
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = j?.status?.error_message || j?.error || res.statusText || "CMC request failed";
    throw new Error(`CoinMarketCap: ${msg}`);
  }
  const data = j?.data;
  if (!Array.isArray(data)) {
    throw new Error("CoinMarketCap: invalid listings payload");
  }

  /** @type {{ cmcRank: number; symbol: string; name: string; cexToken: string }[]} */
  const out = [];
  for (const row of data) {
    if (out.length >= want) break;
    const symbol = String(row?.symbol || "").trim().toUpperCase();
    if (!symbol || STABLE_SYMBOLS.has(symbol)) continue;
    const name = String(row?.name || symbol);
    const slug = typeof row?.slug === "string" ? row.slug : "";
    const rank = Number(row?.cmc_rank ?? row?.rank);
    out.push({
      cmcRank: Number.isFinite(rank) ? rank : out.length + 1,
      symbol,
      name,
      cexToken: cexTokenFromListing(symbol, slug),
    });
  }

  if (out.length === 0) {
    return {
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      assets: FALLBACK_TOP.slice(0, want),
    };
  }

  return {
    source: "coinmarketcap",
    fetchedAt: new Date().toISOString(),
    assets: out,
  };
}
