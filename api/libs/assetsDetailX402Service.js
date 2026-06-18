/**
 * x402 /assets/detail — Tokens.xyz mint dossier (Syra Asset detail page payload).
 */
import { buildMintDossier } from './tokensDossierService.js';

function trim(v) {
  return v != null ? String(v).trim() : '';
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 * @returns {{ ref?: string; mint?: string; assetId?: string }}
 */
export function parseAssetsDetailX402Request(req) {
  const src =
    req.method === 'POST' && req.body && typeof req.body === 'object'
      ? { ...req.query, ...req.body }
      : req.query || {};

  const ref = trim(src.ref);
  const mint = trim(src.mint);
  const assetId = trim(src.assetId);
  const q = trim(src.q);

  if (ref || mint || assetId) {
    return {
      ...(ref && { ref }),
      ...(mint && { mint }),
      ...(assetId && { assetId }),
    };
  }

  if (q) {
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) return { mint: q };
    if (q.includes('-') && q.startsWith('solana-')) return { assetId: q };
    return { ref: q };
  }

  throw new Error('Provide ref, mint, assetId, or q to identify the asset');
}

/**
 * @param {ReturnType<typeof parseAssetsDetailX402Request>} params
 */
export async function fetchAssetsDetailX402(params) {
  const result = await buildMintDossier(params);
  if (!result.ok) {
    const err = new Error(result.error || 'Failed to load asset detail');
    err.status = result.status ?? 502;
    if (result.requestId) err.requestId = result.requestId;
    throw err;
  }
  return result.data;
}
