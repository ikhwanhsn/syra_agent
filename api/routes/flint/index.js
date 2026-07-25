/**
 * x402 paid routes — Flint public market data (pairs, book, stats, candles, external tape).
 * Maker quoting / taker swaps are out of scope (see api/docs/flint-integration.md).
 */
import express from "express";
import { getV2Payment } from "../../utils/getV2Payment.js";
import { getResourceDescription } from "../../config/x402ResourceCatalog.js";
import {
  X402_API_PRICE_FLINT_BOOK_USD,
  X402_API_PRICE_FLINT_CANDLES_USD,
  X402_API_PRICE_FLINT_EXTERNAL_TAPE_USD,
  X402_API_PRICE_FLINT_PAIRS_USD,
  X402_API_PRICE_FLINT_STATS_USD,
} from "../../config/x402Pricing.js";
import {
  fetchFlintBook,
  fetchFlintCandles,
  fetchFlintExternalTape,
  fetchFlintPairs,
  fetchFlintStats,
  flintErrorStatus,
  parseFlintBookRequest,
  parseFlintCandlesRequest,
  parseFlintExternalTapeRequest,
  parseFlintPairsRequest,
  parseFlintStatsRequest,
} from "../../libs/flintService.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const PAIR_FIELDS = {
  base: {
    type: "string",
    required: false,
    description: "Base symbol (e.g. PUMP, WSOL, HYPE). Required unless baseId set.",
  },
  quote: {
    type: "string",
    required: false,
    description: "Quote symbol (default USDC)",
  },
  pair: {
    type: "string",
    required: false,
    description: "Pair label alternative, e.g. SOL/USDC",
  },
  baseId: {
    type: "string",
    required: false,
    description: "Flint base spot id (from /flint/pairs)",
  },
  quoteId: {
    type: "string",
    required: false,
    description: "Flint quote spot id (0 = global USDC)",
  },
};

/**
 * @param {string} resource
 * @param {unknown} price
 * @param {Record<string, unknown>} outputSchema
 * @param {Record<string, unknown>} [inputFields]
 */
function paymentBase(resource, price, outputSchema, inputFields = {}) {
  return {
    price,
    description: getResourceDescription(resource),
    discoverable: true,
    resource: `/${resource}`,
    outputSchema,
    inputFields,
  };
}

/**
 * @param {(req: import('express').Request) => unknown} parse
 * @param {(params: any) => Promise<unknown>} fetchFn
 * @param {string} attachKey
 */
function makeHandlers(parse, fetchFn, attachKey) {
  function attach(req, res, next) {
    try {
      req[attachKey] = parse({
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

  async function handle(req, res) {
    try {
      const data = await fetchFn(req[attachKey]);
      await settlePaymentAndSetResponse(res, req);
      res.json({ success: true, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(flintErrorStatus(err)).json({ success: false, error: msg });
    }
  }

  return { attach, handle };
}

/**
 * @param {import('express').Router} router
 * @param {string} path
 * @param {ReturnType<typeof paymentBase>} options
 * @param {ReturnType<typeof makeHandlers>} handlers
 */
function mountPaid(router, path, options, handlers) {
  const { inputFields, ...paymentOptionsBase } = options;
  router.get(
    path,
    requirePayment({
      ...paymentOptionsBase,
      method: "GET",
      inputSchema: { queryParams: inputFields },
    }),
    handlers.attach,
    handlers.handle,
  );
  router.post(
    path,
    express.json(),
    requirePayment({
      ...paymentOptionsBase,
      method: "POST",
      inputSchema: { bodyType: "json", bodyFields: inputFields },
    }),
    handlers.attach,
    handlers.handle,
  );
}

export async function createFlintRouter() {
  const router = express.Router();

  mountPaid(
    router,
    "/pairs",
    paymentBase(
      "flint/pairs",
      X402_API_PRICE_FLINT_PAIRS_USD,
      {
        pairs: { type: "array" },
        count: { type: "integer" },
        computedAt: { type: "string" },
      },
      {},
    ),
    makeHandlers(parseFlintPairsRequest, async () => fetchFlintPairs(), "flintPairsParams"),
  );

  mountPaid(
    router,
    "/book",
    paymentBase(
      "flint/book",
      X402_API_PRICE_FLINT_BOOK_USD,
      {
        level: { type: "string" },
        bids: { type: "array" },
        asks: { type: "array" },
        computedAt: { type: "string" },
      },
      {
        ...PAIR_FIELDS,
        level: {
          type: "string",
          required: false,
          description: "Feed level: L1 | L2 (default) | L3",
        },
      },
    ),
    makeHandlers(parseFlintBookRequest, fetchFlintBook, "flintBookParams"),
  );

  mountPaid(
    router,
    "/stats",
    paymentBase(
      "flint/stats",
      X402_API_PRICE_FLINT_STATS_USD,
      {
        activePairs: { type: "integer" },
        activeMakers: { type: "integer" },
        twentyFourHour: { type: "object" },
        computedAt: { type: "string" },
      },
      {},
    ),
    makeHandlers(parseFlintStatsRequest, async () => fetchFlintStats(), "flintStatsParams"),
  );

  mountPaid(
    router,
    "/candles",
    paymentBase(
      "flint/candles",
      X402_API_PRICE_FLINT_CANDLES_USD,
      {
        kind: { type: "string" },
        candles: { type: "array" },
        fills: { type: "array" },
        count: { type: "integer" },
        computedAt: { type: "string" },
      },
      {
        ...PAIR_FIELDS,
        kind: {
          type: "string",
          required: false,
          description: "candles (default) | fills",
        },
        interval: {
          type: "string",
          required: false,
          description: "Candle interval: 1M, 5M, 15M, 30M, 1H, 4H, 1D (default 5M)",
        },
        limit: {
          type: "integer",
          required: false,
          description: "Max fills when kind=fills (default 50, max 1000)",
        },
        startMicros: {
          type: "string",
          required: false,
          description: "Inclusive start unix microseconds (default: now-24h for candles)",
        },
        endMicros: {
          type: "string",
          required: false,
          description: "Exclusive end unix microseconds (default: now)",
        },
      },
    ),
    makeHandlers(parseFlintCandlesRequest, fetchFlintCandles, "flintCandlesParams"),
  );

  mountPaid(
    router,
    "/external-tape",
    paymentBase(
      "flint/external-tape",
      X402_API_PRICE_FLINT_EXTERNAL_TAPE_USD,
      {
        fills: { type: "array" },
        quotes: { type: "array" },
        fillCount: { type: "integer" },
        quoteCount: { type: "integer" },
        computedAt: { type: "string" },
      },
      {
        ...PAIR_FIELDS,
        timeoutMs: {
          type: "integer",
          required: false,
          description: "Stream collection window ms (default 2500, max 8000)",
        },
        maxEvents: {
          type: "integer",
          required: false,
          description: "Max fill events to collect (default 25, max 50)",
        },
      },
    ),
    makeHandlers(
      parseFlintExternalTapeRequest,
      fetchFlintExternalTape,
      "flintTapeParams",
    ),
  );

  return router;
}
