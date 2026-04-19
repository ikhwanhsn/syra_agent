/**
 * Aggregates the ai-agent Arbitrage Experiment view: CMC top tradable assets +
 * cross-venue snapshots per asset, ranked by gross USDT spread (same logic as the UI).
 */
import { fetchCmcTopTradableAssets } from "./coinmarketcapTop.js";
import { fetchCexArbitrageSnapshot } from "./cexArbitrageSnapshot.js";

/**
 * @param {unknown} raw
 * @param {number} defaultLimit
 * @returns {number} integer in [1, 25]
 */
export function clampArbitrageExperimentLimit(raw, defaultLimit = 10) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return Math.min(25, Math.max(1, Math.floor(defaultLimit)));
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error("limit must be a number between 1 and 25");
  }
  return Math.min(25, Math.max(1, Math.floor(n)));
}

/**
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{
 *   aggregatedAt: string;
 *   cmcTop: Awaited<ReturnType<typeof fetchCmcTopTradableAssets>>;
 *   snapshots: Array<{ asset: Record<string, unknown>; snapshot: Awaited<ReturnType<typeof fetchCexArbitrageSnapshot>> }>;
 *   ranked: Array<{ rank: number; asset: Record<string, unknown>; spreadPct: number; buyAt: object; sellAt: object; strategyNote: string }>;
 *   best: object | null;
 *   runnerUp: object[];
 * }>}
 */
export async function fetchArbitrageExperimentAggregate(options = {}) {
  const limit = clampArbitrageExperimentLimit(options.limit, 10);
  const cmcTop = await fetchCmcTopTradableAssets({ limit });
  const assets = cmcTop.assets ?? [];

  const snapshots = await Promise.all(
    assets.map(async (asset) => {
      const snapshot = await fetchCexArbitrageSnapshot({ token: asset.cexToken });
      return { asset, snapshot };
    }),
  );

  /** @type {{ asset: object; spreadPct: number; buyAt: object; sellAt: object; strategyNote: string }[]} */
  const ranked = [];
  for (const { asset, snapshot } of snapshots) {
    const strat = snapshot?.strategy;
    if (!strat) continue;
    const { grossSpreadPct, buyAt, sellAt, note } = strat;
    if (grossSpreadPct == null || !buyAt || !sellAt) continue;
    if (buyAt.source === sellAt.source) continue;
    ranked.push({
      asset,
      spreadPct: grossSpreadPct,
      buyAt,
      sellAt,
      strategyNote: typeof note === "string" ? note : "",
    });
  }
  ranked.sort((a, b) => b.spreadPct - a.spreadPct);

  const aggregatedAt = new Date().toISOString();

  return {
    aggregatedAt,
    cmcTop,
    snapshots: snapshots.map(({ asset, snapshot }) => ({ asset, snapshot })),
    ranked: ranked.map((r, i) => ({ rank: i + 1, ...r })),
    best: ranked[0] ?? null,
    runnerUp: ranked.slice(1, 4),
  };
}
