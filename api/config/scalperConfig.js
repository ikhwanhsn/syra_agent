/**
 * Scalper agent — short-hold paper trading across cbBTC + liquid xStocks.
 * Hybrid opportunity feed from BTC experiments, stocks news, and own momentum scan.
 */
import { XSTOCKS_CATALOG } from "./equityTokens.js";
import {
  CBBTC_MINT,
  CBBTC_DECIMALS,
  BTC_QUANT_QUOTE_MINT,
  BTC_QUANT_QUOTE_DECIMALS,
} from "./tradingExperimentStrategies.js";
import { TRADING_EXPERIMENT_STARTING_USD } from "./tradingExperimentSim.js";

/** Preferred xStocks symbols for scalper universe (most liquid). */
export const SCALPER_PREFERRED_STOCK_SYMBOLS = Object.freeze([
  "TSLAx",
  "NVDAx",
  "AAPLx",
  "SPYx",
]);

/** Pyth price feed id — Crypto.BTC/USD on Hermes. */
export const PYTH_BTC_USD_FEED_ID =
  process.env.PYTH_BTC_USD_FEED_ID ||
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

export const SCALPER_DEFAULTS = Object.freeze({
  startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
  maxConcurrentPositions: 3,
  /** Fraction of free cash per scalp (0–1). */
  notionalSlicePct: 0.25,
  minNotionalUsd: 5,
  takeProfitPct: 0.75,
  stopLossPct: 0.4,
  maxHoldMinutes: 45,
  minOpportunityScore: 0.35,
  /** Cooldown after closing same symbol (ms). */
  symbolCooldownMs: 5 * 60_000,
  /** How long experiment signals stay valid (ms). */
  experimentSignalMaxAgeMs: 15 * 60_000,
  /** Momentum scan thresholds. */
  momentumMinPct: 0.15,
  momentumMaxVolatilityPct: 2.5,
  /** Jupiter quote slippage for paper fills (bps). */
  quoteSlippageBps: 50,
});

/**
 * @returns {Array<{ symbol: string; name: string; mint: string; decimals: number; assetClass: 'crypto' | 'equity'; nasdaqTicker?: string | null }>}
 */
export function resolveScalperUniverse() {
  /** @type {Array<{ symbol: string; name: string; mint: string; decimals: number; assetClass: 'crypto' | 'equity'; nasdaqTicker?: string | null }>} */
  const out = [
    {
      symbol: "cbBTC",
      name: "Coinbase Wrapped BTC",
      mint: CBBTC_MINT,
      decimals: CBBTC_DECIMALS,
      assetClass: "crypto",
      nasdaqTicker: null,
    },
  ];

  const preferred = new Set(SCALPER_PREFERRED_STOCK_SYMBOLS.map((s) => s.toUpperCase()));
  for (const entry of XSTOCKS_CATALOG) {
    if (!preferred.has(entry.symbol.toUpperCase())) continue;
    if (!entry.mint || entry.mint.length < 30) continue;
    out.push({
      symbol: entry.symbol,
      name: entry.name,
      mint: entry.mint,
      decimals: entry.decimals ?? 8,
      assetClass: "equity",
      nasdaqTicker: entry.nasdaqTicker ?? null,
    });
  }

  return out;
}

export function scalperConfigFromEnv() {
  const rawEnabled = process.env.SCALPER_CRON_ENABLED;
  const cronEnabled = rawEnabled == null ? true : rawEnabled === "1" || rawEnabled === "true";

  const signalMs = (() => {
    const raw = Number(process.env.SCALPER_SIGNAL_MS);
    return Number.isFinite(raw) && raw >= 15_000 ? Math.floor(raw) : 60_000;
  })();

  const resolveMs = (() => {
    const raw = Number(process.env.SCALPER_RESOLVE_MS);
    return Number.isFinite(raw) && raw >= 5_000 ? Math.floor(raw) : 30_000;
  })();

  return {
    cronEnabled,
    signalMs,
    resolveMs,
    quoteMint: BTC_QUANT_QUOTE_MINT,
    quoteDecimals: BTC_QUANT_QUOTE_DECIMALS,
    ...SCALPER_DEFAULTS,
    maxConcurrentPositions: (() => {
      const raw = Number(process.env.SCALPER_MAX_POSITIONS);
      return Number.isFinite(raw) && raw >= 1 ? Math.min(10, Math.floor(raw)) : SCALPER_DEFAULTS.maxConcurrentPositions;
    })(),
    minOpportunityScore: (() => {
      const raw = Number(process.env.SCALPER_MIN_SCORE);
      return Number.isFinite(raw) && raw >= 0 ? raw : SCALPER_DEFAULTS.minOpportunityScore;
    })(),
  };
}
