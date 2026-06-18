/**
 * x402 /assets — Tokens.xyz curated board with Assets page filters, sort, and pagination.
 */
import { fetchAssetsBoard } from './tokensBoardService.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_MAX_PAGES = 20;
const MAX_MAX_PAGES = 20;

const VALID_LISTS = new Set([
  'all',
  'majors',
  'lsts',
  'currencies',
  'rwas',
  'etfs',
  'metals',
  'stocks',
]);

const VALID_GROUP_BY = new Set(['asset', 'mint']);
const VALID_ASSET_CLASS = new Set(['all', 'crypto', 'equity']);
const VALID_SORT = new Set([
  'name',
  'symbol',
  'price',
  'change24h',
  'marketCap',
  'volume24h',
  'assetClass',
]);

/** @param {string} sort */
function defaultOrderForSort(sort) {
  if (sort === 'name' || sort === 'symbol' || sort === 'assetClass') return 'asc';
  return 'desc';
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseAssetsX402Request(req) {
  const src =
    req.method === 'POST' && req.body && typeof req.body === 'object'
      ? { ...req.query, ...req.body }
      : req.query || {};

  const listRaw = String(src.list ?? 'all').trim().toLowerCase();
  const list = VALID_LISTS.has(listRaw) ? listRaw : 'all';

  const groupByRaw = String(src.groupBy ?? 'asset').trim().toLowerCase();
  const groupBy = VALID_GROUP_BY.has(groupByRaw) ? groupByRaw : 'asset';

  const assetClassRaw = String(src.assetClass ?? 'all').trim().toLowerCase();
  const assetClass = VALID_ASSET_CLASS.has(assetClassRaw) ? assetClassRaw : 'all';

  const q = String(src.q ?? src.query ?? '').trim();

  const sortRaw = String(src.sort ?? src.sortKey ?? 'marketCap').trim();
  const sort = VALID_SORT.has(sortRaw) ? sortRaw : 'marketCap';

  const orderRaw = String(src.order ?? src.sortOrder ?? '').trim().toLowerCase();
  const order = orderRaw === 'asc' || orderRaw === 'desc' ? orderRaw : defaultOrderForSort(sort);

  let limit = DEFAULT_LIMIT;
  if (src.limit != null && String(src.limit).trim() !== '') {
    const n = Number(src.limit);
    if (!Number.isFinite(n) || n < 1) throw new Error('limit must be a positive integer');
    limit = Math.min(MAX_LIMIT, Math.floor(n));
  }

  let offset = 0;
  if (src.offset != null && String(src.offset).trim() !== '') {
    const n = Number(src.offset);
    if (!Number.isFinite(n) || n < 0) throw new Error('offset must be a non-negative integer');
    offset = Math.floor(n);
  }

  let maxPages = DEFAULT_MAX_PAGES;
  if (src.maxPages != null && String(src.maxPages).trim() !== '') {
    const n = Number(src.maxPages);
    if (!Number.isFinite(n) || n < 1) throw new Error('maxPages must be a positive integer');
    maxPages = Math.min(MAX_MAX_PAGES, Math.floor(n));
  }

  return { list, groupBy, assetClass, q, sort, order, limit, offset, maxPages };
}

/**
 * @param {ReturnType<typeof import('./tokensBoardService.js').normalizeCuratedItem>[]} rows
 * @param {{ assetClass: string; q: string }} opts
 */
export function filterAssetBoardRows(rows, opts) {
  const q = opts.q.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row) return false;
    if (opts.assetClass !== 'all' && row.assetClass !== opts.assetClass) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.symbol.toLowerCase().includes(q) ||
      row.ref.toLowerCase().includes(q) ||
      row.assetId.toLowerCase().includes(q)
    );
  });
}

/**
 * @param {ReturnType<typeof import('./tokensBoardService.js').normalizeCuratedItem>[]} rows
 * @param {string} key
 * @param {'asc' | 'desc'} order
 */
export function sortAssetBoardRows(rows, key, order) {
  const dir = order === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'symbol':
        cmp = a.symbol.localeCompare(b.symbol);
        break;
      case 'assetClass':
        cmp = a.assetClass.localeCompare(b.assetClass);
        break;
      case 'price':
        cmp = (a.price ?? -1) - (b.price ?? -1);
        break;
      case 'change24h':
        cmp = (a.change24h ?? -Infinity) - (b.change24h ?? -Infinity);
        break;
      case 'marketCap':
        cmp = (a.marketCap ?? 0) - (b.marketCap ?? 0);
        break;
      case 'volume24h':
        cmp = (a.volume24h ?? 0) - (b.volume24h ?? 0);
        break;
      default:
        cmp = (a.marketCap ?? 0) - (b.marketCap ?? 0);
    }
    return cmp * dir;
  });
}

/**
 * @param {ReturnType<typeof parseAssetsX402Request>} params
 */
export async function fetchAssetsX402Board(params) {
  const board = await fetchAssetsBoard({
    list: params.list,
    groupBy: params.groupBy,
    maxPages: params.maxPages,
  });

  if (!board.ok) {
    const err = new Error(board.error || 'Failed to load assets board');
    err.status = board.status ?? 502;
    if (board.requestId) err.requestId = board.requestId;
    throw err;
  }

  const filtered = filterAssetBoardRows(board.data.items, {
    assetClass: params.assetClass,
    q: params.q,
  });
  const sorted = sortAssetBoardRows(filtered, params.sort, params.order);
  const total = sorted.length;
  const items = sorted.slice(params.offset, params.offset + params.limit);

  return {
    items,
    total,
    list: params.list,
    groupBy: params.groupBy,
    assetClass: params.assetClass,
    q: params.q || undefined,
    sort: params.sort,
    order: params.order,
    limit: params.limit,
    offset: params.offset,
    pagesFetched: board.data.pagesFetched,
    sourceTotal: board.data.total,
    computedAt: new Date().toISOString(),
    ...(board.requestId && { requestId: board.requestId }),
  };
}
