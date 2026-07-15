/**
 * x402 paid routes — pump.fun trending and movers lists (frontend-api-v3 proxy).
 */
import express from "express";
import { getV2Payment } from "../../utils/getV2Payment.js";
import { getResourceDescription } from "../../config/x402ResourceCatalog.js";
import { X402_API_PRICE_PUMP_FUN_MARKET_LIST_USD } from "../../config/x402Pricing.js";
import { fetchPumpfunMarketList } from "../../libs/pumpfunMarketListService.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const LIST_QUERY_SCHEMA = {
  limit: {
    type: "integer",
    required: false,
    description: "Max coins to return (default 20, max 50)",
  },
  offset: {
    type: "integer",
    required: false,
    description: "Pagination offset (default 0)",
  },
  includeNsfw: {
    type: "boolean",
    required: false,
    description: "Include NSFW coins (default false)",
  },
};

const outputSchema = {
  kind: { type: "string", description: "trending | movers" },
  coins: { type: "array", description: "Normalized pump.fun coin rows" },
  count: { type: "integer" },
  limit: { type: "integer" },
  offset: { type: "integer" },
  includeNsfw: { type: "boolean" },
  upstream: { type: "object", description: "Primary path and whether a fallback feed was used" },
  computedAt: { type: "string" },
};

/**
 * @param {{ kind: "trending" | "movers"; resource: string; description: string }} opts
 */
function createMarketListRouter(opts) {
  const router = express.Router();

  const paymentOptionsBase = {
    price: X402_API_PRICE_PUMP_FUN_MARKET_LIST_USD,
    description: opts.description,
    discoverable: true,
    resource: opts.resource,
    outputSchema,
  };

  async function respond(req, res) {
    try {
      const data = await fetchPumpfunMarketList(opts.kind, {
        method: req.method,
        query: req.query,
        body: req.body,
      });
      await settlePaymentAndSetResponse(res, req);
      res.json({ success: true, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = /must be|required|kind must/i.test(msg) ? 400 : 502;
      res.status(status).json({ success: false, error: msg });
    }
  }

  router.get(
    "/",
    requirePayment({
      ...paymentOptionsBase,
      method: "GET",
      inputSchema: { queryParams: LIST_QUERY_SCHEMA },
    }),
    respond,
  );

  router.post(
    "/",
    express.json(),
    requirePayment({
      ...paymentOptionsBase,
      method: "POST",
      inputSchema: {
        bodyType: "json",
        bodyFields: LIST_QUERY_SCHEMA,
      },
    }),
    respond,
  );

  return router;
}

export function createPumpfunTrendingRouter() {
  return createMarketListRouter({
    kind: "trending",
    resource: "/pumpfun/trending",
    description: getResourceDescription("pumpfun/trending"),
  });
}

export function createPumpfunMoversRouter() {
  return createMarketListRouter({
    kind: "movers",
    resource: "/pumpfun/movers",
    description: getResourceDescription("pumpfun/movers"),
  });
}
