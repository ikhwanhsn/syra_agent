/**
 * Scalper v2 — short-hold paper trading across cbBTC + liquid xStocks.
 * Hybrid opportunity feed from BTC experiments, stocks news, and own momentum scan.
 *
 * Profitability bias: realistic fill cost, achievable TP, short holds, confluence first.
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
  /** Fewer concurrent bets = less correlated drawdown. */
  maxConcurrentPositions: 2,
  /** Fraction of free cash per scalp (0–1) — sized for high-conviction only. */
  notionalSlicePct: 0.2,
  /** Floor fraction of notionalSlicePct for borderline entries. */
  minNotionalSlicePct: 0.08,
  minNotionalUsd: 8,
  /**
   * Achievable scalp TP vs round-trip cost (~0.36% at 18bps/side).
   * Sized so net after fills stays positive on wins and targets are reachable.
   */
  takeProfitPct: 1.05,
  /** Tight but noise-aware hard stop (~2.3:1 R:R with TP). */
  stopLossPct: 0.45,
  maxHoldMinutes: 15,
  /** Active-demo floor — high enough to skip junk, low enough to trade. */
  minOpportunityScore: 0.6,
  /**
   * Extra edge (%) above estimated round-trip fill cost before entry.
   * Round-trip ≈ 2 × quoteSlippageBps / 100.
   */
  minEdgeBufferPct: 0.18,
  /** Cooldown after closing same symbol (ms). */
  symbolCooldownMs: 10 * 60_000,
  /** How long experiment signals stay valid (ms) — fresh only. */
  experimentSignalMaxAgeMs: 3 * 60_000,
  /** Momentum scan thresholds — active-demo friendly, still reject near-zero noise. */
  momentumMinPct: 0.05,
  momentumMaxVolatilityPct: 1.45,
  /** Jupiter quote slippage for paper fills (bps) — liquid cbBTC/USDC. */
  quoteSlippageBps: 18,
  /** Trailing stop activates after this unrealized gain (%). */
  trailActivatePct: 0.5,
  /** Trail distance below peak (%). */
  trailDistancePct: 0.28,
  /** Move stop to breakeven after this unrealized gain (%). */
  breakevenActivatePct: 0.4,
  /** Soft profit lock: exit if giveback from peak after this gain (%). */
  profitLockGainPct: 0.85,
  /** Max giveback from peak (%) once profit lock is armed. */
  profitLockGivebackPct: 0.32,
  /** Reject entries when Jupiter impact exceeds this (bps). Quote impact can be noisy vs mid. */
  maxEntryImpactBps: 120,
  /** Solo (non-confluence) entries need at least this score. */
  minSoloScore: 0.6,
  /** Solo momentum floor — primary 24/7 signal source for active demo. */
  minSoloMomentumScore: 0.6,
  minSoloStocksScore: 0.76,
});

/** Estimated round-trip fill cost as a percentage (entry + exit slippage). */
export function estimateRoundTripCostPct(quoteSlippageBps = SCALPER_DEFAULTS.quoteSlippageBps) {
  const bps = Number(quoteSlippageBps);
  if (!Number.isFinite(bps) || bps <= 0) return 1;
  return (bps * 2) / 100;
}

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
