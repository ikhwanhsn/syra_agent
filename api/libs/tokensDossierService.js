/**
 * Aggregates Tokens.xyz calls into a single Mint Dossier payload for the dashboard.
 * @see https://docs.tokens.xyz/v1/quickstart
 */
import { runTokensAgentTool } from './tokensAgentService.js';

function trim(v) {
  return v != null ? String(v).trim() : '';
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

  return {
    ok: true,
    data: {
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
    },
    requestId: detailResult.requestId,
  };
}
