/**
 * xStocks (Backed Finance) public asset registry — official mints + trading status.
 * @see https://api.xstocks.fi/api/v2/public/assets
 */

const XSTOCKS_API_BASE = "https://api.xstocks.fi/api/v2/public/assets";

/** @typedef {{ address: string; network: string }} XStocksDeployment */

/**
 * @typedef {Object} XStocksAsset
 * @property {string} symbol
 * @property {string} name
 * @property {string} [isin]
 * @property {string} [underlyingSymbol]
 * @property {boolean} isTradingHalted
 * @property {string | null} solanaMint
 * @property {XStocksDeployment[]} deployments
 */

const cache = new Map();
const CACHE_TTL_MS = 5 * 60_000;

/**
 * @param {string} symbol - e.g. SPCXx, TSLAx
 * @returns {Promise<XStocksAsset | null>}
 */
export async function fetchXStocksAsset(symbol) {
  const sym = String(symbol || "").trim();
  if (!sym) return null;

  const cached = cache.get(sym);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `${XSTOCKS_API_BASE}/${encodeURIComponent(sym)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    const json = await res.json();
    const deployments = Array.isArray(json?.deployments) ? json.deployments : [];
    const solana = deployments.find(
      (d) => String(d?.network || "").toLowerCase() === "solana",
    );

    const data = {
      symbol: json.symbol || sym,
      name: json.name || sym,
      isin: json.isin,
      underlyingSymbol: json.underlyingSymbol,
      isTradingHalted: Boolean(json.isTradingHalted),
      solanaMint: solana?.address ? String(solana.address) : null,
      deployments,
    };

    cache.set(sym, { at: Date.now(), data });
    return data;
  } catch (e) {
    console.warn("[xstocksAssetRegistry] fetch failed:", e?.message || e);
    return null;
  }
}
