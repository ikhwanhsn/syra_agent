import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_USD } from "../../../config/x402Pricing.js";
import { rugcheckRequests } from "../../../request/rugcheck.request.js";

const RUGCHECK_REPORT_BASE = "https://api.rugcheck.xyz/v1/tokens";

/** Default max mints to check (each triggers one token-report call). */
const DEFAULT_LIMIT = 20;

/** Max mints allowed per request. */
const MAX_LIMIT = 50;

/**
 * Collect unique mint addresses from Rugcheck stat list responses.
 * @param {object} data - { "rugcheck/new_tokens": [], "rugcheck/recent": [], ... }
 * @param {string[]} sources - e.g. ["new_tokens", "recent", "trending", "verified"]
 * @param {number} limit - max mints to return
 * @returns {string[]} mint addresses
 */
function collectMintsFromStats(data, sources, limit) {
  const keyMap = {
    new_tokens: "rugcheck/new_tokens",
    recent: "rugcheck/recent",
    trending: "rugcheck/trending",
    verified: "rugcheck/verified",
  };
  const seen = new Set();
  const mints = [];
  for (const src of sources) {
    const key = keyMap[src];
    const list = key ? data[key] : null;
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const mint = item?.mint;
      if (mint && typeof mint === "string" && !seen.has(mint)) {
        seen.add(mint);
        mints.push(mint);
        if (mints.length >= limit) return mints;
      }
    }
  }
  return mints;
}

/**
 * Fetch token report from Rugcheck for a single mint.
 * @param {string} mint
 * @returns {Promise<{ mint: string, data?: object }>}
 */
async function fetchTokenReport(mint) {
  const url = `${RUGCHECK_REPORT_BASE}/${mint}/report`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Rugcheck report HTTP ${response.status}: ${text}`);
  }
  const data = await response.json();
  return { mint, data };
}

/**
 * Run alerts logic: parse query, fetch stats, fetch reports, filter. Returns payload or throws.
 * @param {object} query - req.query (rugScoreMin, source, limit)
 * @returns {Promise<{ alerts: object[], count: number, rugScoreMin: number, source: string[], limit: number, checked: number }>}
 */
async function runAlerts(query) {
  const rugScoreMin = Math.max(
    0,
    Math.min(100, Number(query.rugScoreMin) || 80)
  );
  const sourceParam = (query.source || "new_tokens,recent,trending,verified")
    .toString()
    .toLowerCase();
  const sources = sourceParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => ["new_tokens", "recent", "trending", "verified"].includes(s));
  if (sources.length === 0) {
    const err = new Error("source must be one or more of: new_tokens, recent, trending, verified");
    err.statusCode = 400;
    throw err;
  }
  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, Math.floor(Number(query.limit) || DEFAULT_LIMIT))
  );

  const responses = await Promise.all(
    rugcheckRequests.map(({ url }) => fetch(url))
  );
  for (const response of responses) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Rugcheck stats HTTP ${response.status} ${response.statusText} ${text}`);
    }
  }
  const allData = await Promise.all(responses.map((r) => r.json()));
  const data = {
    "rugcheck/new_tokens": allData[0],
    "rugcheck/recent": allData[1],
    "rugcheck/trending": allData[2],
    "rugcheck/verified": allData[3],
  };

  const mints = collectMintsFromStats(data, sources, limit);

  if (mints.length === 0) {
    return { alerts: [], count: 0, rugScoreMin, source: sources, limit, checked: 0 };
  }

  const reportPromises = mints.map((mint) =>
    fetchTokenReport(mint).catch((err) => ({ mint, error: err.message, data: null }))
  );
  const reportResults = await Promise.all(reportPromises);

  const alerts = [];
  const scoresSeen = [];
  for (const { mint, data: reportData, error } of reportResults) {
    if (error || !reportData) continue;
    const scoreNormalised =
      reportData.score_normalised != null
        ? Number(reportData.score_normalised)
        : 0;
    scoresSeen.push(scoreNormalised);
    if (scoreNormalised >= rugScoreMin) {
      alerts.push({
        mint,
        score: reportData.score,
        score_normalised: scoreNormalised,
        risks: reportData.risks || [],
        rugged: reportData.rugged,
        tokenMeta: reportData.tokenMeta || null,
      });
    }
  }

  const payload = {
    alerts,
    count: alerts.length,
    rugScoreMin,
    source: sources,
    limit,
    checked: mints.length,
  };
  if (scoresSeen.length > 0) {
    payload.max_score_normalised_checked = Math.max(...scoresSeen);
    payload.min_score_normalised_checked = Math.min(...scoresSeen);
  }
  return payload;
}

export async function createTokenRiskAlertsRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      try {
        const payload = await runAlerts(req.query);
        res.status(200).json(payload);
      } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({
          error: status === 400 ? "Bad request" : "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  // GET /v2/token-risk/alerts?rugScoreMin=80&source=new,trending&limit=20
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD * 2, // higher than single report (multiple reports per request)
      description:
        "Token risk alerts: tokens from Rugcheck stats with risk score at or above threshold (score_normalised).",
      method: "GET",
      discoverable: true,
      resource: "/token-risk/alerts",
      inputSchema: {
        queryParams: {
          rugScoreMin: {
            type: "number",
            required: false,
            description: "Minimum normalised risk score (0-100). Default 80.",
          },
          source: {
            type: "string",
            required: false,
            description:
              "Comma-separated: new_tokens, recent, trending, verified. Default all.",
          },
          limit: {
            type: "number",
            required: false,
            description: `Max tokens to check (1-${MAX_LIMIT}). Default ${DEFAULT_LIMIT}.`,
          },
        },
      },
    }),
    async (req, res) => {
      try {
        const payload = await runAlerts(req.query);
        await settlePaymentAndSetResponse(res, req);
        res.status(200).json(payload);
      } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({
          error: status === 400 ? "Bad request" : "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  return router;
}
