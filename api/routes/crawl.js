/**
 * v2 x402 API: Cloudflare Browser Rendering /crawl – crawl a website from a starting URL.
 * Returns content as Markdown (or HTML) for summarization or RAG.
 * Uses CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN from env.
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import {
  getCloudflareCrawlConfig,
  startCrawl,
  pollCrawlUntilComplete,
} from "../libs/cloudflareCrawl.js";
import { X402_API_PRICE_CRAWL_USD } from "../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

/** Max characters of combined crawl content to return (avoid blowing context). */
const MAX_CRAWL_CONTENT_CHARS = 80_000;
/** Max records to include in response (pages). */
const MAX_RECORDS_RESPONSE = 50;

function parseUrl(s) {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  try {
    new URL(t);
    return t;
  } catch {
    return null;
  }
}

function requireCrawlUrl(req, res, next) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const url = parseUrl(body.url ?? req.query?.url);
  if (!url) {
    return res.status(400).json({ error: "url is required", message: "Provide a starting URL to crawl." });
  }
  next();
}

export async function createCrawlRouter() {
  const router = express.Router();

  const paymentOptions = {
    price: X402_API_PRICE_CRAWL_USD,
    description: "Crawl a website from a URL; returns Markdown content for summarization or RAG",
    method: "POST",
    discoverable: true,
    resource: "/crawl",
    inputSchema: {
      bodyType: "json",
      bodyFields: {
        url: {
          type: "string",
          required: true,
          description: "Starting URL to crawl (e.g. https://example.com/docs)",
        },
        limit: {
          type: "number",
          required: false,
          description: "Max pages to crawl (default 20, max 500)",
        },
        depth: {
          type: "number",
          required: false,
          description: "Max link depth (default 2)",
        },
        render: {
          type: "boolean",
          required: false,
          description: "Use headless browser (default true); false for static HTML only",
        },
      },
    },
    outputSchema: {
      jobId: { type: "string", description: "Cloudflare crawl job id" },
      status: { type: "string", description: "Job status" },
      total: { type: "number", description: "Total pages discovered" },
      finished: { type: "number", description: "Pages finished" },
      records: { type: "array", description: "Crawled pages with url, markdown, metadata" },
    },
  };

  const getPayload = (req) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    return {
      url: parseUrl(body.url ?? req.query?.url),
      limit: body.limit ?? req.query?.limit,
      depth: body.depth ?? req.query?.depth,
      render: body.render !== false && req.query?.render !== "false",
    };
  };

  const handler = async (req, res) => {
    const { url, limit, depth, render } = getPayload(req);
    if (!url) {
      res.status(400).json({ error: "url is required", message: "Provide a starting URL to crawl." });
      return;
    }

    const config = getCloudflareCrawlConfig();
    if (!config) {
      res.status(503).json({
        error: "Crawl is not configured",
        message: "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.",
      });
      return;
    }

    try {
      const jobId = await startCrawl(config.accountId, config.apiToken, {
        url,
        limit,
        depth,
        formats: ["markdown"],
        render,
      });
      const result = await pollCrawlUntilComplete(config.accountId, config.apiToken, jobId, {
        maxAttempts: 24,
        delayMs: 5000,
      });

      if (result.status !== "completed") {
        await settlePaymentAndSetResponse(res, req);
        return res.json({
          jobId,
          status: result.status,
          total: result.total,
          finished: result.finished,
          records: [],
          message: `Crawl ended with status: ${result.status}`,
        });
      }

      const records = Array.isArray(result.records) ? result.records : [];
      const limited = records.slice(0, MAX_RECORDS_RESPONSE);
      let totalChars = 0;
      const truncated = limited.map((r) => {
        const markdown = r.markdown ?? r.html ?? "";
        const title = r.metadata?.title ?? r.url ?? "";
        const allowed = Math.max(0, Math.floor((MAX_CRAWL_CONTENT_CHARS - totalChars) / limited.length) - title.length - 50);
        totalChars += title.length + 50;
        let content = markdown;
        if (allowed > 0 && content.length > allowed) {
          content = content.slice(0, allowed) + "\n\n[... truncated]";
        }
        totalChars += content.length;
        return {
          url: r.url,
          status: r.status,
          title,
          markdown: content,
        };
      });

      await settlePaymentAndSetResponse(res, req);
      res.json({
        jobId,
        status: result.status,
        total: result.total,
        finished: result.finished,
        records: truncated,
        truncated: records.length > MAX_RECORDS_RESPONSE,
      });
    } catch (err) {
      const message = err?.message ?? String(err);
      if (message.includes("not configured") || message.includes("CLOUDFLARE")) {
        res.status(503).json({ error: "Crawl is not configured", message });
        return;
      }
      const is401 = message.startsWith("401:") || message.includes("401");
      res.status(500).json({
        error: "Crawl failed",
        message,
        ...(is401 && {
          hint: "Check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env. Use an API Token (not Global Key) with 'Browser Rendering - Edit' permission: https://dash.cloudflare.com/profile/api-tokens",
        }),
      });
    }
  };

  router.post("/", requireCrawlUrl, requirePayment(paymentOptions), handler);

  // GET for agent/playground that send params as query (e.g. ?url=...&limit=20)
  const getPaymentOptions = {
    ...paymentOptions,
    method: "GET",
    inputSchema: {
      queryParams: {
        url: {
          type: "string",
          required: true,
          description: "Starting URL to crawl",
        },
        limit: { type: "string", required: false },
        depth: { type: "string", required: false },
        render: { type: "string", required: false },
      },
    },
  };
  router.get("/", requireCrawlUrl, requirePayment(getPaymentOptions), handler);

  return router;
}
