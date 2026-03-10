/**
 * X (Twitter) API proxy — x402 paid. GET and POST supported for each endpoint.
 * Uses X_BEARER_TOKEN from env. Price: X402_API_PRICE_X_USD.
 * @see https://docs.x.com/x-api/introduction
 *
 * GET/POST /x/user           - User lookup by username (query or body: username)
 * GET/POST /x/search/recent  - Recent tweet search (query or body: query, max_results)
 * GET/POST /x/user/:username/tweets - User tweets (path username; query or body: max_results)
 * GET/POST /x/feed          - Profile + recent tweets (query or body: username, max_results)
 */

import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_X_USD } from "../../../config/x402Pricing.js";
import {
  getUserByUsername,
  searchRecentTweets,
  getUserTweets,
} from "../../../libs/xApiClient.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const CACHE_TTL_MS = 60 * 1000; // 1 minute
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

/** Get param from GET (query) or POST (body). */
function param(req, name, defaultVal = null) {
  const q = req.query && typeof req.query[name] !== "undefined" ? req.query[name] : undefined;
  const b = req.body && typeof req.body[name] !== "undefined" ? req.body[name] : undefined;
  const v = q !== undefined ? q : b;
  if (v === undefined || v === null) return defaultVal;
  return typeof v === "string" ? v.trim() : String(v);
}

const paymentBase = {
  price: X402_API_PRICE_X_USD,
  discoverable: true,
};

export async function createXApiRouter() {
  const router = express.Router();

  // ---------- /user ----------
  const userPaymentGet = {
    ...paymentBase,
    description: "X API: user lookup by username",
    method: "GET",
    resource: "/x/user",
    inputSchema: { queryParams: { username: { type: "string", required: true, description: "X username (without @)" } } },
    outputSchema: { data: { type: "object", description: "User profile" } },
  };
  const userPaymentPost = {
    ...paymentBase,
    description: "X API: user lookup by username",
    method: "POST",
    resource: "/x/user",
    inputSchema: { bodyType: "json", bodyFields: { username: { type: "string", required: true, description: "X username" } } },
    outputSchema: { data: { type: "object", description: "User profile" } },
  };

  router.get("/user", requirePayment(userPaymentGet), async (req, res) => {
    const username = (param(req, "username") || "").replace(/^@/, "") || null;
    if (!username) {
      res.status(400).json({ error: "username is required (query or body)" });
      return;
    }
    const cacheKey = `user:${username}`;
    let result = cacheGet(cacheKey);
    if (result === null) {
      result = await getUserByUsername(username, param(req, "user.fields") || undefined);
      if (result.data && !result.errors) cacheSet(cacheKey, result);
    }
    if (result.errors && result.errors.length) {
      const msg = result.errors[0]?.message || "X API error";
      if (msg.includes("X_BEARER_TOKEN")) {
        res.status(503).json({ error: "X API not configured", detail: msg });
        return;
      }
      res.status(400).json({ error: "X API user lookup failed", errors: result.errors });
      return;
    }
    await settlePaymentAndSetResponse(res, req);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(result);
  });

  router.post("/user", requirePayment(userPaymentPost), async (req, res) => {
    const username = (param(req, "username") || "").replace(/^@/, "") || null;
    if (!username) {
      res.status(400).json({ error: "username is required (query or body)" });
      return;
    }
    const cacheKey = `user:${username}`;
    let result = cacheGet(cacheKey);
    if (result === null) {
      result = await getUserByUsername(username, param(req, "user.fields") || undefined);
      if (result.data && !result.errors) cacheSet(cacheKey, result);
    }
    if (result.errors && result.errors.length) {
      const msg = result.errors[0]?.message || "X API error";
      if (msg.includes("X_BEARER_TOKEN")) {
        res.status(503).json({ error: "X API not configured", detail: msg });
        return;
      }
      res.status(400).json({ error: "X API user lookup failed", errors: result.errors });
      return;
    }
    await settlePaymentAndSetResponse(res, req);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(result);
  });

  // ---------- /search/recent ----------
  const searchPaymentGet = {
    ...paymentBase,
    description: "X API: search recent tweets (last 7 days)",
    method: "GET",
    resource: "/x/search/recent",
    inputSchema: {
      queryParams: {
        query: { type: "string", required: true, description: "Search query" },
        max_results: { type: "number", required: false, description: "10–100" },
      },
    },
    outputSchema: { data: { type: "array", description: "Tweets" } },
  };
  const searchPaymentPost = {
    ...paymentBase,
    description: "X API: search recent tweets (last 7 days)",
    method: "POST",
    resource: "/x/search/recent",
    inputSchema: {
      bodyType: "json",
      bodyFields: {
        query: { type: "string", required: true, description: "Search query" },
        max_results: { type: "number", required: false, description: "10–100" },
      },
    },
    outputSchema: { data: { type: "array", description: "Tweets" } },
  };

  async function handleSearchRecent(req, res) {
    const query = (param(req, "query") || "").trim();
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }
    const max_results = Math.min(100, Math.max(10, parseInt(param(req, "max_results"), 10) || 10));
    const cacheKey = `search:${query}:${max_results}`;
    let result = cacheGet(cacheKey);
    if (result === null) {
      result = await searchRecentTweets(query, { max_results });
      if (result.data && !result.errors) cacheSet(cacheKey, result);
    }
    if (result.errors && result.errors.length) {
      const msg = result.errors[0]?.message || "X API error";
      if (msg.includes("X_BEARER_TOKEN")) {
        res.status(503).json({ error: "X API not configured", detail: msg });
        return;
      }
      res.status(400).json({ error: "X API search failed", errors: result.errors });
      return;
    }
    await settlePaymentAndSetResponse(res, req);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(result);
  }

  router.get("/search/recent", requirePayment(searchPaymentGet), handleSearchRecent);
  router.post("/search/recent", requirePayment(searchPaymentPost), handleSearchRecent);

  // ---------- /user/:username/tweets ----------
  const userTweetsPaymentGet = {
    ...paymentBase,
    description: "X API: recent tweets from a user",
    method: "GET",
    resource: "/x/user/:username/tweets",
    inputSchema: {
      pathParams: { username: { type: "string", required: true } },
      queryParams: { max_results: { type: "number", required: false, description: "5–100" } },
    },
    outputSchema: { data: { type: "array", description: "Tweets" } },
  };
  const userTweetsPaymentPost = {
    ...paymentBase,
    description: "X API: recent tweets from a user",
    method: "POST",
    resource: "/x/user/:username/tweets",
    inputSchema: {
      pathParams: { username: { type: "string", required: true } },
      bodyType: "json",
      bodyFields: { max_results: { type: "number", required: false } },
    },
    outputSchema: { data: { type: "array", description: "Tweets" } },
  };

  async function handleUserTweets(req, res) {
    const username = (req.params.username || "").trim().replace(/^@/, "") || null;
    if (!username) {
      res.status(400).json({ error: "username path parameter is required" });
      return;
    }
    const max_results = Math.min(100, Math.max(5, parseInt(param(req, "max_results"), 10) || 10));
    const cacheKey = `tweets:${username}:${max_results}`;
    let result = cacheGet(cacheKey);
    if (result === null) {
      const userRes = await getUserByUsername(username);
      if (userRes.errors?.length || !userRes.data?.id) {
        res.status(404).json({
          error: "User not found or X API error",
          errors: userRes.errors || [{ message: "User not found" }],
        });
        return;
      }
      result = await getUserTweets(userRes.data.id, { max_results });
      if (result.data && !result.errors) cacheSet(cacheKey, result);
    }
    if (result.errors && result.errors.length) {
      const msg = result.errors[0]?.message || "X API error";
      if (msg.includes("X_BEARER_TOKEN")) {
        res.status(503).json({ error: "X API not configured", detail: msg });
        return;
      }
      res.status(400).json({ error: "X API tweets failed", errors: result.errors });
      return;
    }
    await settlePaymentAndSetResponse(res, req);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(result);
  }

  router.get("/user/:username/tweets", requirePayment(userTweetsPaymentGet), handleUserTweets);
  router.post("/user/:username/tweets", requirePayment(userTweetsPaymentPost), handleUserTweets);

  // ---------- /feed ----------
  const feedPaymentGet = {
    ...paymentBase,
    description: "X API: profile + recent tweets (one response)",
    method: "GET",
    resource: "/x/feed",
    inputSchema: {
      queryParams: {
        username: { type: "string", required: false, description: "X username (default syra_agent)" },
        max_results: { type: "number", required: false, description: "3–20" },
      },
    },
    outputSchema: { user: { type: "object" }, tweets: { type: "array" }, updatedAt: { type: "string" } },
  };
  const feedPaymentPost = {
    ...paymentBase,
    description: "X API: profile + recent tweets (one response)",
    method: "POST",
    resource: "/x/feed",
    inputSchema: {
      bodyType: "json",
      bodyFields: {
        username: { type: "string", required: false },
        max_results: { type: "number", required: false },
      },
    },
    outputSchema: { user: { type: "object" }, tweets: { type: "array" }, updatedAt: { type: "string" } },
  };

  async function handleFeed(req, res) {
    const username = (param(req, "username") || "syra_agent").trim().replace(/^@/, "");
    const max_results = Math.min(20, Math.max(3, parseInt(param(req, "max_results"), 10) || 5));
    const cacheKey = `feed:${username}:${max_results}`;
    let cached = cacheGet(cacheKey);
    if (cached) {
      await settlePaymentAndSetResponse(res, req);
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.json(cached);
    }
    const userRes = await getUserByUsername(username);
    if (userRes.errors?.length || !userRes.data?.id) {
      res.status(404).json({
        error: "User not found or X API error",
        errors: userRes.errors || [{ message: "User not found" }],
      });
      return;
    }
    const tweetsRes = await getUserTweets(userRes.data.id, { max_results });
    if (tweetsRes.errors?.length) {
      res.status(400).json({ error: "X API tweets failed", errors: tweetsRes.errors });
      return;
    }
    const payload = {
      user: userRes.data,
      tweets: tweetsRes.data || [],
      updatedAt: new Date().toISOString(),
    };
    cacheSet(cacheKey, payload);
    await settlePaymentAndSetResponse(res, req);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(payload);
  }

  router.get("/feed", requirePayment(feedPaymentGet), handleFeed);
  router.post("/feed", requirePayment(feedPaymentPost), handleFeed);

  return router;
}
