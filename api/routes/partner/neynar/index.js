/**
 * Neynar Farcaster API proxy – user lookup, feed, cast, search.
 * Requires NEYNAR_API_KEY in .env. x402 per request.
 * @see https://docs.neynar.com | https://github.com/BankrBot/skills/tree/main/neynar
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_NEYNAR_USD } from "../../../config/x402Pricing.js";
import {
  getUsersByFids,
  getUserByUsername,
  getFeed,
  getCast,
  searchCasts,
  neynarConfig,
} from "../../../libs/neynarClient.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader, runBuybackForRequest } =
  await getV2Payment();

const paymentOpts = {
  price: X402_API_PRICE_NEYNAR_USD,
  description: "Neynar Farcaster API – user, feed, cast, search",
  discoverable: true,
  resource: "/neynar",
  method: "GET",
};

function neynarUnavailable(res) {
  return res.status(503).json({
    success: false,
    error: "Neynar not configured. Set NEYNAR_API_KEY in API .env. Get a key at https://dev.neynar.com",
    config: neynarConfig,
  });
}

function settleAndRespond(req, res, payload) {
  const settle = settlePaymentWithFallback(req.x402Payment?.payload, req.x402Payment?.accepted);
  res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
  runBuybackForRequest(req);
  res.json(payload);
}

export async function createNeynarRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", (_req, res) => res.json({ config: neynarConfig, message: "Neynar routes: user, feed, cast, search" }));
    router.get("/user/dev", async (req, res) => {
      if (!neynarConfig.configured) return neynarUnavailable(res);
      const username = req.query.username;
      const fids = req.query.fids;
      if (fids) {
        const out = await getUsersByFids(fids.split(",").map(Number));
        if (out.error) return res.status(502).json({ success: false, error: out.error });
        return res.json(out);
      }
      if (username) {
        const out = await getUserByUsername(username);
        if (out.error) return res.status(502).json({ success: false, error: out.error });
        return res.json(out);
      }
      return res.status(400).json({ success: false, error: "username or fids required" });
    });
    router.get("/feed/dev", async (req, res) => {
      if (!neynarConfig.configured) return neynarUnavailable(res);
      const out = await getFeed({
        feedType: req.query.feed_type || req.query.feedType,
        filterType: req.query.filter_type || req.query.filterType,
        fid: req.query.fid != null ? Number(req.query.fid) : undefined,
        channelId: req.query.channel_id || req.query.channelId,
        limit: req.query.limit != null ? Number(req.query.limit) : 25,
        cursor: req.query.cursor,
      });
      if (out.error) return res.status(502).json({ success: false, error: out.error });
      res.json(out);
    });
    router.get("/cast/dev", async (req, res) => {
      if (!neynarConfig.configured) return neynarUnavailable(res);
      const id = req.query.identifier || req.query.hash;
      if (!id) return res.status(400).json({ success: false, error: "identifier or hash required" });
      const out = await getCast(id);
      if (out.error) return res.status(502).json({ success: false, error: out.error });
      res.json(out);
    });
    router.get("/search/dev", async (req, res) => {
      if (!neynarConfig.configured) return neynarUnavailable(res);
      const q = req.query.q || req.query.query;
      if (!q) return res.status(400).json({ success: false, error: "q required" });
      const out = await searchCasts(q, {
        limit: req.query.limit != null ? Number(req.query.limit) : 20,
        channelId: req.query.channel_id || req.query.channelId,
        cursor: req.query.cursor,
      });
      if (out.error) return res.status(502).json({ success: false, error: out.error });
      res.json(out);
    });
  }

  router.get(
    "/user",
    requirePayment({ ...paymentOpts, resource: "/neynar/user", inputSchema: { queryParams: { username: { type: "string" }, fids: { type: "string" } } } }),
    async (req, res) => {
      if (!neynarConfig.configured) return neynarUnavailable(res);
      const username = req.query.username;
      const fids = req.query.fids;
      if (fids) {
        const out = await getUsersByFids(fids.split(",").map(Number));
        if (out.error) return res.status(502).json({ success: false, error: out.error });
        return settleAndRespond(req, res, out);
      }
      if (username) {
        const out = await getUserByUsername(username);
        if (out.error) return res.status(502).json({ success: false, error: out.error });
        return settleAndRespond(req, res, out);
      }
      return res.status(400).json({ success: false, error: "username or fids required" });
    },
  );

  router.get(
    "/feed",
    requirePayment({ ...paymentOpts, resource: "/neynar/feed" }),
    async (req, res) => {
      if (!neynarConfig.configured) return neynarUnavailable(res);
      const out = await getFeed({
        feedType: req.query.feed_type || req.query.feedType,
        filterType: req.query.filter_type || req.query.filterType,
        fid: req.query.fid != null ? Number(req.query.fid) : undefined,
        channelId: req.query.channel_id || req.query.channelId,
        limit: req.query.limit != null ? Number(req.query.limit) : 25,
        cursor: req.query.cursor,
      });
      if (out.error) return res.status(502).json({ success: false, error: out.error });
      settleAndRespond(req, res, out);
    },
  );

  router.get(
    "/cast",
    requirePayment({ ...paymentOpts, resource: "/neynar/cast" }),
    async (req, res) => {
      if (!neynarConfig.configured) return neynarUnavailable(res);
      const id = req.query.identifier || req.query.hash;
      if (!id) return res.status(400).json({ success: false, error: "identifier or hash required" });
      const out = await getCast(id);
      if (out.error) return res.status(502).json({ success: false, error: out.error });
      settleAndRespond(req, res, out);
    },
  );

  router.get(
    "/search",
    requirePayment({ ...paymentOpts, resource: "/neynar/search" }),
    async (req, res) => {
      if (!neynarConfig.configured) return neynarUnavailable(res);
      const q = req.query.q || req.query.query;
      if (!q) return res.status(400).json({ success: false, error: "q required" });
      const out = await searchCasts(q, {
        limit: req.query.limit != null ? Number(req.query.limit) : 20,
        channelId: req.query.channel_id || req.query.channelId,
        cursor: req.query.cursor,
      });
      if (out.error) return res.status(502).json({ success: false, error: out.error });
      settleAndRespond(req, res, out);
    },
  );

  return router;
}
