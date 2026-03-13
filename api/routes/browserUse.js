/**
 * v2 x402 API: Browser Use Cloud – run a natural-language browser task, get structured or text output.
 * Uses BROWSER_USE_API_KEY from env.
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { runBrowserTask } from "../libs/browserUseClient.js";
import { X402_API_PRICE_BROWSER_USE_USD } from "../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const paymentOptions = {
  price: X402_API_PRICE_BROWSER_USE_USD,
  description: "Run a natural-language browser task (e.g. open a URL, extract data); returns text or structured output",
  method: "POST",
  discoverable: true,
  resource: "/browser-use",
  inputSchema: {
    bodyType: "json",
    bodyFields: {
      task: {
        type: "string",
        required: true,
        description: "Natural language task for the browser agent (e.g. What is the top post on Hacker News?)",
      },
      start_url: {
        type: "string",
        required: false,
        description: "Optional start URL",
      },
      model: {
        type: "string",
        required: false,
        description: "bu-mini (default) or bu-max",
      },
      maxCostUsd: {
        type: "number",
        required: false,
        description: "Cost cap in USD",
      },
    },
  },
  outputSchema: {
    output: { type: "string", description: "Task result (text or structured)" },
    id: { type: "string", description: "Browser Use session id" },
    status: { type: "string", description: "Session status (idle, stopped, timed_out, error)" },
    liveUrl: { type: "string", description: "Optional live browser view URL" },
    totalCostUsd: { type: "string", description: "Cost in USD" },
  },
};

function getPayload(req) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const q = req.query || {};
  return {
    task: (typeof body.task === "string" ? body.task : q.task)?.trim() ?? "",
    start_url: (typeof body.start_url === "string" ? body.start_url : q.start_url)?.trim() || undefined,
    model: body.model === "bu-max" || q.model === "bu-max" ? "bu-max" : "bu-mini",
    maxCostUsd: typeof body.maxCostUsd === "number" && Number.isFinite(body.maxCostUsd)
      ? body.maxCostUsd
      : (typeof q.maxCostUsd === "string" && Number.isFinite(Number(q.maxCostUsd)) ? Number(q.maxCostUsd) : undefined),
  };
}

export async function createBrowserUseRouter() {
  const router = express.Router();
  const apiKey = process.env.BROWSER_USE_API_KEY;

  const handler = async (req, res) => {
    if (!apiKey || !apiKey.trim()) {
      await settlePaymentAndSetResponse(res, req);
      return res.status(503).json({
        success: false,
        error: "Browser Use is not configured",
        message: "Set BROWSER_USE_API_KEY in .env. Get a key at https://cloud.browser-use.com/settings?tab=api-keys",
      });
    }

    const { task, model, maxCostUsd } = getPayload(req);
    if (!task) {
      await settlePaymentAndSetResponse(res, req);
      return res.status(400).json({
        success: false,
        error: "task is required",
        message: "Provide a natural language task in the request body (e.g. What is the top post on Hacker News?).",
      });
    }

    try {
      const result = await runBrowserTask(apiKey, { task, model, maxCostUsd });
      await settlePaymentAndSetResponse(res, req);
      return res.json({
        success: true,
        output: result.output,
        id: result.id,
        status: result.status,
        ...(result.liveUrl && { liveUrl: result.liveUrl }),
        ...(result.totalCostUsd != null && { totalCostUsd: result.totalCostUsd }),
        ...(result.error && { error: result.error }),
      });
    } catch (err) {
      const message = err?.message ?? String(err);
      await settlePaymentAndSetResponse(res, req);
      if (message.includes("not configured") || message.includes("API key")) {
        return res.status(503).json({ success: false, error: "Browser Use is not configured", message });
      }
      if (message.includes("timed out")) {
        return res.status(504).json({ success: false, error: "Task timed out", message });
      }
      return res.status(500).json({
        success: false,
        error: "Browser Use task failed",
        message,
      });
    }
  };

  router.post("/", requirePayment(paymentOptions), handler);

  // GET for playground/agent that send params as query (e.g. ?task=...&start_url=...)
  const getPaymentOptions = {
    ...paymentOptions,
    method: "GET",
    inputSchema: {
      queryParams: {
        task: { type: "string", required: true, description: "Natural language task" },
        start_url: { type: "string", required: false },
        model: { type: "string", required: false },
        maxCostUsd: { type: "string", required: false },
      },
    },
  };
  router.get("/", requirePayment(getPaymentOptions), handler);

  return router;
}
