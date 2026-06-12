/**
 * Tokenized equity registry — SPCX launch + xStocks catalog.
 * Mint addresses can be overridden via env for new listings.
 */

/** @typedef {'backpack' | 'xstocks' | 'ondo' | 'other'} EquityVenue */

/**
 * @typedef {Object} EquityTokenEntry
 * @property {string} symbol
 * @property {string} name
 * @property {string} mint
 * @property {number} decimals
 * @property {EquityVenue} venue
 * @property {string} [nasdaqTicker]
 * @property {boolean} [verified]
 * @property {string} [description]
 */

/** IPO reference price (USD) — used when live Nasdaq quote unavailable. */
export const SPCX_IPO_REFERENCE_PRICE_USD = Number(
  process.env.SPCX_IPO_REFERENCE_PRICE_USD || "135",
);

/** Nasdaq ticker for SpaceX (same as Backpack listing). */
export const SPCX_NASDAQ_TICKER = process.env.SPCX_NASDAQ_TICKER || "SPCX";

/**
 * Core SPCX venues for the SpaceX IPO launch window.
 * @type {EquityTokenEntry[]}
 */
export const SPCX_VENUES = [
  {
    symbol: "SPCXx",
    name: "SpaceX xStock",
    mint:
      process.env.SPCX_XSTOCKS_MINT ||
      "Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8",
    decimals: 8,
    venue: "xstocks",
    nasdaqTicker: SPCX_NASDAQ_TICKER,
    verified: true,
    description: "Backed Finance xStocks — 1:1 backed, redeemable via Kraken/Bybit",
  },
  {
    symbol: "SPCX",
    name: "SpaceX (Backpack/Sunrise)",
    mint: process.env.SPCX_BACKPACK_MINT || "",
    decimals: 8,
    venue: "backpack",
    nasdaqTicker: SPCX_NASDAQ_TICKER,
    verified: true,
    description: "Backpack Securities + SunriseDeFi — 1:1 backed, ACATS redemption",
  },
  {
    symbol: "SPCXon",
    name: "SpaceX (Ondo Global Markets)",
    mint: process.env.SPCX_ONDO_MINT || "",
    decimals: 8,
    venue: "ondo",
    nasdaqTicker: SPCX_NASDAQ_TICKER,
    verified: true,
    description: "Ondo Finance total-return tracker — 1:1 custodied",
  },
];

/**
 * Extended xStocks catalog (60+ majors) — parametric equity intelligence.
 * Add mints via env or extend this list as new xStocks go live on Solana.
 * @type {EquityTokenEntry[]}
 */
export const XSTOCKS_CATALOG = [
  ...SPCX_VENUES,
  {
    symbol: "TSLAx",
    name: "Tesla xStock",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
    venue: "xstocks",
    nasdaqTicker: "TSLA",
    verified: true,
  },
  // Additional xStocks — add mint via XSTOCKS_<SYMBOL>_MINT env or extend catalog
  {
    symbol: "NVDAx",
    name: "NVIDIA xStock",
    mint: process.env.XSTOCKS_NVDAx_MINT || "",
    decimals: 8,
    venue: "xstocks",
    nasdaqTicker: "NVDA",
    verified: true,
  },
  {
    symbol: "AAPLx",
    name: "Apple xStock",
    mint: process.env.XSTOCKS_AAPLx_MINT || "",
    decimals: 8,
    venue: "xstocks",
    nasdaqTicker: "AAPL",
    verified: true,
  },
  {
    symbol: "SPYx",
    name: "SP500 xStock",
    mint: process.env.XSTOCKS_SPYx_MINT || "",
    decimals: 8,
    venue: "xstocks",
    nasdaqTicker: "SPY",
    verified: true,
  },
];

/** Lookup by symbol (case-insensitive). */
const _bySymbol = new Map(
  XSTOCKS_CATALOG.map((t) => [t.symbol.toUpperCase(), t]),
);

/** Lookup by mint address. */
const _byMint = new Map(
  XSTOCKS_CATALOG.filter((t) => t.mint).map((t) => [t.mint, t]),
);

/**
 * @param {string} symbolOrMint
 * @returns {EquityTokenEntry | null}
 */
export function resolveEquityToken(symbolOrMint) {
  if (!symbolOrMint || typeof symbolOrMint !== "string") return null;
  const q = symbolOrMint.trim();
  if (!q) return null;

  const byMint = _byMint.get(q);
  if (byMint) return byMint;

  const upper = q.toUpperCase();
  const bySym = _bySymbol.get(upper);
  if (bySym) return bySym;

  // Aliases: spcx, spacex, $SPCX
  if (/^SPCX$|^SPACEX$|^SPCXX$/.test(upper)) {
    return _bySymbol.get("SPCXx") || SPCX_VENUES[0];
  }

  return null;
}

/**
 * All SPCX venue entries with configured mints.
 * @returns {EquityTokenEntry[]}
 */
export function getActiveSpcxVenues() {
  return SPCX_VENUES.filter((v) => v.mint && v.mint.length > 30);
}

/**
 * List all catalog symbols for discovery.
 * @returns {string[]}
 */
export function listEquitySymbols() {
  return [...new Set(XSTOCKS_CATALOG.map((t) => t.symbol))];
}
