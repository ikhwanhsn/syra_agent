/**
 * Aggregates Tokens.xyz calls into a single Mint Dossier payload for the dashboard.
 * @see https://docs.tokens.xyz/v1/quickstart
 */
import { runTokensAgentTool } from './tokensAgentService.js';
import { fetchMintChartFallback, hasEnoughCandles } from './mintChartFallbackService.js';

const DOSSIER_CACHE_TTL_MS = 60_000;

/** @type {Map<string, { expires: number; data: object }>} */
const dossierCache = new Map();

function trim(v) {
  return v != null ? String(v).trim() : '';
}

/**
 * @param {{ ref?: string; mint?: string; assetId?: string; lite?: boolean }} input
 */
function dossierCacheKey(input) {
  return [
    trim(input.assetId).toLowerCase(),
    trim(input.mint),
    trim(input.ref).toLowerCase(),
    input.lite === true ? 'lite' : 'full',
  ].join('|');
}

/** @param {string} s */
function isLikelySolanaMint(s) {
  const t = trim(s);
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

/**
 * @param {{ ref?: string; mint?: string; assetId?: string; lite?: boolean }} input
 */
export async function buildMintDossier(input) {
  const ref = trim(input.ref);
  const mint = trim(input.mint);
  const assetIdParam = trim(input.assetId);
  const lite = input.lite === true;

  if (!ref && !mint && !assetIdParam) {
    return { ok: false, error: 'Provide ref, mint, or assetId', status: 400 };
  }

  const cacheKey = dossierCacheKey({ ref, mint, assetId: assetIdParam, lite });
  const cached = dossierCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return { ok: true, data: cached.data };
  }

  /** @type {{ ref?: string; mint?: string; assetId?: string }} */
  const query = {};
  if (ref) query.ref = ref;
  if (mint) query.mint = mint;
  if (assetIdParam) query.assetId = assetIdParam;

  let assetId = assetIdParam;
  /** @type {unknown} */
  let resolveData = null;
  let chartMint = mint || undefined;
  /** @type {unknown} */
  let mintRiskEarly = null;

  const mintForRisk = chartMint && isLikelySolanaMint(chartMint) ? chartMint : null;

  if (!assetId) {
    const resolveParams = mint ? { mint } : { ref };
    const [resolved, riskMintEarly] = await Promise.all([
      runTokensAgentTool('tokens-assets-resolve', resolveParams),
      lite && mintForRisk
        ? runTokensAgentTool('tokens-risk-summary-mint', { mint: mintForRisk })
        : Promise.resolve(null),
    ]);
    if (!resolved.ok) {
      return {
        ok: false,
        error: resolved.error || 'Could not resolve asset',
        status: resolved.status ?? 502,
        requestId: resolved.requestId,
      };
    }
    resolveData = resolved.data;
    assetId = trim(resolved.data?.assetId);
    if (!assetId) {
      return { ok: false, error: 'Resolve returned no assetId', status: 502 };
    }
    if (!chartMint && resolved.data?.variant?.mint) {
      chartMint = trim(resolved.data.variant.mint);
    }
    if (riskMintEarly?.ok) {
      mintRiskEarly = riskMintEarly.data;
    }
  }

  const detailParams = {
    assetId,
    include: lite ? 'profile,risk' : 'profile,risk,markets',
  };
  if (chartMint) detailParams.mint = chartMint;

  const ohlcvParams = {
    assetId,
    interval: '1H',
  };
  if (chartMint) ohlcvParams.mint = chartMint;

  const detailPromise = runTokensAgentTool('tokens-asset-detail', detailParams);
  const ohlcvPromise = lite ? Promise.resolve(null) : runTokensAgentTool('tokens-asset-ohlcv', ohlcvParams);
  const riskPromise =
    mintForRisk && mintRiskEarly == null
      ? runTokensAgentTool('tokens-risk-summary-mint', { mint: mintForRisk })
      : Promise.resolve(null);

  const [detailResult, ohlcvResult, mintRiskLate] = await Promise.all([
    detailPromise,
    ohlcvPromise,
    riskPromise,
  ]);

  if (!detailResult.ok) {
    return {
      ok: false,
      error: detailResult.error || 'Failed to load asset',
      status: detailResult.status ?? 502,
      requestId: detailResult.requestId,
    };
  }

  const asset = detailResult.data?.asset ?? null;
  const includes = detailResult.data?.includes ?? null;

  if (!chartMint && asset?.primaryVariant?.mint) {
    chartMint = trim(asset.primaryVariant.mint);
  }

  let mintRisk = mintRiskEarly;
  if (!mintRisk && mintRiskLate?.ok) {
    mintRisk = mintRiskLate.data;
  }

  const candles =
    ohlcvResult?.ok && Array.isArray(ohlcvResult.data?.candles) ? ohlcvResult.data.candles : [];

  const data = {
    query,
    assetId,
    chartMint: chartMint || null,
    resolve: resolveData,
    asset,
    includes,
    ohlcv: ohlcvResult?.ok
      ? {
          interval: ohlcvResult.data?.interval ?? '1H',
          mint: ohlcvResult.data?.mint ?? chartMint ?? null,
          from: ohlcvResult.data?.from ?? null,
          to: ohlcvResult.data?.to ?? null,
          candles,
        }
      : {
          interval: '1H',
          mint: chartMint ?? null,
          candles: [],
          error: ohlcvResult?.error ?? (lite ? 'skipped' : undefined),
        },
    mintRisk,
    fetchedAt: new Date().toISOString(),
  };

  dossierCache.set(cacheKey, {
    data,
    expires: Date.now() + DOSSIER_CACHE_TTL_MS,
  });

  return {
    ok: true,
    data,
    requestId: detailResult.requestId,
  };
}

/**
 * Fast swap-panel chart payload: resolve + OHLCV + profile only (no markets/risk).
 * @param {{ mint: string }} input
 */
export async function buildMintChart(input) {
  const mint = trim(input.mint);
  if (!mint || !isLikelySolanaMint(mint)) {
    return { ok: false, error: 'Provide a valid Solana mint', status: 400 };
  }

  const cacheKey = `chart|ltf|${mint}`;
  const cached = dossierCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return { ok: true, data: cached.data };
  }

  const resolved = await runTokensAgentTool('tokens-assets-resolve', { mint });

  let assetId = resolved.ok ? trim(resolved.data?.assetId) : '';
  let chartMint = mint;
  if (resolved.ok && resolved.data?.variant?.mint) {
    chartMint = trim(resolved.data.variant.mint) || mint;
  }
  if (!assetId) {
    assetId = `solana-${mint}`;
  }

  /** @type {unknown} */
  let resolveData = resolved.ok ? resolved.data : null;
  /** @type {unknown} */
  let asset = null;
  /** @type {unknown} */
  let includes = null;
  /** @type {Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>} */
  let candles = [];
  let chartInterval = '5m';
  /** @type {string | undefined} */
  let chartSource = resolved.ok ? 'tokens.xyz' : undefined;
  /** @type {string | undefined} */
  let ohlcvError = resolved.ok ? undefined : resolved.error || 'Could not resolve asset';

  // Prefer pump.fun low-timeframe candles for fresh Solana mints (earn / pump launches).
  const fallbackFirst = await fetchMintChartFallback(mint);
  if (fallbackFirst?.source === 'pumpfun') {
    candles = fallbackFirst.candles;
    chartInterval = fallbackFirst.interval;
    chartSource = fallbackFirst.source;
    ohlcvError = undefined;
  }

  if (resolved.ok) {
    const [detailResult, ohlcvResult] = await Promise.all([
      runTokensAgentTool('tokens-asset-detail', {
        assetId,
        mint: chartMint,
        include: 'profile',
      }),
      // Only hit Tokens.xyz OHLCV when pump.fun didn't already give enough low-TF bars.
      hasEnoughCandles(candles)
        ? Promise.resolve(null)
        : runTokensAgentTool('tokens-asset-ohlcv', {
            assetId,
            mint: chartMint,
            interval: '5m',
          }),
    ]);

    asset = detailResult.ok ? detailResult.data?.asset ?? null : null;
    includes = detailResult.ok ? detailResult.data?.includes ?? null : null;

    if (!hasEnoughCandles(candles) && ohlcvResult?.ok && Array.isArray(ohlcvResult.data?.candles)) {
      candles = ohlcvResult.data.candles;
      chartInterval = ohlcvResult.data?.interval ?? '5m';
      chartSource = 'tokens.xyz';
      ohlcvError = undefined;
    } else if (!hasEnoughCandles(candles)) {
      ohlcvError = ohlcvResult?.error ?? 'Chart unavailable';
    }
  }

  if (!hasEnoughCandles(candles) && fallbackFirst) {
    candles = fallbackFirst.candles;
    chartInterval = fallbackFirst.interval;
    chartSource = fallbackFirst.source;
    ohlcvError = undefined;
  }

  if (!hasEnoughCandles(candles) && !resolved.ok) {
    return {
      ok: false,
      error: ohlcvError || resolved.error || 'Could not resolve asset',
      status: resolved.status ?? 502,
      requestId: resolved.requestId,
    };
  }

  const data = {
    query: { mint },
    assetId,
    chartMint,
    resolve: resolveData,
    asset,
    includes,
    ohlcv: hasEnoughCandles(candles)
      ? {
          interval: chartInterval,
          mint: chartMint,
          candles,
          source: chartSource,
        }
      : {
          interval: chartInterval,
          mint: chartMint,
          candles: [],
          error: ohlcvError ?? 'No chart data available for this token yet.',
          source: chartSource,
        },
    mintRisk: null,
    fetchedAt: new Date().toISOString(),
  };

  dossierCache.set(cacheKey, {
    data,
    expires: Date.now() + DOSSIER_CACHE_TTL_MS,
  });

  return {
    ok: true,
    data,
    requestId: resolved.requestId,
  };
}
