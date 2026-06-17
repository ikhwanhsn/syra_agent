/**
 * Rich pump.fun + DexScreener market profile for memecoin analysis.
 * Primary path for new / bonding-curve tokens where Tokens.xyz dossier is sparse.
 */
import { normalizePumpfunMeta } from './pumpfunAlphaCore.js';

const PUMP_FUN_API_BASE = (process.env.PUMP_FUN_FRONTEND_API_URL ||
  process.env.PUMP_FUN_FRONTEND_API_BASE_V3 ||
  'https://frontend-api-v3.pump.fun'
).replace(/\/$/, '');

const DEXSCREENER_TOKENS_V1 = 'https://api.dexscreener.com/tokens/v1/solana';

/** @param {unknown} v */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @param {string} mint */
async function fetchPumpfunRaw(mint) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const url = `${PUMP_FUN_API_BASE}/coins-v2/${encodeURIComponent(mint)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        error: res.status === 404 ? 'Token not found on pump.fun' : `pump.fun HTTP ${res.status}`,
        status: res.status === 404 ? 404 : 502,
      };
    }
    const raw = await res.json().catch(() => null);
    if (!raw || typeof raw !== 'object') {
      return { ok: false, error: 'pump.fun invalid body', status: 502 };
    }
    return { ok: true, data: raw };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'pump.fun fetch failed';
    if (msg.includes('abort')) {
      return { ok: false, error: 'pump.fun request timed out', status: 504 };
    }
    return { ok: false, error: msg, status: 502 };
  } finally {
    clearTimeout(timer);
  }
}

/** @returns {Promise<number | null>} */
async function fetchPumpfunSolUsd() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${PUMP_FUN_API_BASE}/sol-price`, {
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

/**
 * @param {Record<string, unknown>} raw
 * @param {number | null} solUsd
 */
function parsePumpfunMarketExtras(raw, solUsd) {
  let priceUsd = toNum(raw.price_usd);

  if (priceUsd == null && solUsd != null && solUsd > 0) {
    const virtualSol = toNum(raw.virtual_sol_reserves) ?? toNum(raw.real_sol_reserves);
    const virtualToken = toNum(raw.virtual_token_reserves) ?? toNum(raw.real_token_reserves);
    const tokenDecimals = toNum(raw.decimals) ?? 6;
    if (virtualSol != null && virtualToken != null && virtualSol > 0 && virtualToken > 0) {
      const solHuman = virtualSol / 1e9;
      const tokenHuman = virtualToken / 10 ** tokenDecimals;
      if (tokenHuman > 0) {
        priceUsd = (solHuman / tokenHuman) * solUsd;
      }
    }
  }

  const realSolLamports = toNum(raw.real_sol_reserves) ?? toNum(raw.virtual_sol_reserves);
  let bondingLiquidityUsd = null;
  if (realSolLamports != null && solUsd != null && solUsd > 0) {
    bondingLiquidityUsd = (realSolLamports / 1e9) * solUsd * 2;
  }

  const imageUri = typeof raw.image_uri === 'string' ? raw.image_uri.trim() : '';

  return {
    priceUsd,
    bondingLiquidityUsd,
    imageUri: imageUri || undefined,
    holderCount: toNum(raw.holder_count ?? raw.holders),
    replyCount: toNum(raw.reply_count),
    totalSupply: toNum(raw.total_supply),
  };
}

/** @param {string} mint */
async function fetchDexScreenerBestPair(mint) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const url = `${DEXSCREENER_TOKENS_V1}/${encodeURIComponent(mint)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const raw = await res.json().catch(() => null);
    if (!Array.isArray(raw) || raw.length === 0) return null;

    /** @type {Record<string, unknown> | null} */
    let best = null;
    let bestLiq = -1;
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue;
      const pair = /** @type {Record<string, unknown>} */ (row);
      const liqObj = pair.liquidity;
      const liq =
        liqObj && typeof liqObj === 'object'
          ? toNum(/** @type {Record<string, unknown>} */ (liqObj).usd)
          : null;
      const liqVal = liq ?? 0;
      if (liqVal >= bestLiq) {
        bestLiq = liqVal;
        best = pair;
      }
    }
    if (!best) return null;

    const priceUsd = toNum(best.priceUsd);
    const liqObj = best.liquidity;
    const liquidityUsd =
      liqObj && typeof liqObj === 'object'
        ? toNum(/** @type {Record<string, unknown>} */ (liqObj).usd)
        : null;
    const volObj = best.volume;
    const volume24hUsd =
      volObj && typeof volObj === 'object'
        ? toNum(/** @type {Record<string, unknown>} */ (volObj).h24)
        : null;
    const changeObj = best.priceChange;
    const priceChange1hPercent =
      changeObj && typeof changeObj === 'object'
        ? toNum(/** @type {Record<string, unknown>} */ (changeObj).h1)
        : null;
    const priceChange24hPercent =
      changeObj && typeof changeObj === 'object'
        ? toNum(/** @type {Record<string, unknown>} */ (changeObj).h24)
        : null;

    return {
      dexId: typeof best.dexId === 'string' ? best.dexId : null,
      pairAddress: typeof best.pairAddress === 'string' ? best.pairAddress : null,
      url: typeof best.url === 'string' ? best.url : null,
      priceUsd,
      marketCapUsd: toNum(best.marketCap) ?? toNum(best.fdv),
      liquidityUsd,
      volume24hUsd,
      priceChange1hPercent,
      priceChange24hPercent,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {unknown} dossierData
 * @param {ReturnType<typeof buildPumpfunMarketProfile> extends Promise<infer R> ? R extends { ok: true, data: infer D } ? D : never : never} pumpProfile
 * @param {Awaited<ReturnType<typeof fetchDexScreenerBestPair>>} dexPair
 */
export function mergeMemecoinMarketStats(dossierData, pumpProfile, dexPair) {
  const stats =
    dossierData?.asset?.stats && typeof dossierData.asset.stats === 'object'
      ? dossierData.asset.stats
      : null;
  const canonical =
    dossierData?.asset?.canonicalMarket && typeof dossierData.asset.canonicalMarket === 'object'
      ? dossierData.asset.canonicalMarket
      : null;

  const dossierPrice = toNum(stats?.price) ?? toNum(canonical?.price);
  const dossierMc = toNum(stats?.marketCap) ?? toNum(canonical?.marketCap);
  const dossierLiq = toNum(stats?.liquidity);
  const dossierVol = toNum(stats?.volume24hUSD) ?? toNum(canonical?.volume24hUSD);
  const dossierCh24 = toNum(stats?.priceChange24hPercent);
  const dossierCh1 = toNum(stats?.priceChange1hPercent);

  const pump = pumpProfile ?? null;
  const dex = dexPair ?? null;

  const priceUsd = dossierPrice ?? dex?.priceUsd ?? pump?.priceUsd ?? null;
  const marketCapUsd = dossierMc ?? pump?.marketCapUsd ?? dex?.marketCapUsd ?? null;
  const liquidityUsd =
    dossierLiq ?? dex?.liquidityUsd ?? pump?.bondingLiquidityUsd ?? null;
  const volume24hUsd = dossierVol ?? dex?.volume24hUsd ?? null;
  const priceChange24hPercent = dossierCh24 ?? dex?.priceChange24hPercent ?? null;
  const priceChange1hPercent = dossierCh1 ?? dex?.priceChange1hPercent ?? null;

  /** @type {('dossier' | 'pumpfun' | 'dexscreener')[]} */
  const sources = [];
  if (dossierPrice != null || dossierMc != null) sources.push('dossier');
  if (pump?.priceUsd != null || pump?.marketCapUsd != null) sources.push('pumpfun');
  if (dex?.priceUsd != null || dex?.liquidityUsd != null) sources.push('dexscreener');

  let primarySource = 'pumpfun';
  if (dex?.liquidityUsd != null && (pump?.complete || !pump?.bondingLiquidityUsd)) {
    primarySource = 'dexscreener';
  } else if (dossierPrice != null && dossierMc != null) {
    primarySource = 'dossier';
  }

  return {
    priceUsd,
    marketCapUsd,
    liquidityUsd,
    volume24hUsd,
    priceChange24hPercent,
    priceChange1hPercent,
    athMarketCapUsd: pump?.athMarketCapUsd ?? null,
    primarySource,
    sources: [...new Set(sources)],
    dexPair: dex
      ? { dexId: dex.dexId, pairAddress: dex.pairAddress, url: dex.url }
      : null,
  };
}

/**
 * @param {string} mint
 */
export async function buildPumpfunMarketProfile(mint) {
  const [pumpRaw, solUsd, dexPair] = await Promise.all([
    fetchPumpfunRaw(mint),
    fetchPumpfunSolUsd(),
    fetchDexScreenerBestPair(mint),
  ]);

  if (!pumpRaw.ok) {
    if (dexPair) {
      return {
        ok: true,
        data: {
          mint,
          symbol: dexPair.dexId ? mint.slice(0, 4).toUpperCase() : 'TOKEN',
          name: 'Token',
          complete: true,
          marketCapUsd: dexPair.marketCapUsd,
          athMarketCapUsd: null,
          priceUsd: dexPair.priceUsd,
          bondingLiquidityUsd: null,
          holderCount: null,
          replyCount: null,
          totalSupply: null,
          createdTimestampMs: null,
          lastTradeTimestampMs: null,
          description: null,
          twitter: null,
          telegram: null,
          website: null,
          imageUri: undefined,
          dexPair,
          source: 'dexscreener',
        },
      };
    }
    return pumpRaw;
  }

  const raw = /** @type {Record<string, unknown>} */ (pumpRaw.data);
  let meta;
  try {
    meta = normalizePumpfunMeta(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'pump.fun normalize failed';
    return { ok: false, error: message, status: 502 };
  }

  const extras = parsePumpfunMarketExtras(raw, solUsd);
  const imageUri =
    typeof raw.image_uri === 'string' && raw.image_uri.trim()
      ? raw.image_uri.trim()
      : extras.imageUri;

  return {
    ok: true,
    data: {
      mint: meta.mint,
      symbol: meta.symbol.toUpperCase(),
      name: meta.name,
      complete: meta.complete,
      program: meta.program ?? null,
      marketCapUsd: meta.marketCapUsd,
      athMarketCapUsd: meta.athMarketCapUsd,
      athMarketCapTimestampMs: meta.athMarketCapTimestampMs,
      createdTimestampMs: meta.createdTimestampMs,
      lastTradeTimestampMs: meta.lastTradeTimestampMs,
      updatedAtMs: meta.updatedAtMs,
      priceUsd: extras.priceUsd,
      bondingLiquidityUsd: extras.bondingLiquidityUsd,
      holderCount: extras.holderCount,
      replyCount: extras.replyCount,
      totalSupply: extras.totalSupply,
      description: meta.description,
      twitter: meta.twitter,
      telegram: meta.telegram,
      website: meta.website,
      imageUri,
      dexPair,
      source: dexPair && meta.complete ? 'merged' : 'pumpfun',
    },
  };
}
