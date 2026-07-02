/**
 * Normalize and cache TopLedger DeFi positions for Grow / portfolio enrichment.
 */
import {
  TOPLEDGER_CACHE_TTL_MS,
  TOPLEDGER_WALLET_PATHS,
} from '../config/topledger.js';
import { callTopledgerWithTreasury } from './topledgerClient.js';
import { getTreasuryKeypair } from './agentTreasuryKey.js';

/** @typedef {{ protocol: string; depositUsd: number; borrowUsd: number; netUsd: number }} DefiLendingProtocol */
/** @typedef {{ protocol: string; positions: number; sizeUsd: number | null; collateralUsd: number | null; pnlUsd: number | null }} DefiPerpsProtocol */
/** @typedef {{ protocol: string; positions: number; valueUsd: number | null }} DefiLpProtocol */
/** @typedef {{ protocol: string; tokenSymbol: string; stakedValueUsd: number | null; positions: number }} DefiStakingProtocol */
/** @typedef {{ protocol: string; valueUsd: number | null }} DefiYieldProtocol */
/** @typedef {{ protocol: string; pendingRewardsUsd: number | null }} DefiRewardProtocol */

/**
 * @typedef {{
 *   wallet: string;
 *   netWorthUsd: number | null;
 *   holdingsUsd: number | null;
 *   lending: { depositUsd: number; borrowUsd: number; netUsd: number; protocols: DefiLendingProtocol[] };
 *   perps: { positions: number; sizeUsd: number | null; collateralUsd: number | null; pnlUsd: number | null; protocols: DefiPerpsProtocol[] };
 *   lp: { positions: number; valueUsd: number | null; protocols: DefiLpProtocol[] };
 *   staking: { valueUsd: number | null; protocols: DefiStakingProtocol[] };
 *   yield: { valueUsd: number | null; protocols: DefiYieldProtocol[] };
 *   rewards: { pendingUsd: number | null; protocols: DefiRewardProtocol[] };
 *   governance: { valueUsd: number | null; protocolCount: number };
 *   activeProtocols: string[];
 *   fetchedAt: string;
 *   source: 'topledger';
 * }} WalletDefiPositions
 */

/** @type {Map<string, { at: number; data: WalletDefiPositions }>} */
const cache = new Map();

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function toNullableNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

/**
 * @param {unknown} raw
 * @returns {WalletDefiPositions}
 */
export function normalizeTopledgerAnalyzeResponse(raw, wallet) {
  const categories = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw).categories : null;
  const cat = categories && typeof categories === 'object' ? categories : {};

  const holdings = cat.holdings && typeof cat.holdings === 'object' ? cat.holdings : {};
  const lending = cat.lending && typeof cat.lending === 'object' ? cat.lending : {};
  const perpetuals = cat.perpetuals && typeof cat.perpetuals === 'object' ? cat.perpetuals : {};
  const staking = cat.staking && typeof cat.staking === 'object' ? cat.staking : {};
  const lpPositions = cat.lp_positions && typeof cat.lp_positions === 'object' ? cat.lp_positions : {};
  const yieldCat = cat.yield && typeof cat.yield === 'object' ? cat.yield : {};
  const rewards = cat.rewards && typeof cat.rewards === 'object' ? cat.rewards : {};
  const governance = cat.governance && typeof cat.governance === 'object' ? cat.governance : {};

  const lendingProtocols = Array.isArray(lending.protocols) ? lending.protocols : [];
  const perpsProtocols = Array.isArray(perpetuals.protocols) ? perpetuals.protocols : [];
  const stakingProtocols = Array.isArray(staking.protocols) ? staking.protocols : [];
  const lpProtocols = Array.isArray(lpPositions.protocols) ? lpPositions.protocols : [];
  const yieldProtocols = Array.isArray(yieldCat.protocols) ? yieldCat.protocols : [];
  const rewardProtocols = Array.isArray(rewards.protocols) ? rewards.protocols : [];
  const governanceProtocols = Array.isArray(governance.protocols) ? governance.protocols : [];

  return {
    wallet,
    netWorthUsd: toNullableNumber(raw?.total_net_worth_usd),
    holdingsUsd: toNullableNumber(holdings.value_usd),
    lending: {
      depositUsd: toNumber(lending.deposit_usd),
      borrowUsd: toNumber(lending.borrow_usd),
      netUsd: toNumber(lending.net_usd),
      protocols: lendingProtocols.map((row) => ({
        protocol: String(row?.protocol ?? 'unknown'),
        depositUsd: toNumber(row?.deposit_value_usd),
        borrowUsd: toNumber(row?.borrow_value_usd),
        netUsd: toNumber(row?.net_value_usd),
      })),
    },
    perps: {
      positions: toNumber(perpetuals.positions),
      sizeUsd: toNullableNumber(perpetuals.size_usd),
      collateralUsd: toNullableNumber(perpetuals.collateral_usd),
      pnlUsd: toNullableNumber(perpetuals.pnl_usd),
      protocols: perpsProtocols.map((row) => ({
        protocol: String(row?.protocol ?? 'unknown'),
        positions: toNumber(row?.positions),
        sizeUsd: toNullableNumber(row?.size_usd),
        collateralUsd: toNullableNumber(row?.collateral_usd),
        pnlUsd: toNullableNumber(row?.pnl_usd),
      })),
    },
    lp: {
      positions: toNumber(lpPositions.positions),
      valueUsd: toNullableNumber(lpPositions.value_usd),
      protocols: lpProtocols.map((row) => ({
        protocol: String(row?.protocol ?? 'unknown'),
        positions: toNumber(row?.positions),
        valueUsd: toNullableNumber(row?.value_usd),
      })),
    },
    staking: {
      valueUsd: toNullableNumber(staking.value_usd),
      protocols: stakingProtocols.map((row) => ({
        protocol: String(row?.protocol ?? 'unknown'),
        tokenSymbol: String(row?.token_symbol ?? ''),
        stakedValueUsd: toNullableNumber(row?.staked_value_usd),
        positions: toNumber(row?.positions),
      })),
    },
    yield: {
      valueUsd: toNullableNumber(yieldCat.value_usd),
      protocols: yieldProtocols.map((row) => ({
        protocol: String(row?.protocol ?? 'unknown'),
        valueUsd: toNullableNumber(row?.value_usd),
      })),
    },
    rewards: {
      pendingUsd: toNullableNumber(rewards.pending_usd),
      protocols: rewardProtocols.map((row) => ({
        protocol: String(row?.protocol ?? 'unknown'),
        pendingRewardsUsd: toNullableNumber(row?.pending_rewards_usd),
      })),
    },
    governance: {
      valueUsd: toNullableNumber(governance.value_usd),
      protocolCount: governanceProtocols.length,
    },
    activeProtocols: toStringArray(raw?.active_protocols),
    fetchedAt: new Date().toISOString(),
    source: 'topledger',
  };
}

/**
 * @param {string} walletAddress
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<WalletDefiPositions | null>}
 */
export async function getWalletDefiPositions(walletAddress, opts = {}) {
  const wallet = String(walletAddress || '').trim();
  if (!wallet) return null;

  const enrichEnabled =
    String(process.env.TOPLEDGER_ENRICH_PORTFOLIO || 'true').trim().toLowerCase() !== 'false';
  if (!enrichEnabled) return null;

  const treasuryConfigured = Boolean(getTreasuryKeypair());
  const hasApiKey = Boolean(process.env.TOPLEDGER_API_KEY?.trim());
  if (!treasuryConfigured && !hasApiKey) return null;

  const cacheKey = wallet.toLowerCase();
  const now = Date.now();
  if (!opts.force) {
    const hit = cache.get(cacheKey);
    if (hit && now - hit.at < TOPLEDGER_CACHE_TTL_MS) {
      return hit.data;
    }
  }

  const result = await callTopledgerWithTreasury(
    TOPLEDGER_WALLET_PATHS.analyze,
    'GET',
    { wallet },
  );

  if (!result.success || !result.data) {
    console.warn('[defiPositions] TopLedger analyze failed:', result.error || 'unknown');
    return null;
  }

  const normalized = normalizeTopledgerAnalyzeResponse(result.data, wallet);
  cache.set(cacheKey, { at: now, data: normalized });
  return normalized;
}

/**
 * @param {string} walletAddress
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<WalletDefiPositions['rewards'] | null>}
 */
export async function getWalletDefiRewards(walletAddress, opts = {}) {
  const wallet = String(walletAddress || '').trim();
  if (!wallet) return null;

  const treasuryConfigured = Boolean(getTreasuryKeypair());
  const hasApiKey = Boolean(process.env.TOPLEDGER_API_KEY?.trim());
  if (!treasuryConfigured && !hasApiKey) return null;

  const result = await callTopledgerWithTreasury(
    TOPLEDGER_WALLET_PATHS.rewards,
    'GET',
    { wallet },
  );
  if (!result.success || !result.data) return null;

  const raw = result.data;
  const protocols = Array.isArray(raw?.protocols) ? raw.protocols : [];
  return {
    pendingUsd: toNullableNumber(raw?.pending_usd ?? raw?.total_pending_rewards_usd),
    protocols: protocols.map((row) => ({
      protocol: String(row?.protocol ?? 'unknown'),
      pendingRewardsUsd: toNullableNumber(row?.pending_rewards_usd),
    })),
  };
}
