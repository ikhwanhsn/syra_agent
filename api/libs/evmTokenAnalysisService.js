/**
 * Market-focused EVM token analysis (Ethereum, Base, BSC, Arbitrum, …).
 * Uses DexScreener for price/liquidity + KOL/X mentions. Holders/security
 * are deferred (unsupported) until an EVM provider is wired.
 */
import { fetchTokenKolShills } from './tokenKolShillService.js';
import { computeSyraAlphaScore } from './memecoinAnalysisService.js';
import { isEvmAddress, normalizeTokenAddress } from './tokenChainDetect.js';

const ANALYSIS_CACHE_TTL_MS = 45_000;
const DEXSCREENER_TOKENS_URL = 'https://api.dexscreener.com/latest/dex/tokens';
const SUPPORTED_EVM_CHAINS = new Set(['ethereum', 'base', 'bsc', 'arbitrum']);

/** @type {Map<string, { expires: number; data: unknown }>} */
const analysisCache = new Map();

/** @param {unknown} v */
function toNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string} source
 * @param {string} message
 */
function unsupportedSection(source, message = 'Not available for EVM tokens yet') {
  return { ok: false, source, unsupported: true, error: message };
}

/**
 * Pick the best-liquidity pair, preferring known EVM chains (ethereum/base/bsc/arbitrum).
 * @param {unknown} raw
 */
function pickBestPair(raw) {
  const pairs = Array.isArray(raw?.pairs)
    ? raw.pairs
    : Array.isArray(raw)
      ? raw
      : [];

  /** @type {Record<string, unknown>[]} */
  const supported = [];
  /** @type {Record<string, unknown>[]} */
  const other = [];

  for (const row of pairs) {
    if (!row || typeof row !== 'object') continue;
    const pair = /** @type {Record<string, unknown>} */ (row);
    const chainId = typeof pair.chainId === 'string' ? pair.chainId.toLowerCase() : '';
    if (SUPPORTED_EVM_CHAINS.has(chainId)) supported.push(pair);
    else other.push(pair);
  }

  const pool = supported.length > 0 ? supported : other;

  /** @type {Record<string, unknown> | null} */
  let best = null;
  let bestLiq = -1;

  for (const pair of pool) {
    const liqObj = pair.liquidity;
    const liq =
      liqObj && typeof liqObj === 'object'
        ? toNum(/** @type {Record<string, unknown>} */ (liqObj).usd)
        : toNum(pair.liquidityUsd);
    const liqVal = liq ?? 0;
    if (liqVal >= bestLiq) {
      bestLiq = liqVal;
      best = pair;
    }
  }

  return best;
}

/**
 * @param {string} address
 */
async function fetchDexScreenerTokenProfile(address) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const url = `${DEXSCREENER_TOKENS_URL}/${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        error: res.status === 404 ? 'Token not found on DexScreener' : `DexScreener HTTP ${res.status}`,
        status: res.status === 404 ? 404 : 502,
      };
    }
    const raw = await res.json().catch(() => null);
    const best = pickBestPair(raw);
    if (!best) {
      return { ok: false, error: 'No DEX pairs found for this token', status: 404 };
    }

    const chainId =
      typeof best.chainId === 'string' && best.chainId.trim()
        ? best.chainId.trim().toLowerCase()
        : 'ethereum';
    const baseToken =
      best.baseToken && typeof best.baseToken === 'object'
        ? /** @type {Record<string, unknown>} */ (best.baseToken)
        : {};
    const info =
      best.info && typeof best.info === 'object'
        ? /** @type {Record<string, unknown>} */ (best.info)
        : {};

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

    const socials = Array.isArray(info.socials) ? info.socials : [];
    /** @type {string | null} */
    let twitter = null;
    /** @type {string | null} */
    let telegram = null;
    for (const s of socials) {
      if (!s || typeof s !== 'object') continue;
      const row = /** @type {Record<string, unknown>} */ (s);
      const type = typeof row.type === 'string' ? row.type.toLowerCase() : '';
      const url = typeof row.url === 'string' ? row.url : '';
      if (type === 'twitter' && url) twitter = url;
      if (type === 'telegram' && url) telegram = url;
    }
    const websites = Array.isArray(info.websites) ? info.websites : [];
    let website = null;
    for (const w of websites) {
      if (!w || typeof w !== 'object') continue;
      const row = /** @type {Record<string, unknown>} */ (w);
      if (typeof row.url === 'string' && row.url.trim()) {
        website = row.url.trim();
        break;
      }
    }

    const imageUrl =
      (typeof info.imageUrl === 'string' && info.imageUrl.trim()) ||
      (typeof best.imageUrl === 'string' && best.imageUrl.trim()) ||
      null;

    const symbol =
      (typeof baseToken.symbol === 'string' && baseToken.symbol.trim()) ||
      address.slice(0, 6).toUpperCase();
    const name =
      (typeof baseToken.name === 'string' && baseToken.name.trim()) ||
      symbol;

    return {
      ok: true,
      data: {
        chain: chainId,
        symbol: symbol.toUpperCase(),
        name,
        imageUri: imageUrl,
        twitter,
        telegram,
        website,
        market: {
          priceUsd: toNum(best.priceUsd),
          marketCapUsd: toNum(best.marketCap) ?? toNum(best.fdv),
          liquidityUsd,
          volume24hUsd,
          priceChange24hPercent,
          priceChange1hPercent,
          athMarketCapUsd: null,
          primarySource: 'dexscreener',
          sources: ['dexscreener'],
          dexPair: {
            dexId: typeof best.dexId === 'string' ? best.dexId : null,
            pairAddress: typeof best.pairAddress === 'string' ? best.pairAddress : null,
            url: typeof best.url === 'string' ? best.url : null,
          },
        },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'DexScreener fetch failed';
    if (msg.includes('abort')) {
      return { ok: false, error: 'DexScreener request timed out', status: 504 };
    }
    return { ok: false, error: msg, status: 502 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @template T
 * @param {Promise<{ ok: boolean; data?: T; error?: string; status?: number }>} promise
 * @param {string} source
 */
async function wrapSource(promise, source) {
  try {
    const result = await promise;
    if (result && typeof result === 'object' && 'ok' in result) {
      if (result.ok) {
        return { ok: true, source, data: result.data ?? null };
      }
      return {
        ok: false,
        source,
        error: result.error || `${source} unavailable`,
        status: result.status,
      };
    }
    return { ok: true, source, data: result ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : `${source} failed`;
    return { ok: false, source, error: message };
  }
}

/**
 * @param {{ address: string; force?: boolean }} input
 */
export async function buildEvmTokenAnalysis(input) {
  const address = normalizeTokenAddress(input.address);
  if (!address || !isEvmAddress(address)) {
    return { ok: false, error: 'Provide a valid EVM token address (0x…)', status: 400 };
  }

  if (!input.force) {
    const cached = analysisCache.get(address);
    if (cached && Date.now() < cached.expires) {
      return { ok: true, data: cached.data };
    }
  }

  const dexResult = await fetchDexScreenerTokenProfile(address);
  if (!dexResult.ok || !dexResult.data) {
    return {
      ok: false,
      error: dexResult.error || 'Could not load EVM token data',
      status: dexResult.status ?? 502,
    };
  }

  const profile = dexResult.data;
  const market = profile.market;

  const kolShillsSection = await wrapSource(
    fetchTokenKolShills(
      {
        mint: address,
        symbol: profile.symbol,
        name: profile.name,
        twitter: profile.twitter,
      },
      { fast: true },
    ),
    'kolShills',
  );

  const kolShillsData = kolShillsSection.ok ? kolShillsSection.data : null;

  const syraAlpha = computeSyraAlphaScore({
    market,
    kolShills: kolShillsData,
  });

  const tokenMeta = {
    symbol: profile.symbol,
    name: profile.name,
    imageUri: profile.imageUri,
    twitter: profile.twitter,
    telegram: profile.telegram,
    website: profile.website,
  };

  const payload = {
    mint: address,
    chain: profile.chain,
    token: tokenMeta,
    syraAlpha,
    market,
    dossier: unsupportedSection('dossier', 'Tokens.xyz dossier is Solana-only for now'),
    kolShills: kolShillsSection,
    holders: unsupportedSection('holders'),
    distribution: unsupportedSection('distribution'),
    onChainSecurity: unsupportedSection('onChainSecurity'),
    pumpfun: {
      ok: true,
      source: 'dexscreener',
      data: {
        mint: address,
        symbol: profile.symbol,
        name: profile.name,
        imageUri: profile.imageUri ?? undefined,
        complete: true,
        twitter: profile.twitter,
        telegram: profile.telegram,
        website: profile.website,
        marketCapUsd: market.marketCapUsd,
        priceUsd: market.priceUsd,
        bondingLiquidityUsd: market.liquidityUsd,
        holderCount: null,
        replyCount: null,
        totalSupply: null,
        source: 'dexscreener',
        dexPair: market.dexPair,
      },
    },
    fetchedAt: new Date().toISOString(),
  };

  analysisCache.set(address, { data: payload, expires: Date.now() + ANALYSIS_CACHE_TTL_MS });

  return { ok: true, data: payload };
}
