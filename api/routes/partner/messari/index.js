/**
 * Messari x402 API routes.
 * Proxies to https://api.messari.io — AI chat, metrics, signal/mindshare, news, token unlocks,
 * fundraising, stablecoins, networks, X-users.
 * All routes support GET and POST (POST reads params from body).
 *
 * Docs: https://docs.messari.io/api-reference/x402-payments
 */
import express from "express";
import {
  X402_API_PRICE_MESSARI_USD,
  X402_API_PRICE_MESSARI_AI_USD,
  X402_API_PRICE_MESSARI_SIGNAL_USD,
  X402_API_PRICE_MESSARI_PREMIUM_USD,
  X402_API_PRICE_MESSARI_TIMESERIES_USD,
  X402_API_PRICE_MESSARI_VESTING_USD,
  X402_API_PRICE_MESSARI_INVESTOR_USD,
} from "../../../config/x402Pricing.js";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import {
  ensureMessariPayer,
  messariX402Fetch,
  buildMessariUrl,
  MESSARI_ENDPOINTS,
} from "../../../libs/messariX402.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

/** Merge query + body params (POST body takes precedence). */
function mergeParams(req) {
  const q = req.query || {};
  const b = req.body && typeof req.body === "object" ? req.body : {};
  return { ...q, ...b };
}

function upstreamError(status, text) {
  if (status === 402) return "Upstream payment required (x402).";
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return status >= 500 ? "Messari temporarily unavailable." : "Request failed.";
  if (t.length > 800 || /<\s*!?\s*DOCTYPE/i.test(t))
    return status >= 500 ? "Messari temporarily unavailable." : "Upstream request failed.";
  try {
    const j = JSON.parse(t);
    if (j?.error) return typeof j.error === "string" ? j.error : t;
    if (j?.message) return typeof j.message === "string" ? j.message : t;
  } catch {
    // not JSON
  }
  return t;
}

async function ensurePayer(res) {
  try {
    await ensureMessariPayer();
    return true;
  } catch (e) {
    res.status(503).json({
      error: "Messari x402 payer unavailable",
      message: e instanceof Error ? e.message : String(e),
    });
    return false;
  }
}

async function settle(req, res) {
  if (req.x402Payment) {
    try {
      await settlePaymentAndSetResponse(res, req);
    } catch {
      // settle failed; continue
    }
  }
}

/** Generic proxy: build URL, call Messari, return JSON. defaultParams applied when a param is missing. */
async function proxyGet(req, res, messariPath, allowedParams = [], defaultParams = {}) {
  if (!(await ensurePayer(res))) return;
  const params = mergeParams(req);
  const qp = { ...defaultParams };
  for (const k of allowedParams) {
    const v = params[k];
    if (v !== undefined && v !== "" && v !== null) {
      qp[k] = v;
    }
  }
  const url = buildMessariUrl(messariPath, qp);
  let response;
  try {
    response = await messariX402Fetch(url);
  } catch (e) {
    return res.status(502).json({
      error: "Messari x402 request failed",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return res.status(response.status).json({
      error: "Messari request failed",
      message: upstreamError(response.status, text),
    });
  }
  const data = await response.json().catch(() => ({}));
  res.setHeader("X-Data-Source", "messari-x402");
  await settle(req, res);
  res.status(200).json(data);
}

function wrapHandler(fn) {
  return (req, res) =>
    fn(req, res).catch((e) =>
      res.status(500).json({
        error: "Internal server error",
        message: e instanceof Error ? e.message : String(e),
      })
    );
}

function registerRoute(router, path, paymentOpts, handler) {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    router.get(`${path}/dev`, wrapHandler(handler));
    router.post(`${path}/dev`, wrapHandler(handler));
  }
  router.get(path, requirePayment({ ...paymentOpts, method: "GET" }), wrapHandler(handler));
  router.post(
    path,
    requirePayment({ ...paymentOpts, method: "POST", bodyType: "json" }),
    wrapHandler(handler)
  );
}

// ---------------------------------------------------------------------------
// AI Chat Completions
// ---------------------------------------------------------------------------
const DEFAULT_AI_QUESTION = "What is the latest on Bitcoin?";
async function handleAiChat(req, res) {
  if (!(await ensurePayer(res))) return;
  const params = mergeParams(req);
  const question = (params.question ?? params.q ?? DEFAULT_AI_QUESTION).trim() || DEFAULT_AI_QUESTION;
  const messages = params.messages || (question ? [{ role: "user", content: question }] : [{ role: "user", content: DEFAULT_AI_QUESTION }]);
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "Missing question or messages",
      message:
        'Provide "question" (string) or "messages" (array of {role, content}) in query or body.',
    });
  }
  const body = {
    messages,
    stream: false,
    verbosity: params.verbosity || "succinct",
    response_format: params.response_format || "markdown",
  };
  const url = buildMessariUrl(MESSARI_ENDPOINTS.aiChat);
  let response;
  try {
    response = await messariX402Fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (e) {
    return res.status(502).json({
      error: "Messari AI x402 request failed",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return res.status(response.status).json({
      error: "Messari AI request failed",
      message: upstreamError(response.status, text),
    });
  }
  const data = await response.json().catch(() => ({}));
  res.setHeader("X-Data-Source", "messari-ai-x402");
  await settle(req, res);
  res.status(200).json(data);
}

// ---------------------------------------------------------------------------
// Asset Timeseries (dynamic path params)
// ---------------------------------------------------------------------------
const DEFAULT_TIMESERIES_ASSET = "bitcoin";
const DEFAULT_TIMESERIES_DATASET = "price";
async function handleTimeseries(req, res) {
  const params = mergeParams(req);
  const assetId = (params.assetId || params.asset_id || params.slug || DEFAULT_TIMESERIES_ASSET).trim() || DEFAULT_TIMESERIES_ASSET;
  const datasetSlug = (params.datasetSlug || params.dataset_slug || params.dataset || DEFAULT_TIMESERIES_DATASET).trim() || DEFAULT_TIMESERIES_DATASET;
  const granularity = params.granularity || "1d";
  const messariPath = MESSARI_ENDPOINTS.assetTimeseries(assetId, datasetSlug, granularity);
  return proxyGet(req, res, messariPath, ["start", "end", "limit", "page", "interval"]);
}

// ---------------------------------------------------------------------------
// Token Unlocks (dynamic assetId)
// ---------------------------------------------------------------------------
const DEFAULT_TOKEN_UNLOCKS_ASSET = "arbitrum";
async function handleTokenUnlocks(req, res) {
  const params = mergeParams(req);
  const assetId = (params.assetId || params.asset_id || "").trim() || DEFAULT_TOKEN_UNLOCKS_ASSET;
  const messariPath = MESSARI_ENDPOINTS.tokenUnlocksEvents(assetId);
  return proxyGet(req, res, messariPath, ["start", "end", "limit", "page"]);
}

async function handleTokenUnlocksVesting(req, res) {
  const params = mergeParams(req);
  const assetId = (params.assetId || params.asset_id || "").trim() || DEFAULT_TOKEN_UNLOCKS_ASSET;
  const messariPath = MESSARI_ENDPOINTS.tokenUnlocksVesting(assetId);
  return proxyGet(req, res, messariPath, ["start", "end", "limit", "page"]);
}

// ---------------------------------------------------------------------------
// Signal Timeseries (dynamic granularity)
// ---------------------------------------------------------------------------
async function handleSignalTimeseries(req, res) {
  const params = mergeParams(req);
  const granularity = params.granularity || "1d";
  const messariPath = MESSARI_ENDPOINTS.signalAssetTimeseries(granularity);
  return proxyGet(req, res, messariPath, [
    "assetIds",
    "sort",
    "sortDirection",
    "limit",
    "page",
    "start",
    "end",
  ]);
}

// ---------------------------------------------------------------------------
// X-User Timeseries (dynamic granularity)
// ---------------------------------------------------------------------------
async function handleXUserTimeseries(req, res) {
  const params = mergeParams(req);
  const granularity = params.granularity || "1d";
  const messariPath = MESSARI_ENDPOINTS.xUserTimeseries(granularity);
  return proxyGet(req, res, messariPath, [
    "sort",
    "sortDirection",
    "accountType",
    "limit",
    "page",
    "start",
    "end",
  ]);
}

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------
export async function createMessariRouter() {
  const router = express.Router();

  // --- AI Chat Completions (POST primary, GET also supported) ---
  registerRoute(router, "/ai", {
    price: X402_API_PRICE_MESSARI_AI_USD,
    description: "Messari AI — crypto research chat completions powered by 30TB+ knowledge graph",
    discoverable: true,
    resource: "/messari/ai",
    inputSchema: {
      queryParams: {
        question: { type: "string", description: "Natural language question about crypto" },
      },
      body: {
        messages: {
          type: "array",
          description: 'Array of {role, content} messages (OpenAI format)',
        },
        verbosity: { type: "string", description: "succinct (default), normal, verbose" },
        response_format: { type: "string", description: "markdown (default), text, json" },
      },
    },
  }, handleAiChat);

  // --- Asset Details ---
  registerRoute(router, "/assets/details", {
    price: X402_API_PRICE_MESSARI_USD,
    description: "Messari asset details — rich point-in-time data for up to 20 assets",
    discoverable: true,
    resource: "/messari/assets/details",
    inputSchema: {
      queryParams: {
        slugs: { type: "string", description: "Comma-separated asset slugs (e.g. bitcoin,ethereum)" },
        assetIds: { type: "string", description: "Comma-separated Messari asset IDs" },
      },
    },
  }, (req, res) => {
    const params = mergeParams(req);
    const slugs = params.slugs || params.assetIds || params.ids || "bitcoin,ethereum";
    return proxyGet(req, res, MESSARI_ENDPOINTS.assetDetails, ["slugs", "assetIds", "ids"], { slugs });
  });

  // --- List Assets (free upstream, small Syra fee) ---
  registerRoute(router, "/assets", {
    price: X402_API_PRICE_MESSARI_USD,
    description: "Messari list assets — 34,000+ assets with market and fundamental metrics",
    discoverable: true,
    resource: "/messari/assets",
    inputSchema: {
      queryParams: {
        assetSlugs: { type: "string", description: "Comma-separated slugs to filter" },
        metrics: { type: "string", description: "Comma-separated metrics to include" },
        limit: { type: "string", description: "Max results (default 20)" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.assets, [
      "assetSlugs",
      "assetIds",
      "metrics",
      "limit",
      "page",
      "sort",
      "order",
    ], { limit: "20" })
  );

  // --- Asset Metrics Catalog (free upstream) ---
  registerRoute(router, "/assets/metrics", {
    price: X402_API_PRICE_MESSARI_USD,
    description: "Messari asset metrics catalog — available timeseries datasets and granularities",
    discoverable: true,
    resource: "/messari/assets/metrics",
    inputSchema: { queryParams: {} },
  }, (req, res) => proxyGet(req, res, MESSARI_ENDPOINTS.assetMetrics, []));

  // --- All-Time Highs ---
  registerRoute(router, "/ath", {
    price: X402_API_PRICE_MESSARI_USD,
    description: "Messari all-time highs — ATH snapshots with drawdown context",
    discoverable: true,
    resource: "/messari/ath",
    inputSchema: {
      queryParams: {
        slugs: { type: "string", description: "Comma-separated asset slugs" },
        assetIds: { type: "string", description: "Comma-separated asset IDs" },
      },
    },
  }, (req, res) => {
    const params = mergeParams(req);
    const slugs = params.slugs || params.assetIds || params.ids || "bitcoin,ethereum,solana";
    return proxyGet(req, res, MESSARI_ENDPOINTS.assetAth, [
      "slugs",
      "assetIds",
      "ids",
      "limit",
      "page",
      "sectors",
      "categories",
      "tags",
    ], { slugs });
  });

  // --- ROI ---
  registerRoute(router, "/roi", {
    price: X402_API_PRICE_MESSARI_USD,
    description: "Messari ROI — multi-window return on investment snapshots",
    discoverable: true,
    resource: "/messari/roi",
    inputSchema: {
      queryParams: {
        slugs: { type: "string", description: "Comma-separated asset slugs" },
        assetIds: { type: "string", description: "Comma-separated asset IDs" },
      },
    },
  }, (req, res) => {
    const params = mergeParams(req);
    const slugs = params.slugs || params.assetIds || params.ids || "bitcoin,ethereum";
    return proxyGet(req, res, MESSARI_ENDPOINTS.assetRoi, [
      "slugs",
      "assetIds",
      "ids",
      "limit",
      "page",
      "sectors",
      "categories",
      "tags",
    ], { slugs });
  });

  // --- Asset Timeseries ---
  registerRoute(router, "/timeseries", {
    price: X402_API_PRICE_MESSARI_TIMESERIES_USD,
    description: "Messari asset timeseries — historical metric data (price, volume, on-chain, etc.)",
    discoverable: true,
    resource: "/messari/timeseries",
    inputSchema: {
      queryParams: {
        assetId: { type: "string", description: "Asset ID or slug (required)" },
        datasetSlug: { type: "string", description: "Dataset slug (required, e.g. price)" },
        granularity: { type: "string", description: "5m, 15m, 1h, 1d (default 1d)" },
        start: { type: "string", description: "Start date (ISO 8601)" },
        end: { type: "string", description: "End date (ISO 8601)" },
        limit: { type: "string", description: "Max data points" },
      },
    },
  }, handleTimeseries);

  // --- Signal: Assets ---
  registerRoute(router, "/signal", {
    price: X402_API_PRICE_MESSARI_PREMIUM_USD,
    description: "Messari signal — ranked asset feed by mindshare, sentiment, momentum",
    discoverable: true,
    resource: "/messari/signal",
    inputSchema: {
      queryParams: {
        assetIds: { type: "string", description: "Filter by asset IDs" },
        sort: { type: "string", description: "Sort field" },
        sortDirection: { type: "string", description: "asc or desc" },
        limit: { type: "string", description: "Max results" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.signalAssets, [
      "assetIds",
      "sort",
      "sortDirection",
      "limit",
      "page",
    ], { limit: "10" })
  );

  // --- Signal: Timeseries ---
  registerRoute(router, "/signal/timeseries", {
    price: X402_API_PRICE_MESSARI_VESTING_USD,
    description: "Messari signal timeseries — historical social signal data",
    discoverable: true,
    resource: "/messari/signal/timeseries",
    inputSchema: {
      queryParams: {
        granularity: { type: "string", description: "1h or 1d (default 1d)" },
        assetIds: { type: "string", description: "Filter by asset IDs" },
        start: { type: "string", description: "Start date" },
        end: { type: "string", description: "End date" },
      },
    },
  }, handleSignalTimeseries);

  // --- Mindshare Gainers ---
  registerRoute(router, "/mindshare-gainers", {
    price: X402_API_PRICE_MESSARI_SIGNAL_USD,
    description: "Messari mindshare gainers — tokens gaining the most social attention",
    discoverable: true,
    resource: "/messari/mindshare-gainers",
    inputSchema: {
      queryParams: {
        period: { type: "string", description: "24h (default) or 7d" },
        limit: { type: "string", description: "Max results" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) => {
    const params = mergeParams(req);
    const period = (params.period || "24h").toLowerCase();
    const path =
      period === "7d"
        ? MESSARI_ENDPOINTS.mindshareGainers7d
        : MESSARI_ENDPOINTS.mindshareGainers24h;
    return proxyGet(req, res, path, ["limit", "page"], { limit: "10" });
  });

  // --- Mindshare Losers ---
  registerRoute(router, "/mindshare-losers", {
    price: X402_API_PRICE_MESSARI_SIGNAL_USD,
    description: "Messari mindshare losers — tokens losing the most social attention",
    discoverable: true,
    resource: "/messari/mindshare-losers",
    inputSchema: {
      queryParams: {
        period: { type: "string", description: "24h (default) or 7d" },
        limit: { type: "string", description: "Max results" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) => {
    const params = mergeParams(req);
    const period = (params.period || "24h").toLowerCase();
    const path =
      period === "7d"
        ? MESSARI_ENDPOINTS.mindshareLosers7d
        : MESSARI_ENDPOINTS.mindshareLosers24h;
    return proxyGet(req, res, path, ["limit", "page"], { limit: "10" });
  });

  // --- News Feed ---
  registerRoute(router, "/news", {
    price: X402_API_PRICE_MESSARI_PREMIUM_USD,
    description: "Messari news — curated institutional-grade crypto news feed",
    discoverable: true,
    resource: "/messari/news",
    inputSchema: {
      queryParams: {
        assetSlugs: { type: "string", description: "Filter by asset slugs (comma-separated)" },
        sourceIds: { type: "string", description: "Filter by source IDs" },
        limit: { type: "string", description: "Max results" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.newsFeed, [
      "assetSlugs",
      "sourceIds",
      "limit",
      "page",
    ], { limit: "10" })
  );

  // --- Token Unlocks: List Assets (free upstream) ---
  registerRoute(router, "/token-unlocks/assets", {
    price: X402_API_PRICE_MESSARI_USD,
    description: "Messari token unlocks — list assets with unlock datasets",
    discoverable: true,
    resource: "/messari/token-unlocks/assets",
    inputSchema: {
      queryParams: {
        limit: { type: "string", description: "Max results" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.tokenUnlocksAssets, [
      "assetIDs",
      "limit",
      "page",
    ])
  );

  // --- Token Unlocks: Allocations ---
  registerRoute(router, "/token-unlocks/allocations", {
    price: X402_API_PRICE_MESSARI_TIMESERIES_USD,
    description: "Messari token allocations — allocation breakdown by category",
    discoverable: true,
    resource: "/messari/token-unlocks/allocations",
    inputSchema: {
      queryParams: {
        assetIDs: { type: "string", description: "Comma-separated asset IDs" },
        limit: { type: "string", description: "Max results" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.tokenUnlocksAllocations, [
      "assetIDs",
      "limit",
      "page",
    ])
  );

  // --- Token Unlocks: Events ---
  registerRoute(router, "/token-unlocks", {
    price: X402_API_PRICE_MESSARI_TIMESERIES_USD,
    description: "Messari token unlock events — upcoming and past unlock events for an asset",
    discoverable: true,
    resource: "/messari/token-unlocks",
    inputSchema: {
      queryParams: {
        assetId: { type: "string", description: "Messari asset ID (required)" },
        start: { type: "string", description: "Start date" },
        end: { type: "string", description: "End date" },
      },
    },
  }, handleTokenUnlocks);

  // --- Token Unlocks: Vesting Schedule ---
  registerRoute(router, "/token-unlocks/vesting", {
    price: X402_API_PRICE_MESSARI_VESTING_USD,
    description: "Messari vesting schedule — forward-looking vesting schedule for an asset",
    discoverable: true,
    resource: "/messari/token-unlocks/vesting",
    inputSchema: {
      queryParams: {
        assetId: { type: "string", description: "Messari asset ID (required)" },
      },
    },
  }, handleTokenUnlocksVesting);

  // --- Fundraising: Rounds ---
  registerRoute(router, "/fundraising", {
    price: X402_API_PRICE_MESSARI_TIMESERIES_USD,
    description: "Messari fundraising rounds — VC funding rounds by stage, date, amount",
    discoverable: true,
    resource: "/messari/fundraising",
    inputSchema: {
      queryParams: {
        assetSlugs: { type: "string", description: "Filter by asset slugs" },
        roundTypes: { type: "string", description: "Filter: seed, series-a, series-b, etc." },
        investorSlugs: { type: "string", description: "Filter by investor slugs" },
        start: { type: "string", description: "Start date" },
        end: { type: "string", description: "End date" },
        limit: { type: "string", description: "Max results" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.fundingRounds, [
      "assetSlugs",
      "roundTypes",
      "investorSlugs",
      "start",
      "end",
      "limit",
      "page",
      "sort",
      "order",
    ], { limit: "10" })
  );

  // --- Fundraising: Investors ---
  registerRoute(router, "/fundraising/investors", {
    price: X402_API_PRICE_MESSARI_INVESTOR_USD,
    description: "Messari fundraising investors — who invested in matching rounds",
    discoverable: true,
    resource: "/messari/fundraising/investors",
    inputSchema: {
      queryParams: {
        assetSlugs: { type: "string", description: "Filter by asset slugs" },
        roundTypes: { type: "string", description: "Filter round types" },
        start: { type: "string", description: "Start date" },
        end: { type: "string", description: "End date" },
        limit: { type: "string", description: "Max results" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.fundingInvestors, [
      "assetSlugs",
      "roundTypes",
      "investorSlugs",
      "start",
      "end",
      "limit",
      "page",
    ], { limit: "10" })
  );

  // --- Fundraising: Projects ---
  registerRoute(router, "/fundraising/projects", {
    price: X402_API_PRICE_MESSARI_TIMESERIES_USD,
    description: "Messari fundraising projects — projects and fundraising attributes",
    discoverable: true,
    resource: "/messari/fundraising/projects",
    inputSchema: {
      queryParams: {
        limit: { type: "string", description: "Max results" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.fundingProjects, [
      "limit",
      "page",
      "sort",
      "order",
    ])
  );

  // --- Fundraising: M&A ---
  registerRoute(router, "/fundraising/mna", {
    price: X402_API_PRICE_MESSARI_INVESTOR_USD,
    description: "Messari M&A deals — mergers and acquisitions in crypto",
    discoverable: true,
    resource: "/messari/fundraising/mna",
    inputSchema: {
      queryParams: {
        start: { type: "string", description: "Start date" },
        end: { type: "string", description: "End date" },
        limit: { type: "string", description: "Max results" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.fundingMnA, [
      "start",
      "end",
      "limit",
      "page",
    ])
  );

  // --- Stablecoins ---
  registerRoute(router, "/stablecoins", {
    price: X402_API_PRICE_MESSARI_USD,
    description: "Messari stablecoins — stablecoin supply, flows, chain breakdowns",
    discoverable: true,
    resource: "/messari/stablecoins",
    inputSchema: {
      queryParams: {
        metrics: { type: "string", description: "Comma-separated metrics to include" },
        chains: { type: "string", description: "Filter by chain" },
        limit: { type: "string", description: "Max results" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.stablecoins, [
      "metrics",
      "chains",
      "limit",
      "page",
    ], { limit: "20" })
  );

  // --- Networks ---
  registerRoute(router, "/networks", {
    price: X402_API_PRICE_MESSARI_USD,
    description: "Messari networks — L1/L2 on-chain activity, fees, active addresses",
    discoverable: true,
    resource: "/messari/networks",
    inputSchema: {
      queryParams: {
        networkSlugs: { type: "string", description: "Filter by network slugs" },
        metrics: { type: "string", description: "Comma-separated metrics" },
        limit: { type: "string", description: "Max results" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.networks, [
      "networkSlugs",
      "metrics",
      "limit",
      "page",
      "sort",
      "order",
    ], { limit: "20" })
  );

  // --- X/Twitter Users ---
  registerRoute(router, "/x-users", {
    price: X402_API_PRICE_MESSARI_PREMIUM_USD,
    description: "Messari X-users — ranked crypto influencer feed with engagement metrics",
    discoverable: true,
    resource: "/messari/x-users",
    inputSchema: {
      queryParams: {
        sort: { type: "string", description: "Sort field" },
        sortDirection: { type: "string", description: "asc or desc" },
        accountType: { type: "string", description: "Filter account type" },
        limit: { type: "string", description: "Max results" },
        page: { type: "string", description: "Page number" },
      },
    },
  }, (req, res) =>
    proxyGet(req, res, MESSARI_ENDPOINTS.xUsers, [
      "sort",
      "sortDirection",
      "accountType",
      "limit",
      "page",
    ], { limit: "20" })
  );

  // --- X-User Timeseries ---
  registerRoute(router, "/x-users/timeseries", {
    price: X402_API_PRICE_MESSARI_VESTING_USD,
    description: "Messari X-user timeseries — historical influencer signal data",
    discoverable: true,
    resource: "/messari/x-users/timeseries",
    inputSchema: {
      queryParams: {
        granularity: { type: "string", description: "1d (default)" },
        start: { type: "string", description: "Start date" },
        end: { type: "string", description: "End date" },
      },
    },
  }, handleXUserTimeseries);

  return router;
}
