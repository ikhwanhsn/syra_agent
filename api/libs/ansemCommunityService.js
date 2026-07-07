/**
 * Public $ANSEM hub snapshot — pump.fun + on-chain holders + optional GMGN insights.
 */
import { fetchSplTokenTopHolders } from './solanaTokenLargestHolders.js';
import { analyzeHolderDistribution } from './holderDistributionService.js';
import { buildHolderInsights } from './holderInsightsService.js';
import { buildPumpfunMarketProfile, fetchPumpfunRaw } from './pumpfunCoinAnalysis.js';
import { fetchTokenKolShills } from './tokenKolShillService.js';
import { normalizePumpfunMeta } from './pumpfunAlphaCore.js';
import { fetchAgentWalletPortfolio } from './agentWalletPortfolio.js';
import { resolveAnsemHolderCount } from './ansemHolderCountService.js';

/** @param {unknown} v */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @param {unknown} ts */
function toMillis(ts) {
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return null;
  if (ts > 1_000_000_000_000) return Math.floor(ts);
  if (ts > 1_000_000_000) return Math.floor(ts * 1000);
  return null;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {number | null} solUsd
 */
function parsePumpExtras(raw, solUsd) {
  let priceUsd = toNum(raw.price_usd);
  if (priceUsd == null && solUsd != null && solUsd > 0) {
    const virtualSol = toNum(raw.virtual_sol_reserves) ?? toNum(raw.real_sol_reserves);
    const virtualToken = toNum(raw.virtual_token_reserves) ?? toNum(raw.real_token_reserves);
    const tokenDecimals = toNum(raw.decimals) ?? 6;
    if (virtualSol != null && virtualToken != null && virtualSol > 0 && virtualToken > 0) {
      const solHuman = virtualSol / 1e9;
      const tokenHuman = virtualToken / 10 ** tokenDecimals;
      if (tokenHuman > 0) priceUsd = (solHuman / tokenHuman) * solUsd;
    }
  }
  return {
    priceUsd,
    holderCount: toNum(raw.holder_count ?? raw.holderCount ?? raw.holders ?? raw.num_holders),
    replyCount: toNum(raw.reply_count ?? raw.replyCount),
    createdTimestampMs: toMillis(raw.created_timestamp ?? raw.createdTimestamp),
    lastTradeTimestampMs: toMillis(raw.last_trade_timestamp ?? raw.lastTradeTimestamp),
    athMarketCapUsd: toNum(raw.ath_market_cap ?? raw.athMarketCap),
    athMarketCapTimestampMs: toMillis(raw.ath_market_cap_timestamp ?? raw.athMarketCapTimestamp),
  };
}

/** @param {string} mint */
async function fetchPumpfunSolUsd() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const base = (process.env.PUMP_FUN_FRONTEND_API_URL ||
      process.env.PUMP_FUN_FRONTEND_API_BASE_V3 ||
      'https://frontend-api-v3.pump.fun').replace(/\/$/, '');
    const res = await fetch(`${base}/sol-price`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const raw = await res.json().catch(() => null);
    if (!raw || typeof raw !== 'object') return null;
    const o = /** @type {Record<string, unknown>} */ (raw);
    return toNum(o.solPrice ?? o.sol_price ?? o.price ?? o.usd);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** @param {string} mint */
async function fetchDexPairCreatedMs(mint) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const url = `https://api.dexscreener.com/tokens/v1/solana/${encodeURIComponent(mint)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) return null;
    const raw = await res.json().catch(() => null);
    if (!Array.isArray(raw) || !raw.length) return null;
    let best = null;
    let bestLiq = -1;
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue;
      const pair = /** @type {Record<string, unknown>} */ (row);
      const liqObj = pair.liquidity;
      const liq =
        liqObj && typeof liqObj === 'object'
          ? toNum(/** @type {Record<string, unknown>} */ (liqObj).usd)
          : 0;
      if ((liq ?? 0) >= bestLiq) {
        bestLiq = liq ?? 0;
        best = pair;
      }
    }
    if (!best) return null;
    return toMillis(best.pairCreatedAt);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {Promise<unknown>} promise
 * @param {number} ms
 */
async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
/**
 * @param {string[]} wallets
 * @param {Map<string, number>} into
 */
async function enrichNetWorthFromPortfolio(wallets, into) {
  const pending = wallets.filter((w) => w && !into.has(w)).slice(0, 5);
  await Promise.allSettled(
    pending.map(async (wallet) => {
      try {
        const portfolio = await withTimeout(fetchAgentWalletPortfolio(wallet), 5000);
        if (!portfolio || typeof portfolio !== 'object') return;
        const total = toNum(/** @type {Record<string, unknown>} */ (portfolio).totalValueUsd);
        if (total != null && total > 0) into.set(wallet, total);
      } catch {
        // optional enrichment
      }
    }),
  );
}

/**
 * @param {string} mint
 */
export async function buildAnsemCommunitySnapshot(mint) {
  const [
    pumpProfileSettled,
    pumpRawSettled,
    solUsdSettled,
    holdersSettled,
    kolSettled,
    dexCreatedSettled,
  ] = await Promise.allSettled([
    buildPumpfunMarketProfile(mint),
    fetchPumpfunRaw(mint),
    fetchPumpfunSolUsd(),
    fetchSplTokenTopHolders(mint, { limit: 20 }),
    fetchTokenKolShills({ mint, symbol: 'ANSEM', name: 'The Black Bull', fast: true }),
    fetchDexPairCreatedMs(mint),
  ]);

  const pumpProfile =
    pumpProfileSettled.status === 'fulfilled' && pumpProfileSettled.value.ok
      ? pumpProfileSettled.value.data
      : null;
  const pumpRaw =
    pumpRawSettled.status === 'fulfilled' && pumpRawSettled.value.ok
      ? pumpRawSettled.value.data
      : null;
  const solUsd = solUsdSettled.status === 'fulfilled' ? solUsdSettled.value : null;
  const holdersPayload =
    holdersSettled.status === 'fulfilled' ? holdersSettled.value : null;
  const kol = kolSettled.status === 'fulfilled' ? kolSettled.value : null;
  const dexCreatedMs =
    dexCreatedSettled.status === 'fulfilled' ? dexCreatedSettled.value : null;

  /** @type {ReturnType<typeof normalizePumpfunMeta> | null} */
  let pumpMeta = null;
  /** @type {ReturnType<typeof parsePumpExtras> | null} */
  let pumpExtras = null;
  if (pumpRaw && typeof pumpRaw === 'object') {
    try {
      pumpMeta = normalizePumpfunMeta(pumpRaw);
    } catch {
      pumpMeta = null;
    }
    pumpExtras = parsePumpExtras(/** @type {Record<string, unknown>} */ (pumpRaw), solUsd);
  }

  const distribution = holdersPayload
    ? analyzeHolderDistribution(holdersPayload)
    : null;

  const topWallets = (holdersPayload?.holders ?? [])
    .map((h) => h.wallet)
    .filter((w) => typeof w === 'string' && w.trim());

  let holderInsights = null;
  let holderInsightsError = null;
  if (topWallets.length > 0) {
    const insightsResult = await withTimeout(
      buildHolderInsights({
        mint,
        wallets: topWallets.slice(0, 10),
      }),
      10_000,
    );
    if (insightsResult && typeof insightsResult === 'object' && 'ok' in insightsResult) {
      if (insightsResult.ok) {
        holderInsights = insightsResult.data;
      } else {
        holderInsightsError = insightsResult.error ?? 'holder_insights_unavailable';
      }
    } else {
      holderInsightsError = 'holder_insights_timeout';
    }
  }

  /** @type {Map<string, number>} */
  const netWorthByWallet = new Map();
  for (const row of holderInsights?.holders ?? []) {
    const nw = toNum(row.netWorth?.netWorthUsd);
    if (row.wallet && nw != null) netWorthByWallet.set(row.wallet, nw);
  }
  await enrichNetWorthFromPortfolio(topWallets, netWorthByWallet);

  const enrichedTopHolders = (distribution?.topHolders ?? holdersPayload?.holders ?? [])
    .slice(0, 10)
    .map((h) => ({
      rank: h.rank,
      wallet: h.wallet,
      sharePct: h.sharePct,
      balanceHuman: h.balanceHuman,
      netWorthUsd: h.wallet ? netWorthByWallet.get(h.wallet) ?? null : null,
    }));

  let totalNetWorthUsd = null;
  const knownNetWorths = enrichedTopHolders
    .map((h) => h.netWorthUsd)
    .filter((n) => n != null && Number.isFinite(n));
  if (knownNetWorths.length > 0) {
    totalNetWorthUsd = knownNetWorths.reduce((sum, n) => sum + (n ?? 0), 0);
  }

  const marketCapUsd =
    pumpProfile?.marketCapUsd ??
    pumpMeta?.marketCapUsd ??
    pumpProfile?.dexPair?.marketCapUsd ??
    null;
  const athMarketCapUsd =
    pumpMeta?.athMarketCapUsd ??
    pumpExtras?.athMarketCapUsd ??
    pumpProfile?.athMarketCapUsd ??
    (marketCapUsd != null && pumpProfile?.dexPair?.marketCapUsd != null
      ? Math.max(marketCapUsd, pumpProfile.dexPair.marketCapUsd)
      : marketCapUsd);
  const replyCount =
    pumpExtras?.replyCount ??
    pumpProfile?.replyCount ??
    (pumpRaw && typeof pumpRaw === 'object'
      ? toNum(/** @type {Record<string, unknown>} */ (pumpRaw).reply_count)
      : null);
  const createdTimestampMs =
    pumpMeta?.createdTimestampMs ??
    pumpExtras?.createdTimestampMs ??
    pumpProfile?.createdTimestampMs ??
    dexCreatedMs ??
    null;
  const lastTradeTimestampMs =
    pumpMeta?.lastTradeTimestampMs ??
    pumpExtras?.lastTradeTimestampMs ??
    pumpProfile?.lastTradeTimestampMs ??
    null;
  const holderResolved = await resolveAnsemHolderCount(mint);
  const holderCount = holderResolved.count;

  return {
    mint,
    holders: {
      count: holderCount,
      top10ConcentrationPct:
        distribution?.concentration?.top10 ?? holdersPayload?.top10ConcentrationPct ?? null,
      top1ConcentrationPct: distribution?.concentration?.top1 ?? null,
      topHolders: enrichedTopHolders,
      supplyHuman: holdersPayload?.supplyHuman ?? distribution?.supplyHuman ?? null,
      totalNetWorthUsd,
    },
    distribution: distribution
      ? {
          decentralizationScore: distribution.decentralizationScore,
          concentration: distribution.concentration,
          tiers: distribution.tiers,
          flags: distribution.flags,
          holderSampleSize: distribution.holderSampleSize,
        }
      : null,
    holderInsights,
    holderInsightsError,
    tokenIntel: {
      symbol: pumpProfile?.symbol ?? pumpMeta?.symbol ?? 'ANSEM',
      name: pumpProfile?.name ?? pumpMeta?.name ?? 'The Black Bull',
      complete: pumpProfile?.complete ?? pumpMeta?.complete ?? null,
      priceUsd: pumpProfile?.priceUsd ?? pumpExtras?.priceUsd ?? pumpProfile?.dexPair?.priceUsd ?? null,
      marketCapUsd,
      athMarketCapUsd,
      athMarketCapTimestampMs:
        pumpMeta?.athMarketCapTimestampMs ?? pumpExtras?.athMarketCapTimestampMs ?? null,
      bondingLiquidityUsd: pumpProfile?.bondingLiquidityUsd ?? null,
      holderCount,
      replyCount,
      createdTimestampMs,
      lastTradeTimestampMs,
      imageUri: pumpProfile?.imageUri ?? null,
      source: pumpProfile?.source ?? (pumpMeta ? 'pumpfun' : null),
    },
    kol: kol?.ok === true ? kol.data : null,
    kolError: kol?.ok === false ? kol.error ?? 'kol_unavailable' : null,
    social: {
      twitter: pumpProfile?.twitter ?? pumpMeta?.twitter ?? null,
      telegram: pumpProfile?.telegram ?? pumpMeta?.telegram ?? null,
      website: pumpProfile?.website ?? pumpMeta?.website ?? null,
      description: pumpProfile?.description ?? pumpMeta?.description ?? null,
    },
    fetchedAt: new Date().toISOString(),
  };
}
