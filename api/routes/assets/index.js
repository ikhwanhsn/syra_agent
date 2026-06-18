/**
 * x402 paid route — Tokens.xyz assets board (same data model as Syra Assets page).
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_ASSETS_BOARD_USD } from '../../config/x402Pricing.js';
import {
  fetchAssetsX402Board,
  parseAssetsX402Request,
} from '../../libs/assetsX402Service.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const LIST_PARAM = {
  type: 'string',
  required: false,
  description:
    'Curated list: all | majors | lsts | currencies | rwas | etfs | metals | stocks (default all)',
};

const GROUP_BY_PARAM = {
  type: 'string',
  required: false,
  description: 'Group curated rows by asset or mint (default asset)',
};

const ASSET_CLASS_PARAM = {
  type: 'string',
  required: false,
  description: 'Filter: all | crypto | equity (default all)',
};

const Q_PARAM = {
  type: 'string',
  required: false,
  description: 'Search name, symbol, ref, or assetId (case-insensitive substring)',
};

const SORT_PARAM = {
  type: 'string',
  required: false,
  description:
    'Sort key: marketCap | name | symbol | price | change24h | volume24h | assetClass (default marketCap)',
};

const ORDER_PARAM = {
  type: 'string',
  required: false,
  description: 'Sort order: asc | desc (default depends on sort key)',
};

const LIMIT_PARAM = {
  type: 'integer',
  required: false,
  description: 'Page size after filter/sort (default 20, max 100)',
};

const OFFSET_PARAM = {
  type: 'integer',
  required: false,
  description: 'Pagination offset after filter/sort (default 0)',
};

const MAX_PAGES_PARAM = {
  type: 'integer',
  required: false,
  description: 'Upstream Tokens.xyz pages to fetch (default 20, max 20; 500 rows/page)',
};

const inputFields = {
  list: LIST_PARAM,
  groupBy: GROUP_BY_PARAM,
  assetClass: ASSET_CLASS_PARAM,
  q: Q_PARAM,
  sort: SORT_PARAM,
  order: ORDER_PARAM,
  limit: LIMIT_PARAM,
  offset: OFFSET_PARAM,
  maxPages: MAX_PAGES_PARAM,
};

const paymentOptionsBase = {
  price: X402_API_PRICE_ASSETS_BOARD_USD,
  description: getResourceDescription('assets'),
  discoverable: true,
  resource: '/assets',
  outputSchema: {
    items: { type: 'array', description: 'Asset board rows (name, symbol, price, marketCap, etc.)' },
    total: { type: 'integer', description: 'Total rows after filter/sort' },
    list: { type: 'string' },
    groupBy: { type: 'string' },
    assetClass: { type: 'string' },
    sort: { type: 'string' },
    order: { type: 'string' },
    limit: { type: 'integer' },
    offset: { type: 'integer' },
    pagesFetched: { type: 'integer' },
    sourceTotal: { type: 'integer', description: 'Rows fetched from upstream before filter' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.assetsX402Params = parseAssetsX402Request({
      method: req.method,
      query: req.query,
      body: req.body,
    });
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
}

async function handleAssets(req, res) {
  try {
    const data = await fetchAssetsX402Board(req.assetsX402Params);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status =
      err && typeof err === 'object' && 'status' in err && Number.isFinite(err.status)
        ? err.status
        : /must be|required/i.test(msg)
          ? 400
          : 502;
    res.status(status).json({
      success: false,
      error: msg,
      ...(err && typeof err === 'object' && err.requestId && { requestId: err.requestId }),
    });
  }
}

export async function createAssetsX402Router() {
  const router = express.Router();

  router.get(
    '/',
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: inputFields },
    }),
    handleAssets,
  );

  router.post(
    '/',
    express.json(),
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'POST',
      inputSchema: {
        bodyType: 'json',
        bodyFields: inputFields,
      },
    }),
    handleAssets,
  );

  return router;
}
