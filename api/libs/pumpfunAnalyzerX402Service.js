/**
 * x402 /pumpfun/analyzer — full memecoin analysis (Pumpfun Alpha page payload).
 */
import { buildMemecoinAnalysis } from './memecoinAnalysisService.js';

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
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parsePumpfunAnalyzerX402Request(req) {
  const src =
    req.method === 'POST' && req.body && typeof req.body === 'object'
      ? { ...req.query, ...req.body }
      : req.query || {};

  const mint = trim(src.mint ?? src.q);
  if (!mint || !isLikelySolanaMint(mint)) {
    throw new Error('Provide a valid Solana mint address via mint');
  }
  return { mint };
}

/**
 * @param {ReturnType<typeof parsePumpfunAnalyzerX402Request>} params
 */
export async function fetchPumpfunAnalyzerX402(params) {
  const result = await buildMemecoinAnalysis({ mint: params.mint });
  if (!result.ok) {
    const err = new Error(result.error || 'Pump.fun analysis failed');
    err.status = result.status ?? 502;
    if (result.partial) err.partial = result.partial;
    throw err;
  }
  return result.data;
}
