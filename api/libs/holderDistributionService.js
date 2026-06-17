/**
 * Syra holder distribution analysis — free on-chain infra (Solana RPC).
 * Replaces paid third-party cluster maps with deterministic concentration metrics.
 */
import { fetchSplTokenTopHolders } from './solanaTokenLargestHolders.js';

/**
 * @param {Array<{ sharePct?: number | null }>} holders
 * @param {number} count
 */
function sumTopShare(holders, count) {
  return holders.slice(0, count).reduce((sum, row) => sum + (row.sharePct ?? 0), 0);
}

/**
 * @param {{ top1: number; top5: number; top10: number }} concentration
 */
function computeDecentralizationScore(concentration) {
  const { top1, top5, top10 } = concentration;
  const raw = 100 - top1 * 1.2 - (top5 - top1) * 0.6 - (top10 - top5) * 0.35;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * @param {{ top1: number; top3: number; top5: number; top10: number }} concentration
 */
function buildDistributionFlags(concentration) {
  /** @type {Array<{ id: string; severity: 'high' | 'medium' | 'low'; message: string }>} */
  const flags = [];

  if (concentration.top1 >= 25) {
    flags.push({
      id: 'whale_dominance',
      severity: 'high',
      message: `Top holder controls ${concentration.top1.toFixed(1)}% of supply`,
    });
  } else if (concentration.top1 >= 15) {
    flags.push({
      id: 'whale_dominance',
      severity: 'medium',
      message: `Top holder holds ${concentration.top1.toFixed(1)}% of supply`,
    });
  }

  if (concentration.top3 >= 60) {
    flags.push({
      id: 'top3_concentration',
      severity: 'high',
      message: `Top 3 wallets hold ${concentration.top3.toFixed(1)}% combined`,
    });
  } else if (concentration.top3 >= 45) {
    flags.push({
      id: 'top3_concentration',
      severity: 'medium',
      message: `Top 3 wallets hold ${concentration.top3.toFixed(1)}% combined`,
    });
  }

  if (concentration.top10 >= 75) {
    flags.push({
      id: 'top10_concentration',
      severity: 'high',
      message: `Top 10 wallets hold ${concentration.top10.toFixed(1)}% — highly centralized`,
    });
  } else if (concentration.top10 >= 55) {
    flags.push({
      id: 'top10_concentration',
      severity: 'medium',
      message: `Top 10 wallets hold ${concentration.top10.toFixed(1)}%`,
    });
  }

  if (concentration.top5 >= 50 && concentration.top1 < 15) {
    flags.push({
      id: 'bundled_distribution',
      severity: 'medium',
      message: `Top 5 hold ${concentration.top5.toFixed(1)}% with no single whale — possible bundled wallets`,
    });
  }

  return flags;
}

/**
 * @param {Awaited<ReturnType<typeof fetchSplTokenTopHolders>>} holdersPayload
 */
export function analyzeHolderDistribution(holdersPayload) {
  const holders = holdersPayload.holders ?? [];

  const top1 = sumTopShare(holders, 1);
  const top3 = sumTopShare(holders, 3);
  const top5 = sumTopShare(holders, 5);
  const top10 = holdersPayload.top10ConcentrationPct ?? sumTopShare(holders, 10);
  const top20 = sumTopShare(holders, Math.min(20, holders.length));

  const concentration = { top1, top3, top5, top10, top20 };
  const decentralizationScore = computeDecentralizationScore(concentration);

  /** @type {{ whale: number; dolphin: number; shrimp: number }} */
  const tiers = { whale: 0, dolphin: 0, shrimp: 0 };
  for (const row of holders) {
    const pct = row.sharePct ?? 0;
    if (pct >= 5) tiers.whale += 1;
    else if (pct >= 1) tiers.dolphin += 1;
    else tiers.shrimp += 1;
  }

  return {
    mint: holdersPayload.mint,
    decimals: holdersPayload.decimals,
    supplyHuman: holdersPayload.supplyHuman,
    decentralizationScore,
    concentration,
    tiers,
    flags: buildDistributionFlags(concentration),
    holderSampleSize: holders.length,
    topHolders: holders.slice(0, 10).map((row) => ({
      rank: row.rank,
      wallet: row.wallet,
      sharePct: row.sharePct,
      balanceHuman: row.balanceHuman,
    })),
  };
}

/**
 * @param {string} mint
 * @param {{ limit?: number }} [opts]
 */
export async function buildHolderDistribution(mint, opts = {}) {
  const limit = Math.min(50, Math.max(10, Number(opts.limit) || 20));
  const holdersPayload = await fetchSplTokenTopHolders(mint, { limit });
  return analyzeHolderDistribution(holdersPayload);
}
