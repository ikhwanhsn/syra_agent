/**
 * Nevermined-gated crypto news pilot.
 * GET /partners/nevermined/news — same payload as Exact /news; settle via Nevermined credits.
 * Exact Dexter → GoPlausible → PayAI /news is unchanged.
 */
import { Router } from "express";
import {
  createNeverminedNewsPaymentMiddleware,
  getNeverminedDisabledReason,
  isNeverminedEnabled,
  NEVERMINED_NEWS_PUBLIC_PATH,
  NEVERMINED_NEWS_ROUTE_PATH,
} from "../libs/neverminedPayments.js";
import {
  getNewsForRequest,
  resolveNewsTicker,
} from "./partner/cryptonews.js";

/**
 * @returns {import('express').Router}
 */
export function createNeverminedNewsRouter() {
  const router = Router();

  /** @type {import('express').RequestHandler | null} */
  let paymentMw = null;

  router.use((req, res, next) => {
    if (isNeverminedEnabled()) return next();
    return res.status(503).json({
      success: false,
      error: getNeverminedDisabledReason(),
      facilitator: "nevermined",
      path: NEVERMINED_NEWS_PUBLIC_PATH,
      exactNews: "/news",
      docs: "docs/NEVERMINED_X402_QUICKSTART.md",
    });
  });

  router.use((req, res, next) => {
    try {
      if (!paymentMw) paymentMw = createNeverminedNewsPaymentMiddleware();
      return paymentMw(req, res, next);
    } catch (err) {
      const msg = err?.message || String(err);
      console.warn("[nevermined-news] payment middleware init failed:", msg);
      return res.status(503).json({
        success: false,
        error: getNeverminedDisabledReason() || msg,
        facilitator: "nevermined",
        path: NEVERMINED_NEWS_PUBLIC_PATH,
      });
    }
  });

  router.get(NEVERMINED_NEWS_ROUTE_PATH, async (req, res) => {
    try {
      const ticker = resolveNewsTicker(req.query.ticker || "general");
      const news = await getNewsForRequest(ticker);
      if (!news) return res.status(404).json({ error: "News not found" });
      if (news.length === 0) {
        return res.status(500).json({ error: "Failed to fetch news" });
      }
      return res.json({
        news,
        facilitator: "nevermined",
        path: NEVERMINED_NEWS_PUBLIC_PATH,
      });
    } catch (err) {
      const msg = err?.message || String(err);
      console.warn("[nevermined-news] error:", msg);
      return res.status(503).json({
        error: "News service is temporarily unavailable. Please try again later.",
        facilitator: "nevermined",
      });
    }
  });

  return router;
}
