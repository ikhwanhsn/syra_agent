/**
 * Free Jupiter swap UI routes — quote, build swap tx, token search.
 * Proxies Jupiter with Syra referral fee; no x402 payment required.
 */
import express from "express";
import { fetchJupiterQuote, parseJupiterQuoteRequest } from "../../libs/jupiterQuoteService.js";
import { buildSwapTransaction } from "../../libs/jupiterSwapBuild.js";
import { searchTokens } from "../../libs/jupiterTokenSearch.js";

function attachParsedQuote(req, res, next) {
  try {
    req.jupiterQuoteParams = parseJupiterQuoteRequest({
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

export async function createJupiterSwapUiRouter() {
  const router = express.Router();

  router.get("/quote", attachParsedQuote, async (req, res) => {
    try {
      const data = await fetchJupiterQuote(req.jupiterQuoteParams);
      res.json({ success: true, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = /required|must be|slippage/i.test(msg) ? 400 : 502;
      res.status(status).json({ success: false, error: msg });
    }
  });

  router.post("/swap", express.json(), async (req, res) => {
    try {
      const quoteResponse = req.body?.quoteResponse ?? req.body?.quote;
      const userPublicKey = String(req.body?.userPublicKey ?? req.body?.taker ?? "").trim();
      const data = await buildSwapTransaction({ quoteResponse, userPublicKey });
      res.json({ success: true, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = /required|must be/i.test(msg) ? 400 : 502;
      res.status(status).json({ success: false, error: msg });
    }
  });

  router.get("/tokens", async (req, res) => {
    try {
      const query = req.query?.query ?? req.query?.q ?? "";
      const data = await searchTokens(String(query));
      res.json({ success: true, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(502).json({ success: false, error: msg });
    }
  });

  return router;
}
