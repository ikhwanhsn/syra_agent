/**
 * Compare top on-chain holders between two SPL token mints (Solana RPC).
 * Free overlap analysis — no daily scan quota consumed.
 */
import { fetchSplTokenTopHolders } from './solanaTokenLargestHolders.js';
import { buildPumpfunMarketProfile } from './pumpfunCoinAnalysis.js';
import { fetchOnchainTokenPrice } from './equityPriceFetchers.js';

const HOLDER_LIMIT = 50;
const MAX_COMPARE_MINTS = 8;

/** @param {string} s */
function isLikelySolanaMint(s) {
  const t = typeof s === 'string' ? s.trim() : '';
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

/**
 * @param {number | null | undefined} sharePct
 * @returns {'whale' | 'dolphin' | 'shrimp'}
 */
function tierFromSharePct(sharePct) {
  const pct = sharePct ?? 0;
  if (pct >= 5) return 'whale';
  if (pct >= 1) return 'dolphin';
  return 'shrimp';
}

/**
 * @param {string} mint
 * @returns {Promise<{ mint: string; symbol: string; name: string; image: string | null; priceUsd: number | null; supplyHuman: number | null }>}
 */
async function fetchTokenMeta(mint) {
  const [profileResult, priceResult] = await Promise.all([
    buildPumpfunMarketProfile(mint).catch(() => ({ ok: false })),
    fetchOnchainTokenPrice(mint).catch(() => null),
  ]);

  const profile = profileResult.ok ? profileResult.data : null;
  const priceFromProfile =
    profile?.priceUsd != null && Number.isFinite(profile.priceUsd) ? profile.priceUsd : null;
  const priceFromDex =
    priceResult?.priceUsd != null && Number.isFinite(priceResult.priceUsd)
      ? priceResult.priceUsd
      : null;

  return {
    mint,
    symbol: profile?.symbol ?? mint.slice(0, 4).toUpperCase(),
    name: profile?.name ?? 'Token',
    image: profile?.imageUri ?? null,
    priceUsd: priceFromProfile ?? priceFromDex,
    supplyHuman:
      profile?.totalSupply != null && Number.isFinite(profile.totalSupply)
        ? profile.totalSupply
        : null,
  };
}

/**
 * @param {Awaited<ReturnType<typeof fetchSplTokenTopHolders>>['holders']} holders
 * @returns {Map<string, { rank: number; wallet: string; balanceHuman: number | null; sharePct: number | null; tokenAccount: string }>}
 */
function buildWalletMap(holders) {
  /** @type {Map<string, { rank: number; wallet: string; balanceHuman: number | null; sharePct: number | null; tokenAccount: string }>} */
  const map = new Map();
  for (const row of holders ?? []) {
    if (!row.wallet) continue;
    map.set(row.wallet, {
      rank: row.rank,
      wallet: row.wallet,
      balanceHuman: row.balanceHuman,
      sharePct: row.sharePct,
      tokenAccount: row.tokenAccount,
    });
  }
  return map;
}

/**
 * @param {{
 *   overlapCount: number;
 *   comparedA: number;
 *   comparedB: number;
 *   sharedSupplyPctA: number;
 *   sharedSupplyPctB: number;
 *   topTenBothCount: number;
 *   whaleCount: number;
 * }} ctx
 */
function buildVerdict(ctx) {
  const { overlapCount, comparedA, comparedB, sharedSupplyPctA, sharedSupplyPctB, topTenBothCount, whaleCount } =
    ctx;

  if (overlapCount === 0) {
    return {
      verdict: 'No overlap',
      tone: 'neutral',
      interpretation:
        'None of the top on-chain holders of either token appear in the other token\'s top holder list. These tokens likely have distinct holder bases among their largest wallets.',
    };
  }

  const ratioA = comparedA > 0 ? overlapCount / comparedA : 0;
  const ratioB = comparedB > 0 ? overlapCount / comparedB : 0;
  const maxSharedSupply = Math.max(sharedSupplyPctA, sharedSupplyPctB);

  if (topTenBothCount >= 3 || (whaleCount >= 2 && maxSharedSupply >= 10)) {
    return {
      verdict: 'Strong shared-whale overlap',
      tone: 'warning',
      interpretation: `${overlapCount} wallet${overlapCount === 1 ? '' : 's'} hold both tokens among their top holders, including ${topTenBothCount} in the top 10 of both. Shared wallets control ~${maxSharedSupply.toFixed(1)}% of supply on at least one side — possible coordinated positioning or shared insider/community wallets.`,
    };
  }

  if (overlapCount >= 5 || ratioA >= 0.25 || ratioB >= 0.25 || maxSharedSupply >= 5) {
    return {
      verdict: 'Moderate overlap',
      tone: 'caution',
      interpretation: `${overlapCount} shared top holders detected (${(ratioA * 100).toFixed(0)}% of A's sample, ${(ratioB * 100).toFixed(0)}% of B's). Some wallet overlap suggests shared community interest or early buyers rotating between related projects.`,
    };
  }

  return {
    verdict: 'Minimal overlap',
    tone: 'neutral',
    interpretation: `Only ${overlapCount} shared wallet${overlapCount === 1 ? '' : 's'} among top holders. Limited overlap suggests mostly independent holder bases at the whale level.`,
  };
}

/**
 * @param {{
 *   mintA: string;
 *   mintB: string;
 *   holdersA: Awaited<ReturnType<typeof fetchSplTokenTopHolders>>;
 *   metaA: Awaited<ReturnType<typeof fetchTokenMeta>>;
 *   mapA: ReturnType<typeof buildWalletMap>;
 *   holdersB: Awaited<ReturnType<typeof fetchSplTokenTopHolders>>;
 *   metaB: Awaited<ReturnType<typeof fetchTokenMeta>>;
 * }} ctx
 */
function buildOverlapFromCachedA(ctx) {
  const { mintA, mintB, holdersA, metaA, mapA, holdersB, metaB } = ctx;
  const mapB = buildWalletMap(holdersB.holders);
  const comparedA = mapA.size;
  const comparedB = mapB.size;

  /** @type {string[]} */
  const sharedWallets = [];
  for (const wallet of mapA.keys()) {
    if (mapB.has(wallet)) sharedWallets.push(wallet);
  }

  const priceUsdA = metaA.priceUsd;
  const priceUsdB = metaB.priceUsd;

  /** @type {Array<Record<string, unknown>>} */
  const sharedHolders = sharedWallets.map((wallet) => {
    const rowA = mapA.get(wallet);
    const rowB = mapB.get(wallet);
    const sharePctA = rowA?.sharePct ?? null;
    const sharePctB = rowB?.sharePct ?? null;
    const balanceHumanA = rowA?.balanceHuman ?? null;
    const balanceHumanB = rowB?.balanceHuman ?? null;

    const usdValueA =
      balanceHumanA != null && priceUsdA != null ? balanceHumanA * priceUsdA : null;
    const usdValueB =
      balanceHumanB != null && priceUsdB != null ? balanceHumanB * priceUsdB : null;
    const combinedUsdValue =
      usdValueA != null && usdValueB != null
        ? usdValueA + usdValueB
        : usdValueA ?? usdValueB ?? null;

    const maxShare = Math.max(sharePctA ?? 0, sharePctB ?? 0);
    const tier = tierFromSharePct(maxShare);
    const rankA = rowA?.rank ?? 0;
    const rankB = rowB?.rank ?? 0;
    const topTenBoth = rankA <= 10 && rankB <= 10;

    return {
      wallet,
      rankA,
      rankB,
      balanceHumanA,
      balanceHumanB,
      sharePctA,
      sharePctB,
      usdValueA,
      usdValueB,
      combinedUsdValue,
      tier,
      flags: topTenBoth ? ['topTenBoth'] : [],
    };
  });

  sharedHolders.sort((x, y) => {
    const aVal = typeof x.combinedUsdValue === 'number' ? x.combinedUsdValue : -1;
    const bVal = typeof y.combinedUsdValue === 'number' ? y.combinedUsdValue : -1;
    if (bVal !== aVal) return bVal - aVal;
    const maxShareX = Math.max(x.sharePctA ?? 0, x.sharePctB ?? 0);
    const maxShareY = Math.max(y.sharePctA ?? 0, y.sharePctB ?? 0);
    return maxShareY - maxShareX;
  });

  const sharedSupplyPctA = sharedHolders.reduce((s, h) => s + (h.sharePctA ?? 0), 0);
  const sharedSupplyPctB = sharedHolders.reduce((s, h) => s + (h.sharePctB ?? 0), 0);
  const sharedUsdValueTotal = sharedHolders.reduce((s, h) => {
    if (typeof h.combinedUsdValue === 'number') return s + h.combinedUsdValue;
    return s;
  }, 0);

  const topTenBothCount = sharedHolders.filter((h) => h.flags.includes('topTenBoth')).length;
  const whaleCount = sharedHolders.filter((h) => h.tier === 'whale').length;
  const overlapCount = sharedHolders.length;

  const { verdict, tone, interpretation } = buildVerdict({
    overlapCount,
    comparedA,
    comparedB,
    sharedSupplyPctA,
    sharedSupplyPctB,
    topTenBothCount,
    whaleCount,
  });

  return {
    mintA,
    mintB,
    tokenA: {
      ...metaA,
      supplyHuman: holdersA.supplyHuman ?? metaA.supplyHuman,
      holdersCompared: comparedA,
      holdersFetchError: holdersA._error ?? null,
    },
    tokenB: {
      ...metaB,
      supplyHuman: holdersB.supplyHuman ?? metaB.supplyHuman,
      holdersCompared: comparedB,
      holdersFetchError: holdersB._error ?? null,
    },
    sharedHolders,
    summary: {
      overlapCount,
      comparedA,
      comparedB,
      overlapRatioA: comparedA > 0 ? overlapCount / comparedA : 0,
      overlapRatioB: comparedB > 0 ? overlapCount / comparedB : 0,
      sharedSupplyPctA,
      sharedSupplyPctB,
      sharedUsdValueTotal: sharedUsdValueTotal > 0 ? sharedUsdValueTotal : null,
      topTenBothCount,
      whaleCount,
      verdict,
      tone,
      interpretation,
      holderSampleLimit: HOLDER_LIMIT,
    },
  };
}

/**
 * @param {ReturnType<typeof buildWalletMap>} mapA
 * @param {Array<ReturnType<typeof buildOverlapFromCachedA>>} comparisons
 */
function buildAggregateSummary(mapA, comparisons) {
  if (comparisons.length <= 1) {
    return null;
  }

  /** @type {Map<string, { wallet: string; tokensMatched: number; tokenSymbols: string[]; mints: string[]; rankA: number; sharePctA: number | null; balanceHumanA: number | null }>} */
  const walletIndex = new Map();

  for (const comparison of comparisons) {
    for (const row of comparison.sharedHolders) {
      const existing = walletIndex.get(row.wallet);
      if (existing) {
        existing.tokensMatched += 1;
        existing.tokenSymbols.push(comparison.tokenB.symbol);
        existing.mints.push(comparison.mintB);
      } else {
        walletIndex.set(row.wallet, {
          wallet: row.wallet,
          tokensMatched: 1,
          tokenSymbols: [comparison.tokenB.symbol],
          mints: [comparison.mintB],
          rankA: row.rankA,
          sharePctA: row.sharePctA,
          balanceHumanA: row.balanceHumanA,
        });
      }
    }
  }

  const multiTokenHolders = [...walletIndex.values()].sort((a, b) => {
    if (b.tokensMatched !== a.tokensMatched) return b.tokensMatched - a.tokensMatched;
    return (b.sharePctA ?? 0) - (a.sharePctA ?? 0);
  });

  const unionOverlapCount = multiTokenHolders.length;
  const fullOverlapCount = multiTokenHolders.filter(
    (h) => h.tokensMatched === comparisons.length,
  ).length;
  const comparedA = mapA.size;

  return {
    compareTokenCount: comparisons.length,
    unionOverlapCount,
    fullOverlapCount,
    unionOverlapRatioA: comparedA > 0 ? unionOverlapCount / comparedA : 0,
    fullOverlapRatioA: comparedA > 0 ? fullOverlapCount / comparedA : 0,
    multiTokenHolders: multiTokenHolders.slice(0, 25),
  };
}

/**
 * @param {{ mintA: string; mintB: string }} input
 */
export async function buildHolderOverlap({ mintA, mintB }) {
  const batch = await buildHolderOverlapBatch({ mintA, mintBs: [mintB] });
  if (!batch.ok) return batch;
  const comparison = batch.data.comparisons[0];
  if (!comparison) {
    return { ok: false, status: 502, error: 'Holder overlap analysis failed' };
  }
  return { ok: true, data: comparison };
}

/**
 * @param {{ mintA: string; mintBs: string[] }} input
 */
export async function buildHolderOverlapBatch({ mintA, mintBs }) {
  const a = typeof mintA === 'string' ? mintA.trim() : '';
  if (!a || !isLikelySolanaMint(a)) {
    return { ok: false, status: 400, error: 'Provide a valid Solana mint for mintA' };
  }

  const rawList = Array.isArray(mintBs) ? mintBs : [];
  /** @type {string[]} */
  const uniqueBs = [];
  const seen = new Set();
  for (const raw of rawList) {
    const b = typeof raw === 'string' ? raw.trim() : '';
    if (!b || !isLikelySolanaMint(b) || b === a || seen.has(b)) continue;
    seen.add(b);
    uniqueBs.push(b);
  }

  if (uniqueBs.length === 0) {
    return {
      ok: false,
      status: 400,
      error: 'Provide at least one valid compare mint via ?mintB= (comma-separated for multiple)',
    };
  }
  if (uniqueBs.length > MAX_COMPARE_MINTS) {
    return {
      ok: false,
      status: 400,
      error: `Compare at most ${MAX_COMPARE_MINTS} tokens at once`,
    };
  }

  const [holdersA, metaA, ...compareResults] = await Promise.all([
    fetchSplTokenTopHolders(a, { limit: HOLDER_LIMIT }).catch((err) => ({
      mint: a,
      decimals: 6,
      supplyHuman: 0,
      holders: [],
      top10ConcentrationPct: null,
      _error: err instanceof Error ? err.message : 'holders_fetch_failed',
    })),
    fetchTokenMeta(a),
    ...uniqueBs.map(async (mintB) => {
      const [holdersB, metaB] = await Promise.all([
        fetchSplTokenTopHolders(mintB, { limit: HOLDER_LIMIT }).catch((err) => ({
          mint: mintB,
          decimals: 6,
          supplyHuman: 0,
          holders: [],
          top10ConcentrationPct: null,
          _error: err instanceof Error ? err.message : 'holders_fetch_failed',
        })),
        fetchTokenMeta(mintB),
      ]);
      return { mintB, holdersB, metaB };
    }),
  ]);

  if (holdersA.holders.length === 0 && compareResults.every((r) => r.holdersB.holders.length === 0)) {
    return {
      ok: false,
      status: 502,
      error: 'Could not fetch holder data for any token. Solana RPC may be temporarily unavailable.',
    };
  }

  const mapA = buildWalletMap(holdersA.holders);
  const comparisons = compareResults.map(({ mintB, holdersB, metaB }) =>
    buildOverlapFromCachedA({
      mintA: a,
      mintB,
      holdersA,
      metaA,
      mapA,
      holdersB,
      metaB,
    }),
  );

  comparisons.sort((x, y) => y.summary.overlapCount - x.summary.overlapCount);

  const tokenA = {
    ...metaA,
    supplyHuman: holdersA.supplyHuman ?? metaA.supplyHuman,
    holdersCompared: mapA.size,
    holdersFetchError: holdersA._error ?? null,
  };

  return {
    ok: true,
    data: {
      mintA: a,
      tokenA,
      comparisons,
      aggregate: buildAggregateSummary(mapA, comparisons),
      fetchedAt: new Date().toISOString(),
    },
  };
}
