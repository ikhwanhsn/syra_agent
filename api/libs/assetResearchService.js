/**
 * Agent wedge: resolve Tokens canonical asset → risk → Syra intelligence.
 * One call for "canonical mint in, research decision out."
 */
import { runTokensAgentTool } from './tokensAgentService.js';
import { buildAssetIntelligence } from './assetIntelligenceService.js';

function trim(v) {
  return v != null ? String(v).trim() : '';
}

/**
 * @param {Record<string, unknown>} params
 * @returns {{ ok: true, data: object } | { ok: false, error: string, status?: number }}
 */
export async function buildAssetResearch(params = {}) {
  const ref = trim(params.ref) || trim(params.q) || trim(params.ticker) || trim(params.symbol);
  const mint = trim(params.mint);
  let assetId = trim(params.assetId) || trim(params.asset_id);

  if (!assetId && !ref && !mint) {
    return {
      ok: false,
      error: 'Provide assetId, ref (ticker), or mint (Solana address).',
      status: 400,
    };
  }

  /** @type {Record<string, unknown> | null} */
  let resolvePayload = null;
  if (!assetId) {
    const resolved = await runTokensAgentTool('tokens-assets-resolve', {
      ...(ref ? { ref } : {}),
      ...(mint ? { mint } : {}),
    });
    if (!resolved.ok) {
      return {
        ok: false,
        error: resolved.error || 'Could not resolve asset via Tokens.',
        status: resolved.status ?? 502,
      };
    }
    resolvePayload = resolved.data && typeof resolved.data === 'object' ? /** @type {Record<string, unknown>} */ (resolved.data) : null;
    const fromResolve =
      trim(resolvePayload?.assetId) ||
      trim(resolvePayload?.id) ||
      (resolvePayload?.asset && typeof resolvePayload.asset === 'object'
        ? trim(/** @type {Record<string, unknown>} */ (resolvePayload.asset).assetId) ||
          trim(/** @type {Record<string, unknown>} */ (resolvePayload.asset).id)
        : '');
    assetId = fromResolve;
    if (!assetId) {
      return {
        ok: false,
        error: 'Tokens resolve returned no assetId.',
        status: 502,
      };
    }
  }

  const riskPromise = mint
    ? runTokensAgentTool('tokens-risk-summary-mint', { mint })
    : runTokensAgentTool('tokens-asset-risk-summary', { assetId });

  const detailPromise = runTokensAgentTool('tokens-asset-detail', {
    assetId,
    include: 'profile,markets',
    ...(mint ? { mint } : {}),
  });

  const intelPromise = buildAssetIntelligence({
    assetId,
    mint: mint || undefined,
    ref: ref || undefined,
    symbol: trim(params.symbol) || undefined,
    name: trim(params.name) || undefined,
  });

  const [riskResult, detailResult, intelResult] = await Promise.all([
    riskPromise,
    detailPromise,
    intelPromise,
  ]);

  const asset =
    detailResult.ok && detailResult.data && typeof detailResult.data === 'object'
      ? /** @type {Record<string, unknown>} */ (detailResult.data).asset ?? detailResult.data
      : resolvePayload?.asset ?? { assetId };

  const risk = riskResult.ok ? riskResult.data : null;
  const intelligence = intelResult.ok ? intelResult.data : null;

  const signal =
    intelligence && typeof intelligence === 'object'
      ? /** @type {Record<string, unknown>} */ (intelligence).signal
      : null;
  const tradingSignal =
    signal && typeof signal === 'object'
      ? trim(/** @type {Record<string, unknown>} */ (signal).tradingSignal)
      : '';

  /** @type {string[]} */
  const nextActions = [];
  if (riskResult.ok && risk) {
    nextActions.push('Review Tokens risk summary before sizing any trade.');
  } else {
    nextActions.push('Risk unavailable; re-check Tokens risk or mint authority separately.');
  }
  if (tradingSignal) {
    nextActions.push(`Syra signal leans ${tradingSignal}; confirm with news and liquidity.`);
  } else {
    nextActions.push('No Syra trading signal for this asset; use news and sentiment only.');
  }
  nextActions.push('If trading on Solana, verify mint liquidity and venues before swap.');

  return {
    ok: true,
    data: {
      flow: ['resolve', 'risk', 'intelligence', 'action'],
      query: {
        assetId,
        ref: ref || undefined,
        mint: mint || undefined,
      },
      asset,
      risk: {
        ok: Boolean(riskResult.ok),
        data: risk,
        error: riskResult.ok ? undefined : riskResult.error,
      },
      markets:
        detailResult.ok && detailResult.data && typeof detailResult.data === 'object'
          ? /** @type {Record<string, unknown>} */ (detailResult.data).markets ??
            /** @type {Record<string, unknown>} */ (detailResult.data).includes
          : undefined,
      intelligence: {
        ok: Boolean(intelResult.ok),
        data: intelligence,
        error: intelResult.ok ? undefined : intelResult.error,
      },
      nextActions,
      sources: {
        tokens: 'https://docs.tokens.xyz/v1/quickstart',
        tokensOss: 'https://github.com/solana-foundation/tokens',
        hostedApi: process.env.TOKENS_API_BASE_URL || 'https://api.tokens.xyz',
      },
      fetchedAt: new Date().toISOString(),
    },
  };
}
