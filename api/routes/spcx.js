/**
 * x402 paid route — SPCX / tokenized equity intelligence.
 * Revenue → $SYRA buybacks via settlePaymentAndSetResponse (production).
 */
import express from "express";
import { getResourceDescription } from "../config/x402ResourceCatalog.js";
import { getV2Payment } from "../utils/getV2Payment.js";
import {
  X402_API_PRICE_SPCX_USD,
  X402_API_PRICE_EQUITY_USD,
} from "../config/x402Pricing.js";
import { buildSpcxIntelligence } from "../libs/spcxIntelligence.js";
import { buildEquityIntelligence, getEquityCatalogMeta } from "../libs/equityIntelligence.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const outputSchema = {
  symbol: { type: "string" },
  nasdaqTicker: { type: "string" },
  nasdaqPriceUsd: { type: "number", nullable: true },
  venues: { type: "array" },
  agentBias: { type: "string" },
  agentTake: { type: "string" },
  riskNotes: { type: "array" },
  opportunities: { type: "array" },
  computedAt: { type: "string" },
  disclaimer: { type: "string" },
};

/**
 * @param {{ priceUsd: number; resource: string }} opts
 */
function paidGetHandler(opts) {
  const catalogSegment = opts.resource === "/spcx" ? "spcx" : "equity";
  return [
    (req, res, next) =>
      requirePayment({
        price: opts.priceUsd,
        description: getResourceDescription(catalogSegment),
        method: "GET",
        discoverable: true,
        resource: opts.resource,
        inputSchema: {
          symbol: { type: "string", description: "Equity symbol e.g. SPCXx, TSLAx" },
        },
        outputSchema,
      })(req, res, next),
    async (req, res) => {
      try {
        const symbol = String(req.query.symbol || "SPCXx").trim();

        const report =
          /^SPCX|^SPACEX/i.test(symbol)
            ? await buildSpcxIntelligence()
            : await buildEquityIntelligence({ symbol });

        await settlePaymentAndSetResponse(res, req);
        res.json({ success: true, data: report });
      } catch (error) {
        const msg = error?.message || "Server error";
        res.status(500).json({ success: false, error: msg });
      }
    },
  ];
}

export async function createSpcxRouter() {
  const router = express.Router();

  router.get("/", ...paidGetHandler({ priceUsd: X402_API_PRICE_SPCX_USD, resource: "/spcx" }));

  router.get("/catalog", async (_req, res) => {
    res.json({ success: true, data: getEquityCatalogMeta() });
  });

  return router;
}

/** Generalized equity intelligence route (parametric symbol). */
export async function createEquityRouter() {
  const router = express.Router();

  router.get(
    "/",
    ...paidGetHandler({ priceUsd: X402_API_PRICE_EQUITY_USD, resource: "/equity" }),
  );

  router.get("/catalog", async (_req, res) => {
    res.json({ success: true, data: getEquityCatalogMeta() });
  });

  return router;
}
