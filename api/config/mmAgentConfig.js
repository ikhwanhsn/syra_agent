/**
 * SYRA market-making agent — paper trading via Jupiter quotes.
 * Objective: maximize round-trip volume subject to realized PnL >= 0.
 */
import { SYRA_TOKEN_MINT } from "../libs/syraToken.js";
import { TRADING_EXPERIMENT_STARTING_USD } from "./tradingExperimentSim.js";

/** USDC mainnet mint */
export const MM_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const MM_USDC_DECIMALS = 6;
export const MM_SYRA_MINT = process.env.SYRA_TOKEN_MINT || SYRA_TOKEN_MINT;
export const MM_SYRA_DECIMALS = 9;
export const MM_SYRA_SYMBOL = "SYRA";

/** Pump.fun creator fee on volume (bps). Override via env. Default 1%. */
export const PUMPFUN_CREATOR_FEE_BPS = (() => {
  const raw = Number(process.env.PUMPFUN_CREATOR_FEE_BPS);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 100;
})();

export const MM_DEFAULTS = Object.freeze({
  startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
  /** Base half-spread from mid (bps per side). */
  spreadBps: 35,
  /** USD notional per grid level per side. */
  orderSizeUsd: 18,
  /** Levels on each side of reservation price. */
  gridLevels: 3,
  /** Grid step as fraction of half-spread (1 = adjacent levels at spread increments). */
  gridStepMultiplier: 1,
  /** Max net SYRA inventory value (USD) before skewing heavily to unload. */
  maxInventoryUsd: 120,
  /** Target neutral inventory (USD). */
  targetInventoryUsd: 0,
  /** Inventory skew intensity (0–1) applied to reservation price. */
  inventorySkewFactor: 0.55,
  /** Min half-spread after costs (bps). */
  minHalfSpreadBps: 12,
  /** Extra edge buffer above round-trip cost (%). */
  minEdgeBufferPct: 0.08,
  /** Jupiter quote slippage for paper fills (bps). */
  quoteSlippageBps: 50,
  /** Max age for resting orders before cancel (ms). */
  restingOrderTtlMs: 3 * 60_000,
  /** Volatility lookback window (number of price samples). */
  volLookbackSamples: 20,
  /** High-vol regime: multiply spread by this. */
  highVolSpreadMultiplier: 1.45,
  /** Low-vol regime: multiply spread by this. */
  lowVolSpreadMultiplier: 0.85,
  /** High vol threshold (% move between samples). */
  highVolThresholdPct: 0.35,
  /** Low vol threshold (%). */
  lowVolThresholdPct: 0.08,
  /** Min USD notional per leg. */
  minNotionalUsd: 5,
  /** Max concurrent resting orders per strategy. */
  maxRestingPerStrategy: 6,
  /** Fraction of free cash deployable per quote cycle. */
  deploySlicePct: 0.35,
});

/** Competing MM parameter sets — learning promotes volume winners with PnL >= 0. */
export const MM_STRATEGY_POPULATION = Object.freeze([
  {
    id: "tight",
    name: "Tight / high-freq",
    spreadBps: 25,
    orderSizeUsd: 14,
    gridLevels: 4,
    gridStepMultiplier: 0.85,
    volAdaptive: false,
  },
  {
    id: "wide",
    name: "Wide / inventory-heavy",
    spreadBps: 65,
    orderSizeUsd: 28,
    gridLevels: 2,
    gridStepMultiplier: 1.2,
    volAdaptive: false,
  },
  {
    id: "adaptive",
    name: "Adaptive vol",
    spreadBps: 40,
    orderSizeUsd: 20,
    gridLevels: 3,
    gridStepMultiplier: 1,
    volAdaptive: true,
  },
]);

/**
 * Estimated round-trip fill cost as a percentage (buy + sell slippage).
 * @param {number} [quoteSlippageBps]
 */
export function estimateMmRoundTripCostPct(quoteSlippageBps = MM_DEFAULTS.quoteSlippageBps) {
  const bps = Number(quoteSlippageBps);
  if (!Number.isFinite(bps) || bps <= 0) return 1;
  return (bps * 2) / 100;
}

/**
 * Project pump.fun creator fee revenue from volume.
 * @param {number} volumeUsd
 * @param {number} [feeBps]
 */
export function projectCreatorFeeUsd(volumeUsd, feeBps = PUMPFUN_CREATOR_FEE_BPS) {
  const vol = Number(volumeUsd);
  const bps = Number(feeBps);
  if (!Number.isFinite(vol) || vol <= 0 || !Number.isFinite(bps) || bps <= 0) return 0;
  return Math.round((vol * (bps / 10_000) + Number.EPSILON) * 100) / 100;
}

/**
 * @returns {{ symbol: string; name: string; mint: string; decimals: number; quoteMint: string; quoteDecimals: number }}
 */
export function resolveMmUniverse() {
  return {
    symbol: MM_SYRA_SYMBOL,
    name: "Syra",
    mint: MM_SYRA_MINT,
    decimals: MM_SYRA_DECIMALS,
    quoteMint: MM_USDC_MINT,
    quoteDecimals: MM_USDC_DECIMALS,
  };
}

/**
 * Merge strategy population entry with base defaults.
 * @param {{ id: string; name: string; spreadBps: number; orderSizeUsd: number; gridLevels: number; gridStepMultiplier?: number; volAdaptive?: boolean }} strategy
 * @param {Record<string, unknown>} [overrides]
 */
export function resolveStrategyConfig(strategy, overrides = {}) {
  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    volAdaptive: Boolean(strategy.volAdaptive),
    spreadBps: strategy.spreadBps,
    orderSizeUsd: strategy.orderSizeUsd,
    gridLevels: strategy.gridLevels,
    gridStepMultiplier: strategy.gridStepMultiplier ?? 1,
    startingBankUsd: MM_DEFAULTS.startingBankUsd,
    maxInventoryUsd: MM_DEFAULTS.maxInventoryUsd,
    targetInventoryUsd: MM_DEFAULTS.targetInventoryUsd,
    inventorySkewFactor: MM_DEFAULTS.inventorySkewFactor,
    minHalfSpreadBps: MM_DEFAULTS.minHalfSpreadBps,
    minEdgeBufferPct: MM_DEFAULTS.minEdgeBufferPct,
    quoteSlippageBps: MM_DEFAULTS.quoteSlippageBps,
    restingOrderTtlMs: MM_DEFAULTS.restingOrderTtlMs,
    highVolSpreadMultiplier: MM_DEFAULTS.highVolSpreadMultiplier,
    lowVolSpreadMultiplier: MM_DEFAULTS.lowVolSpreadMultiplier,
    highVolThresholdPct: MM_DEFAULTS.highVolThresholdPct,
    lowVolThresholdPct: MM_DEFAULTS.lowVolThresholdPct,
    minNotionalUsd: MM_DEFAULTS.minNotionalUsd,
    maxRestingPerStrategy: MM_DEFAULTS.maxRestingPerStrategy,
    deploySlicePct: MM_DEFAULTS.deploySlicePct,
    ...overrides,
  };
}

export function mmConfigFromEnv() {
  const rawEnabled = process.env.MM_CRON_ENABLED;
  const cronEnabled = rawEnabled == null ? true : rawEnabled === "1" || rawEnabled === "true";

  const quoteMs = (() => {
    const raw = Number(process.env.MM_QUOTE_MS);
    return Number.isFinite(raw) && raw >= 15_000 ? Math.floor(raw) : 45_000;
  })();

  const resolveMs = (() => {
    const raw = Number(process.env.MM_RESOLVE_MS);
    return Number.isFinite(raw) && raw >= 5_000 ? Math.floor(raw) : 20_000;
  })();

  const startingBankUsd = (() => {
    const raw = Number(process.env.MM_STARTING_BANK_USD);
    return Number.isFinite(raw) && raw > 0 ? raw : MM_DEFAULTS.startingBankUsd;
  })();

  const spreadBps = (() => {
    const raw = Number(process.env.MM_SPREAD_BPS);
    return Number.isFinite(raw) && raw > 0 ? raw : MM_DEFAULTS.spreadBps;
  })();

  const maxInventoryUsd = (() => {
    const raw = Number(process.env.MM_MAX_INVENTORY_USD);
    return Number.isFinite(raw) && raw > 0 ? raw : MM_DEFAULTS.maxInventoryUsd;
  })();

  const quoteSlippageBps = (() => {
    const raw = Number(process.env.MM_QUOTE_SLIPPAGE_BPS);
    return Number.isFinite(raw) && raw > 0 ? raw : MM_DEFAULTS.quoteSlippageBps;
  })();

  return {
    cronEnabled,
    quoteMs,
    resolveMs,
    startingBankUsd,
    spreadBps,
    maxInventoryUsd,
    quoteSlippageBps,
    quoteMint: MM_USDC_MINT,
    quoteDecimals: MM_USDC_DECIMALS,
    syraMint: MM_SYRA_MINT,
    syraDecimals: MM_SYRA_DECIMALS,
    creatorFeeBps: PUMPFUN_CREATOR_FEE_BPS,
    ...MM_DEFAULTS,
    startingBankUsd,
    spreadBps,
    maxInventoryUsd,
    quoteSlippageBps,
  };
}
