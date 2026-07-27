/**
 * Pilot access controls for Robinhood Chain LP Autopilot (real execution).
 * Tiny caps until EV gate passes and operator enables production pilot.
 */
import {
  getRobinhoodApprovedTokenAddressSet,
  getRobinhoodLpDestinationAllowlist,
  getRobinhoodUniswapV3Addresses,
} from "./robinhoodChain.js";
import { isRobinhoodQuoteMint, isRobinhoodQuoteSymbol } from "../libs/robinhoodUniswapClient.js";

const num = (env, fallback) => {
  const n = Number(process.env[env]);
  return Number.isFinite(n) ? n : fallback;
};

export function getRobinhoodLpRealDryRun() {
  const raw = (process.env.ROBINHOOD_LP_REAL_DRY_RUN || "true").trim().toLowerCase();
  return raw !== "false" && raw !== "0";
}

export function getRobinhoodLpRealPilotEnabled() {
  const raw = (process.env.ROBINHOOD_LP_REAL_PILOT_ENABLED || "false").trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export function getRobinhoodLpRealMaxPositionUsd() {
  return Math.min(50, Math.max(1, num("ROBINHOOD_LP_REAL_MAX_POSITION_USD", 5)));
}

export function getRobinhoodLpRealMaxConcurrentPositions() {
  return Math.min(5, Math.max(1, num("ROBINHOOD_LP_REAL_MAX_CONCURRENT", 2)));
}

export function getRobinhoodLpRealMaxBankUsd() {
  return Math.min(200, Math.max(10, num("ROBINHOOD_LP_REAL_MAX_BANK_USD", 25)));
}

export function getRobinhoodLpRealMaxOpensPerTick() {
  return Math.min(3, Math.max(0, num("ROBINHOOD_LP_REAL_MAX_OPENS_PER_TICK", 1)));
}

export function getRobinhoodLpRealKillSwitch() {
  const raw = (process.env.ROBINHOOD_LP_REAL_KILL_SWITCH || "false").trim().toLowerCase();
  return raw === "true" || raw === "1";
}

/** Slippage budget for sidecar swaps + mint amountMin (basis points). */
export function getRobinhoodLpRealSlippageBps() {
  return Math.min(500, Math.max(10, num("ROBINHOOD_LP_REAL_SLIPPAGE_BPS", 100)));
}

/** Minimum native ETH (wei) required before opening a live position. */
export function getRobinhoodLpRealMinGasWei() {
  const raw = process.env.ROBINHOOD_LP_REAL_MIN_GAS_WEI;
  if (raw && /^\d+$/.test(String(raw).trim())) return BigInt(String(raw).trim());
  return 2_000_000_000_000_000n; // 0.002 ETH
}

export function getRobinhoodLpRealMinClaimFeesUsd() {
  return Math.max(0, num("ROBINHOOD_LP_REAL_MIN_CLAIM_FEES_USD", 0.25));
}

export const ROBINHOOD_LP_REAL_TOOL_IDS = Object.freeze([
  "outcome_lp_open",
  "outcome_lp_close",
  "outcome_lp_rebalance",
]);

/**
 * Stricter pool screen for live capital than paper sim.
 * @param {object} pool
 * @param {{ binsBelow?: number; binsAbove?: number }} [opts]
 */
export function passesRobinhoodRealPoolScreen(pool, opts = {}) {
  const tvl = Number(pool?.tvlUsd) || 0;
  const vol = Number(pool?.volume24hUsd) || 0;
  const feeTvl = Number(pool?.feeTvlRatio) || 0;
  if (tvl < 50_000 || vol < 40_000) return false;
  if (feeTvl < 0.0002) return false;
  if (tvl > 0 && vol / tvl < 0.25 && feeTvl < 0.0008) return false;

  const quoteOk =
    isRobinhoodQuoteSymbol(pool?.quoteSymbol) ||
    isRobinhoodQuoteMint(pool?.quoteMint) ||
    isRobinhoodQuoteSymbol(pool?.baseSymbol) ||
    isRobinhoodQuoteMint(pool?.baseMint);
  if (!quoteOk) return false;

  const approved = getRobinhoodApprovedTokenAddressSet();
  const base = String(pool?.baseMint || "").toLowerCase();
  const quote = String(pool?.quoteMint || "").toLowerCase();
  // Prefer pools where at least one leg is an allowlisted token (WETH/USDG[/USDC]).
  if (base && quote) {
    if (!approved.has(base) && !approved.has(quote)) return false;
  }

  const binsBelow = Number(opts.binsBelow) || 30;
  const binsAbove = Number(opts.binsAbove) || 30;
  // Ultra-narrow single-sided ranges are higher risk on live L2; require some width.
  if (binsBelow + binsAbove < 4) return false;
  return true;
}

/**
 * @param {string} to
 * @returns {boolean}
 */
export function isRobinhoodLpAllowedDestination(to) {
  const addr = String(to || "").trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(addr)) return false;
  try {
    return getRobinhoodLpDestinationAllowlist().has(addr);
  } catch {
    return false;
  }
}

/**
 * Assert destination is allowlisted; throws on reject.
 * @param {string} to
 */
export function assertRobinhoodLpAllowedDestination(to) {
  if (!isRobinhoodLpAllowedDestination(to)) {
    throw new Error(`robinhood_lp_destination_not_allowlisted:${to}`);
  }
  return true;
}

/**
 * Snapshot of safety flags for UI / status endpoints.
 */
export function getRobinhoodLpRealSafetySnapshot() {
  let uniswap = null;
  let uniswapError = null;
  try {
    uniswap = getRobinhoodUniswapV3Addresses();
  } catch (e) {
    uniswapError = e instanceof Error ? e.message : String(e);
  }
  return {
    pilotEnabled: getRobinhoodLpRealPilotEnabled(),
    dryRunDefault: getRobinhoodLpRealDryRun(),
    killSwitch: getRobinhoodLpRealKillSwitch(),
    maxPositionUsd: getRobinhoodLpRealMaxPositionUsd(),
    maxBankUsd: getRobinhoodLpRealMaxBankUsd(),
    maxConcurrent: getRobinhoodLpRealMaxConcurrentPositions(),
    maxOpensPerTick: getRobinhoodLpRealMaxOpensPerTick(),
    slippageBps: getRobinhoodLpRealSlippageBps(),
    uniswapConfigured: Boolean(uniswap),
    uniswapError,
    npm: uniswap?.nonfungiblePositionManager ?? null,
    swapRouter02: uniswap?.swapRouter02 ?? null,
  };
}
