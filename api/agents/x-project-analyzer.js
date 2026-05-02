/**
 * X Project Analyzer — x402 paid: profile + tweets → deterministic score + optional LLM summary.
 */

import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_X_ANALYZER_USD } from "../config/x402Pricing.js";
import {
  getUserByUsername,
  getUserTweets,
} from "../libs/xApiClient.js";
import { computeXProjectScore } from "../libs/xProjectScoring.js";
import { callOpenRouter } from "../libs/openrouter.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const DEFAULT_USERNAME = "syra_agent";
const USER_FIELDS =
  "created_at,description,public_metrics,verified,url,verified_type";
const TWEET_FIELDS = "created_at,public_metrics,text";

const USERNAME_RE = /^[A-Za-z0-9_]{1,15}$/;

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

const paymentBase = {
  price: X402_API_PRICE_X_ANALYZER_USD,
  discoverable: true,
};

const analyzerOutputSchema = {
  success: { type: "boolean", description: "Whether analysis succeeded" },
  data: {
    type: "object",
    description:
      "username, user, score, grade, breakdown, signals, redFlags, aiSummary, updatedAt",
  },
};

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

/** @param {import('express').Request} req */
function param(req, name, defaultVal = null) {
  const q =
    req.query && typeof req.query[name] !== "undefined"
      ? req.query[name]
      : undefined;
  const b =
    req.body && typeof req.body[name] !== "undefined"
      ? req.body[name]
      : undefined;
  const v = q !== undefined ? q : b;
  if (v === undefined || v === null) return defaultVal;
  return typeof v === "string" ? v.trim() : String(v);
}

function parseBool(v, defaultVal) {
  if (v === undefined || v === null || v === "") return defaultVal;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return defaultVal;
}

function normalizeUsername(raw) {
  const s = String(raw ?? DEFAULT_USERNAME).trim().replace(/^@/, "");
  return s || DEFAULT_USERNAME;
}

/**
 * Pick up to 5 tweets for LLM context: sort by engagement proxy, dedupe.
 * @param {unknown[]} tweets
 */
function pickRepresentativeTweets(tweets, limit = 5) {
  if (!Array.isArray(tweets) || tweets.length === 0) return [];
  const scored = tweets.map((t) => {
    const m = t?.public_metrics;
    const engagement =
      (Number(m?.like_count) || 0) +
      (Number(m?.retweet_count) || 0) +
      (Number(m?.reply_count) || 0) +
      (Number(m?.quote_count) || 0);
    return { t, engagement };
  });
  scored.sort((a, b) => b.engagement - a.engagement);
  const out = [];
  const seen = new Set();
  for (const { t } of scored) {
    const id = t?.id;
    const key = id != null ? String(id) : JSON.stringify(t?.text)?.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: t?.id,
      created_at: t?.created_at,
      text:
        typeof t?.text === "string"
          ? t.text.slice(0, 280)
          : undefined,
      public_metrics: t?.public_metrics,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function trimUserForPayload(user) {
  if (!user || typeof user !== "object") return {};
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    description: user.description,
    url: user.url,
    created_at: user.created_at,
    verified: user.verified,
    verified_type: user.verified_type,
    public_metrics: user.public_metrics,
  };
}

/**
 * @param {{ username?: string; maxResults?: number; includeAiSummary?: boolean }} opts
 * @returns {Promise<{ success: true, data: object } | { success: false, error: string, code?: string }>}
 */
export async function runXProjectAnalysis({
  username: usernameRaw,
  maxResults = 20,
  includeAiSummary = false,
}) {
  const username = normalizeUsername(usernameRaw);
  if (!USERNAME_RE.test(username)) {
    return {
      success: false,
      error: "Invalid username (1–15 chars: letters, numbers, underscore)",
      code: "INVALID_USERNAME",
    };
  }

  const max_results = Math.min(50, Math.max(5, Number(maxResults) || 20));

  const userRes = await getUserByUsername(username, USER_FIELDS);
  if (userRes.errors?.length) {
    const msg = userRes.errors[0]?.message || "X API error";
    if (msg.includes("X_BEARER_TOKEN")) {
      return {
        success: false,
        error: "X API not configured",
        code: "X_NOT_CONFIGURED",
      };
    }
    return {
      success: false,
      error: msg,
      code: "X_API_USER_ERROR",
    };
  }
  if (!userRes.data?.id) {
    return {
      success: false,
      error: "User not found",
      code: "USER_NOT_FOUND",
    };
  }

  const user = userRes.data;
  const tweetsRes = await getUserTweets(user.id, {
    max_results,
    tweetFields: TWEET_FIELDS,
  });

  if (tweetsRes.errors?.length) {
    const msg = tweetsRes.errors[0]?.message || "X API tweets error";
    if (msg.includes("X_BEARER_TOKEN")) {
      return {
        success: false,
        error: "X API not configured",
        code: "X_NOT_CONFIGURED",
      };
    }
    return {
      success: false,
      error: msg,
      code: "X_API_TWEETS_ERROR",
    };
  }

  const tweets = Array.isArray(tweetsRes.data) ? tweetsRes.data : [];
  const scored = computeXProjectScore({ user, tweets });

  let aiSummary = null;
  if (includeAiSummary) {
    const grounded = {
      username,
      score: scored.score,
      grade: scored.grade,
      breakdown: scored.breakdown,
      signals: scored.signals,
      redFlags: scored.redFlags,
      sampleTweets: pickRepresentativeTweets(tweets, 5),
    };
    const systemPrompt =
      "You summarize X (Twitter) project profiles using ONLY the JSON provided. Output exactly 3 bullet lines: (1) Strengths (2) Weaknesses (3) Verdict. Do not invent metrics, follower counts, or tweets not in the JSON. If data is sparse, say so.";
    try {
      const llm = await callOpenRouter(
        [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify(grounded),
          },
        ],
        { max_tokens: 500, temperature: 0.4 },
      );
      aiSummary =
        typeof llm?.response === "string" && llm.response.trim()
          ? llm.response.trim()
          : null;
    } catch (err) {
      console.warn(
        "[x-project-analyzer] OpenRouter summary failed:",
        err instanceof Error ? err.message : err,
      );
      aiSummary = null;
    }
  }

  const data = {
    username,
    user: trimUserForPayload(user),
    score: scored.score,
    grade: scored.grade,
    breakdown: scored.breakdown,
    signals: scored.signals,
    redFlags: scored.redFlags,
    aiSummary,
    updatedAt: new Date().toISOString(),
  };

  return { success: true, data };
}

export async function createXProjectAnalyzerRouter() {
  const router = express.Router();

  const analyzerPaymentGet = {
    ...paymentBase,
    description:
      "X Project Analyzer: profile + recent tweets + deterministic score; optional AI summary",
    method: "GET",
    resource: "/x-analyzer",
    inputSchema: {
      queryParams: {
        username: {
          type: "string",
          required: false,
          description: "X username without @ (default syra_agent)",
        },
        max_results: {
          type: "number",
          required: false,
          description: "Tweet sample size 5–50 (default 20)",
        },
        includeAiSummary: {
          type: "boolean",
          required: false,
          description: "If true, append grounded LLM bullet summary (OpenRouter)",
        },
      },
    },
    outputSchema: analyzerOutputSchema,
  };

  const analyzerPaymentPost = {
    ...paymentBase,
    description:
      "X Project Analyzer: profile + recent tweets + deterministic score; optional AI summary",
    method: "POST",
    resource: "/x-analyzer",
    inputSchema: {
      bodyType: "json",
      bodyFields: {
        username: {
          type: "string",
          required: false,
          description: "X username without @ (default syra_agent)",
        },
        max_results: {
          type: "number",
          required: false,
          description: "Tweet sample size 5–50 (default 20)",
        },
        includeAiSummary: {
          type: "boolean",
          required: false,
          description: "Optional grounded LLM bullets",
        },
      },
    },
    outputSchema: analyzerOutputSchema,
  };

  async function handleAnalyze(req, res) {
    try {
      const username = normalizeUsername(
        param(req, "username") ?? DEFAULT_USERNAME,
      );
      const max_results = Math.min(
        50,
        Math.max(5, parseInt(param(req, "max_results"), 10) || 20),
      );
      const includeAiSummary = parseBool(
        param(req, "includeAiSummary"),
        false,
      );

      const cacheKey = `${username}:${max_results}:${includeAiSummary}`;
      const hit = cacheGet(cacheKey);
      if (hit) {
        await settlePaymentAndSetResponse(res, req);
        res.setHeader("Cache-Control", "public, max-age=60");
        return res.json({ success: true, data: hit });
      }

      const out = await runXProjectAnalysis({
        username,
        maxResults: max_results,
        includeAiSummary,
      });

      if (!out.success) {
        const code = out.code;
        let status = 400;
        if (code === "USER_NOT_FOUND") status = 404;
        else if (code === "X_NOT_CONFIGURED") status = 503;
        else if (
          code === "X_API_USER_ERROR" ||
          code === "X_API_TWEETS_ERROR"
        )
          status = 502;
        else if (code === "INVALID_USERNAME") status = 400;
        return res.status(status).json({
          success: false,
          error: out.error || "Analysis failed",
        });
      }

      cacheSet(cacheKey, out.data);
      await settlePaymentAndSetResponse(res, req);
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.json({ success: true, data: out.data });
    } catch (err) {
      console.warn(
        "[x-project-analyzer]",
        err instanceof Error ? err.message : err,
      );
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      });
    }
  }

  router.get("/", requirePayment(analyzerPaymentGet), handleAnalyze);
  router.post("/", requirePayment(analyzerPaymentPost), handleAnalyze);

  return router;
}
