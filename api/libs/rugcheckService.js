/**
 * RugCheck public API — Solana token risk report.
 * Free upstream; no API key required.
 */
import { createBoundedTtlCache } from '../utils/boundedTtlCache.js';

const BASE_URL = 'https://api.rugcheck.xyz/v1';
const FETCH_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 90_000;

const cache = createBoundedTtlCache({
  name: 'rugcheck-report',
  maxEntries: 300,
  defaultTtlMs: CACHE_TTL_MS,
});

const SOLANA_MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * @param {unknown} v
 * @returns {number | null}
 */
function toNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseRugcheckReportRequest(req) {
  const source = req.method === 'POST' ? req.body ?? {} : req.query ?? {};
  const mint = typeof source.mint === 'string' ? source.mint.trim() : '';
  if (!mint) throw new Error('mint is required (Solana base58 address)');
  if (!SOLANA_MINT_RE.test(mint)) throw new Error('mint must be a valid Solana base58 address');
  return { mint };
}

/**
 * @param {Record<string, unknown>} json
 */
function normalizeReport(json) {
  const risks = Array.isArray(json.risks)
    ? json.risks.map((r) => ({
        name: typeof r.name === 'string' ? r.name : null,
        level: typeof r.level === 'string' ? r.level : null,
        description: typeof r.description === 'string' ? r.description : null,
        score: toNum(r.score),
      }))
    : [];

  const topHolders = Array.isArray(json.topHolders)
    ? json.topHolders.slice(0, 10).map((h) => ({
        address: typeof h.address === 'string' ? h.address : typeof h.owner === 'string' ? h.owner : null,
        pct: toNum(h.pct ?? h.percentage),
        amount: toNum(h.amount ?? h.uiAmount),
      }))
    : [];

  const mintAuthority =
    json.mintAuthority != null
      ? json.mintAuthority
      : json.token?.mintAuthority ?? null;
  const freezeAuthority =
    json.freezeAuthority != null
      ? json.freezeAuthority
      : json.token?.freezeAuthority ?? null;

  return {
    mint: typeof json.mint === 'string' ? json.mint : null,
    tokenName: typeof json.tokenMeta?.name === 'string' ? json.tokenMeta.name : typeof json.fileMeta?.name === 'string' ? json.fileMeta.name : null,
    tokenSymbol:
      typeof json.tokenMeta?.symbol === 'string'
        ? json.tokenMeta.symbol
        : typeof json.fileMeta?.symbol === 'string'
          ? json.fileMeta.symbol
          : null,
    riskScore: toNum(json.score ?? json.riskScore),
    risks,
    topHolders,
    mintAuthority,
    freezeAuthority,
    lpLocked: json.markets?.[0]?.lp?.lpLocked ?? json.lpLocked ?? null,
    marketCap: toNum(json.marketCap ?? json.usdMarketCap),
    totalHolders: toNum(json.totalHolders ?? json.holderCount),
    rugged: json.rugged === true,
    source: 'rugcheck',
    computedAt: new Date().toISOString(),
  };
}

/**
 * @param {{ mint: string }} params
 */
export async function fetchRugcheckReport(params) {
  const cacheKey = `mint:${params.mint}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/tokens/${encodeURIComponent(params.mint)}/report`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (res.status === 404) {
    throw new Error(`RugCheck: no report found for mint ${params.mint}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`RugCheck upstream ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const data = normalizeReport(json);
  cache.set(cacheKey, data);
  return data;
}
