/**
 * Tokens.xyz curated list → dashboard assets board rows.
 * @see https://docs.tokens.xyz/v1/quickstart
 */
import { runTokensAgentTool } from './tokensAgentService.js';

const MAX_PAGES = 20;
const PAGE_LIMIT = 500;

/** @param {unknown} raw */
function normalizeCuratedItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const row = /** @type {Record<string, unknown>} */ (raw);
  const asset =
    row.asset && typeof row.asset === 'object'
      ? /** @type {Record<string, unknown>} */ (row.asset)
      : row;

  const assetId = String(asset.assetId ?? row.assetId ?? row.id ?? '').trim();
  const name = String(asset.name ?? row.name ?? '').trim();
  const symbol = String(asset.symbol ?? row.symbol ?? row.ticker ?? name ?? assetId).trim();
  if (!assetId && !symbol) return null;

  const stats =
    asset.stats && typeof asset.stats === 'object'
      ? /** @type {Record<string, unknown>} */ (asset.stats)
      : row.stats && typeof row.stats === 'object'
        ? /** @type {Record<string, unknown>} */ (row.stats)
        : null;

  const canonical =
    asset.canonicalMarket && typeof asset.canonicalMarket === 'object'
      ? /** @type {Record<string, unknown>} */ (asset.canonicalMarket)
      : null;

  const primaryVariant =
    asset.primaryVariant && typeof asset.primaryVariant === 'object'
      ? /** @type {Record<string, unknown>} */ (asset.primaryVariant)
      : row.primaryVariant && typeof row.primaryVariant === 'object'
        ? /** @type {Record<string, unknown>} */ (row.primaryVariant)
        : row.variant && typeof row.variant === 'object'
          ? /** @type {Record<string, unknown>} */ (row.variant)
          : null;

  const category = String(asset.category ?? row.category ?? '').trim();
  const ref = String(row.ref ?? asset.ref ?? assetId).trim();
  const imageUrl =
    typeof asset.imageUrl === 'string'
      ? asset.imageUrl
      : typeof row.imageUrl === 'string'
        ? row.imageUrl
        : undefined;

  const price = num(stats?.price ?? canonical?.price ?? row.price);
  const marketCap = num(stats?.marketCap ?? canonical?.marketCap ?? row.marketCap);
  const volume24h = num(stats?.volume24hUSD ?? canonical?.volume24hUSD ?? row.volume24hUSD ?? row.volume24h);
  const change24h = num(
    stats?.priceChange24hPercent ?? row.priceChange24hPercent ?? row.priceChange24h,
  );
  const liquidity = num(stats?.liquidity ?? row.liquidity);

  const mint =
    typeof primaryVariant?.mint === 'string'
      ? primaryVariant.mint
      : typeof row.mint === 'string'
        ? row.mint
        : undefined;

  const assetClass =
    category.toLowerCase().includes('stock') || category.toLowerCase().includes('equity')
      ? 'equity'
      : 'crypto';

  const resolvedAssetId = assetId || symbol.toLowerCase();

  return {
    key: resolvedAssetId,
    ref: ref || resolvedAssetId,
    assetId: resolvedAssetId,
    name: name || symbol,
    symbol: symbol || resolvedAssetId,
    assetClass,
    category: category || undefined,
    price,
    change24h,
    marketCap,
    volume24h,
    liquidity,
    imageUrl,
    mint,
  };
}

/** @param {unknown} v */
function num(v) {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** @param {unknown} body */
function extractCuratedItems(body) {
  if (!body || typeof body !== 'object') return { items: [], nextOffset: null };
  const root = /** @type {Record<string, unknown>} */ (body);

  /** @type {unknown[]} */
  const candidates = [];
  if (Array.isArray(root.assets)) candidates.push(...root.assets);
  if (Array.isArray(root.items)) candidates.push(...root.items);
  if (Array.isArray(root.data)) candidates.push(...root.data);

  const data = root.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const d = /** @type {Record<string, unknown>} */ (data);
    if (Array.isArray(d.assets)) candidates.push(...d.assets);
    if (Array.isArray(d.items)) candidates.push(...d.items);
  }

  const pagination =
    root.pagination && typeof root.pagination === 'object'
      ? /** @type {Record<string, unknown>} */ (root.pagination)
      : data && typeof data === 'object' && !Array.isArray(data)
        ? /** @type {Record<string, unknown>} */ (
            /** @type {Record<string, unknown>} */ (data).pagination ?? {}
          )
        : null;

  const nextOffsetRaw = pagination?.nextOffset;
  const nextOffset =
    nextOffsetRaw == null || nextOffsetRaw === ''
      ? null
      : Number.isFinite(Number(nextOffsetRaw))
        ? Number(nextOffsetRaw)
        : null;

  const seen = new Set();
  /** @type {ReturnType<typeof normalizeCuratedItem>[]} */
  const items = [];
  for (const c of candidates) {
    const hit = normalizeCuratedItem(c);
    if (!hit) continue;
    const key = hit.assetId.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(hit);
  }

  return { items, nextOffset };
}

/**
 * @param {{ list?: string; groupBy?: string; maxPages?: number }} [opts]
 */
export async function fetchAssetsBoard(opts = {}) {
  const list = opts.list?.trim() || 'all';
  const groupBy = opts.groupBy?.trim() || 'asset';
  const maxPages = Math.min(MAX_PAGES, Math.max(1, opts.maxPages ?? MAX_PAGES));

  /** @type {ReturnType<typeof normalizeCuratedItem>[]} */
  const all = [];
  const seen = new Set();
  let offset = 0;
  let pages = 0;
  let requestId;

  while (pages < maxPages) {
    const result = await runTokensAgentTool('tokens-assets-curated', {
      list,
      groupBy,
      limit: String(PAGE_LIMIT),
      offset: String(offset),
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error || 'Failed to load assets board',
        status: result.status ?? 502,
        requestId: result.requestId,
      };
    }

    if (result.requestId) requestId = result.requestId;
    const { items, nextOffset } = extractCuratedItems(result.data);

    for (const item of items) {
      if (!item) continue;
      const key = item.assetId.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(item);
    }

    pages += 1;
    if (nextOffset == null || items.length === 0) break;
    offset = nextOffset;
  }

  return {
    ok: true,
    data: {
      items: all,
      total: all.length,
      list,
      groupBy,
      pagesFetched: pages,
    },
    requestId,
  };
}
