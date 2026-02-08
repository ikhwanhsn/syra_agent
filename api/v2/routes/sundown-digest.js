// routes/sundown-digest.js – cache + parallel settle for fast response
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader } = await getV2Payment();

const CACHE_TTL_MS = 90 * 1000;
let sundownCache = null;
let sundownCacheExpires = 0;

function getCached() {
  if (sundownCache !== null && Date.now() < sundownCacheExpires) return sundownCache;
  return null;
}

function setCached(data) {
  sundownCache = data;
  sundownCacheExpires = Date.now() + CACHE_TTL_MS;
}

export async function createSundownDigestRouter() {
  const router = express.Router();

  const fetchSundownDigest = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/sundown-digest?page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  async function getData() {
    const cached = getCached();
    if (cached !== null) return cached;
    const result = await fetchSundownDigest();
    if (Array.isArray(result) && result.length > 0) setCached(result);
    return result;
  }

  function setPaymentResponseAndSend(res, data, settle) {
    const reason = settle?.errorReason || "";
    const isFacilitatorFailure = /Facilitator|500|Internal server error/i.test(reason);
    if (!settle?.success && !isFacilitatorFailure) throw new Error(reason || "Settlement failed");
    const effectiveSettle = settle?.success ? settle : { success: true };
    res.setHeader("Payment-Response", encodePaymentResponseHeader(effectiveSettle));
    res.json({ sundownDigest: data });
  }

  router.get(
    "/",
    requirePayment({
      description: "Daily end-of-day summary of key crypto market events and movements",
      method: "GET",
      discoverable: true,
      resource: "/v2/sundown-digest",
      outputSchema: {
        sundownDigest: {
          type: "array",
          description: "Array of daily digest items with summary, key events, and market highlights",
        },
      },
    }),
    async (req, res) => {
      const { payload, accepted } = req.x402Payment;
      const [sundownDigest, settle] = await Promise.all([
        getData(),
        settlePaymentWithFallback(payload, accepted),
      ]);
      if (!sundownDigest) return res.status(404).json({ error: "Sundown digest not found" });
      if (sundownDigest.length === 0) return res.status(500).json({ error: "Failed to fetch sundown digest" });
      setPaymentResponseAndSend(res, sundownDigest, settle);
    }
  );

  router.post(
    "/",
    requirePayment({
      description: "Daily end-of-day summary of key crypto market events and movements",
      method: "POST",
      discoverable: true,
      resource: "/v2/sundown-digest",
      outputSchema: {
        sundownDigest: {
          type: "array",
          description: "Array of daily digest items with summary, key events, and market highlights",
        },
      },
    }),
    async (req, res) => {
      const { payload, accepted } = req.x402Payment;
      const [sundownDigest, settle] = await Promise.all([
        getData(),
        settlePaymentWithFallback(payload, accepted),
      ]);
      if (!sundownDigest) return res.status(404).json({ error: "Sundown digest not found" });
      if (sundownDigest.length === 0) return res.status(500).json({ error: "Failed to fetch sundown digest" });
      setPaymentResponseAndSend(res, sundownDigest, settle);
    }
  );

  return router;
}
