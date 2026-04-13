/**
 * Bankr API proxy – agent prompts, job status, balances.
 * Requires BANKR_API_KEY (bk_...) in .env. x402 per request.
 * @see https://github.com/BankrBot/skills/tree/main/bankr
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_BANKR_USD } from "../../../config/x402Pricing.js";
import { getBalances, submitPrompt, getJob, cancelJob, bankrConfig } from "../../../libs/bankrClient.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader, runBuybackForRequest } =
  await getV2Payment();

const paymentOptions = {
  price: X402_API_PRICE_BANKR_USD,
  description: "Bankr: agent prompts, job status, wallet balances",
  discoverable: true,
  resource: "/bankr",
  method: "GET",
};

function bankrUnavailable(res) {
  return res.status(503).json({
    success: false,
    error: "Bankr not configured. Set BANKR_API_KEY (bk_...) in API .env. Get a key at https://bankr.bot/api",
    config: bankrConfig,
  });
}

function settleAndRespond(req, res, payload) {
  const settle = settlePaymentWithFallback(req.x402Payment?.payload, req.x402Payment?.accepted, req);
  res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
  runBuybackForRequest(req);
  res.json(payload);
}

export async function createBankrRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", (_req, res) => {
      res.json({
        config: bankrConfig,
        message: "Bankr routes: GET /bankr/balances, POST /bankr/prompt, GET /bankr/job/:jobId, POST /bankr/job/:jobId/cancel",
      });
    });
    router.get("/balances/dev", async (req, res) => {
      if (!bankrConfig.configured) return bankrUnavailable(res);
      try {
        const result = await getBalances({ chains: req.query.chains });
        if (result.error) return res.status(502).json({ success: false, error: result.error });
        res.json(result.balances);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Balances failed" });
      }
    });
    router.post("/prompt/dev", async (req, res) => {
      if (!bankrConfig.configured) return bankrUnavailable(res);
      try {
        const result = await submitPrompt(req.body || {});
        if (result.error) return res.status(400).json({ success: false, error: result.error });
        res.status(202).json(result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Prompt failed" });
      }
    });
    router.get("/job/:jobId/dev", async (req, res) => {
      if (!bankrConfig.configured) return bankrUnavailable(res);
      try {
        const result = await getJob(req.params.jobId);
        if (result.error) return res.status(404).json({ success: false, error: result.error });
        res.json(result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Job fetch failed" });
      }
    });
    router.post("/job/:jobId/cancel/dev", async (req, res) => {
      if (!bankrConfig.configured) return bankrUnavailable(res);
      try {
        const result = await cancelJob(req.params.jobId);
        if (result.error) return res.status(400).json({ success: false, error: result.error });
        res.json(result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Cancel failed" });
      }
    });
  }

  // GET /bankr/balances?chains=base,solana
  router.get(
    "/balances",
    requirePayment({
      ...paymentOptions,
      resource: "/bankr/balances",
      inputSchema: {
        queryParams: {
          chains: { type: "string", required: false, description: "Comma-separated: base, polygon, mainnet, unichain, solana" },
        },
      },
    }),
    async (req, res) => {
      if (!bankrConfig.configured) return bankrUnavailable(res);
      try {
        const result = await getBalances({ chains: req.query.chains });
        if (result.error) return res.status(502).json({ success: false, error: result.error });
        settleAndRespond(req, res, result.balances);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Balances failed" });
      }
    },
  );

  // POST /bankr/prompt { prompt, threadId? }
  router.post(
    "/prompt",
    requirePayment({
      ...paymentOptions,
      method: "POST",
      resource: "/bankr/prompt",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          prompt: { type: "string", required: true, description: "Natural language prompt (max 10,000 chars)" },
          threadId: { type: "string", required: false, description: "Continue conversation thread" },
        },
      },
    }),
    async (req, res) => {
      if (!bankrConfig.configured) return bankrUnavailable(res);
      try {
        const result = await submitPrompt(req.body || {});
        if (result.error) return res.status(400).json({ success: false, error: result.error });
        const settle = settlePaymentWithFallback(req.x402Payment?.payload, req.x402Payment?.accepted, req);
        res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
        runBuybackForRequest(req);
        res.status(202).json(result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Prompt failed" });
      }
    },
  );

  // GET /bankr/job/:jobId
  router.get(
    "/job/:jobId",
    requirePayment({
      ...paymentOptions,
      resource: "/bankr/job",
      inputSchema: {
        pathParams: { jobId: { type: "string", required: true, description: "Bankr job ID from POST /bankr/prompt" } },
      },
    }),
    async (req, res) => {
      if (!bankrConfig.configured) return bankrUnavailable(res);
      try {
        const result = await getJob(req.params.jobId);
        if (result.error) return res.status(404).json({ success: false, error: result.error });
        settleAndRespond(req, res, result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Job fetch failed" });
      }
    },
  );

  // POST /bankr/job/:jobId/cancel
  router.post(
    "/job/:jobId/cancel",
    requirePayment({
      ...paymentOptions,
      method: "POST",
      resource: "/bankr/job/cancel",
    }),
    async (req, res) => {
      if (!bankrConfig.configured) return bankrUnavailable(res);
      try {
        const result = await cancelJob(req.params.jobId);
        if (result.error) return res.status(400).json({ success: false, error: result.error });
        settleAndRespond(req, res, result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Cancel failed" });
      }
    },
  );

  return router;
}
