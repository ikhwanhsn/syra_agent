/**
 * v2 x402 API: CoinGecko x402 onchain endpoints (search pools, trending pools, token by address).
 * Proxies to pro-api.coingecko.com/api/v3/x402/; pays with Solana/USDC or Base/USDC.
 */
import express from "express";
import { X402_API_PRICE_COINGECKO_USD } from "../../../../config/x402Pricing.js";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { ensurePayer, coinGeckoFetchManual402 } from "./coinGeckoPayer.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const COINGECKO_X402_BASE = "https://pro-api.coingecko.com/api/v3/x402";

const DEBUG_LOG_ENDPOINT = "http://127.0.0.1:7242/ingest/0f667121-adf5-4b5b-ad58-913d1c1c7905";

// #region agent log
function debugLog(handler, stage, data = {}) {
  fetch(DEBUG_LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "onchain.js:coingecko",
      message: `coingecko ${handler} ${stage}`,
      data: { handler, stage, ...data },
      timestamp: Date.now(),
      hypothesisId: "flaky",
    }),
  }).catch(() => {});
}
// #endregion

/** True if the error is from @x402/fetch failing to parse CoinGecko's 402 response format. */
function isUpstream402ParseError(e) {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    /Failed to parse payment requirements/i.test(msg) ||
    /Invalid payment required response/i.test(msg)
  );
}

/** User-facing message for upstream failure: avoid forwarding HTML or huge bodies. */
function upstreamErrorMessage(status, text) {
  if (status === 402) return "Payment required (x402).";
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return status >= 500 ? "CoinGecko service temporarily unavailable. Please try again later." : "Request failed.";
  if (t.length > 500 || /<\s*!?\s*DOCTYPE\s+html|<\s*html\s/i.test(t))
    return status >= 500 ? "CoinGecko service temporarily unavailable. Please try again later." : "Upstream request failed.";
  return t;
}

/** Call CoinGecko with manual 402 (v2) handling, timeout and retry on 502/503. */
async function fetchCoinGeckoWithRetry(url, init = {}, { maxRetries = 2, timeoutMs = 25000 } = {}) {
  let lastResponse;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await coinGeckoFetchManual402(url, { ...init, signal: controller.signal });
      clearTimeout(to);
      if (res.ok || (res.status !== 502 && res.status !== 503)) return res;
      lastResponse = res;
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    } catch (e) {
      clearTimeout(to);
      if (e?.name === "AbortError" && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  return lastResponse;
}

/**
 * GET /search-pools — CoinGecko x402 onchain search pools.
 * Query params: query (required), network (e.g. solana, base), page, include.
 */
async function handleSearchPools(req, res) {
  try {
    await ensurePayer();
  } catch (e) {
    return res.status(503).json({
      error: "CoinGecko x402 payer unavailable",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  const { query, network = "solana", page, include } = req.query;
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "query is required" });
  }
  const url = new URL(`${COINGECKO_X402_BASE}/onchain/search/pools`);
  url.searchParams.set("query", query.trim());
  url.searchParams.set("network", String(network).toLowerCase());
  if (page != null && page !== "") url.searchParams.set("page", String(page));
  if (include != null && include !== "") url.searchParams.set("include", String(include));

  debugLog("search-pools", "beforeFetch", { path: url.pathname });
  let response;
  try {
    response = await fetchCoinGeckoWithRetry(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    if (isUpstream402ParseError(e)) {
      debugLog("search-pools", "402ParseError", { err: e instanceof Error ? e.message : String(e) });
      return res.status(502).json({
        error: "CoinGecko upstream 402 format unsupported",
        message:
          "CoinGecko returned payment required in a format we cannot parse. Please try again later or contact support.",
      });
    }
    throw e;
  }
  debugLog("search-pools", "afterFetch", { status: response.status, ok: response.ok });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    debugLog("search-pools", "upstreamError", {
      status: response.status,
      bodyLen: text.length,
      isHtml: /<\s*!?\s*DOCTYPE\s+html|<\s*html\s/i.test(text),
    });
    return res.status(response.status).json({
      error: "CoinGecko x402 request failed",
      message: upstreamErrorMessage(response.status, text),
    });
  }
  const data = await response.json();
  res.setHeader("X-Data-Source", "coingecko-pro-x402");
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
  debugLog("search-pools", "success");
  res.status(200).json(data);
}

/**
 * GET /trending-pools — CoinGecko x402 onchain trending pools by network.
 * Query params: network (required, e.g. base, solana), duration (e.g. 5m), page, include_gt_community_data, include.
 */
async function handleTrendingPools(req, res) {
  try {
    await ensurePayer();
  } catch (e) {
    return res.status(503).json({
      error: "CoinGecko x402 payer unavailable",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  const { network = "base", duration = "5m", page, include_gt_community_data, include } = req.query;
  const networkId = String(network).toLowerCase();
  const url = new URL(`${COINGECKO_X402_BASE}/onchain/networks/${networkId}/trending_pools`);
  if (duration != null && duration !== "") url.searchParams.set("duration", String(duration));
  if (page != null && page !== "") url.searchParams.set("page", String(page));
  if (include_gt_community_data != null && include_gt_community_data !== "")
    url.searchParams.set("include_gt_community_data", String(include_gt_community_data));
  if (include != null && include !== "") url.searchParams.set("include", String(include));

  debugLog("trending-pools", "beforeFetch", { path: url.pathname });
  let response;
  try {
    response = await fetchCoinGeckoWithRetry(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    if (isUpstream402ParseError(e)) {
      debugLog("trending-pools", "402ParseError", { err: e instanceof Error ? e.message : String(e) });
      return res.status(502).json({
        error: "CoinGecko upstream 402 format unsupported",
        message:
          "CoinGecko returned payment required in a format we cannot parse. Please try again later or contact support.",
      });
    }
    throw e;
  }
  debugLog("trending-pools", "afterFetch", { status: response.status, ok: response.ok });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    debugLog("trending-pools", "upstreamError", {
      status: response.status,
      bodyLen: text.length,
      isHtml: /<\s*!?\s*DOCTYPE\s+html|<\s*html\s/i.test(text),
    });
    return res.status(response.status).json({
      error: "CoinGecko x402 request failed",
      message: upstreamErrorMessage(response.status, text),
    });
  }
  const data = await response.json();
  res.setHeader("X-Data-Source", "coingecko-pro-x402");
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
  debugLog("trending-pools", "success");
  res.status(200).json(data);
}

/**
 * GET /token — CoinGecko x402 onchain token data by network and contract address.
 * Query params: network (required), address (required), include, include_composition.
 */
async function handleOnchainToken(req, res) {
  try {
    await ensurePayer();
  } catch (e) {
    return res.status(503).json({
      error: "CoinGecko x402 payer unavailable",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  const { network = "base", address, include, include_composition } = req.query;
  if (!address || typeof address !== "string" || !address.trim()) {
    return res.status(400).json({ error: "address is required" });
  }
  const networkId = String(network).toLowerCase();
  const url = new URL(
    `${COINGECKO_X402_BASE}/onchain/networks/${networkId}/tokens/${encodeURIComponent(address.trim())}`
  );
  if (include != null && include !== "") url.searchParams.set("include", String(include));
  if (include_composition != null && include_composition !== "")
    url.searchParams.set("include_composition", String(include_composition));

  debugLog("token", "beforeFetch", { path: url.pathname });
  let response;
  try {
    response = await fetchCoinGeckoWithRetry(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    if (isUpstream402ParseError(e)) {
      debugLog("token", "402ParseError", { err: e instanceof Error ? e.message : String(e) });
      return res.status(502).json({
        error: "CoinGecko upstream 402 format unsupported",
        message:
          "CoinGecko returned payment required in a format we cannot parse. Please try again later or contact support.",
      });
    }
    throw e;
  }
  debugLog("token", "afterFetch", { status: response.status, ok: response.ok });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    debugLog("token", "upstreamError", {
      status: response.status,
      bodyLen: text.length,
      isHtml: /<\s*!?\s*DOCTYPE\s+html|<\s*html\s/i.test(text),
    });
    return res.status(response.status).json({
      error: "CoinGecko x402 request failed",
      message: upstreamErrorMessage(response.status, text),
    });
  }
  const data = await response.json();
  res.setHeader("X-Data-Source", "coingecko-pro-x402");
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
  debugLog("token", "success");
  res.status(200).json(data);
}

/**
 * GET /token-price — CoinGecko x402 onchain simple token price by network and contract address(es).
 * Query params: network (required), address (required; comma-separated for multiple), include_market_cap, mcap_fdv_fallback, include_24hr_vol, include_24hr_price_change, include_total_reserve_in_usd.
 */
async function handleOnchainTokenPrice(req, res) {
  try {
    await ensurePayer();
  } catch (e) {
    return res.status(503).json({
      error: "CoinGecko x402 payer unavailable",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  const {
    network = "base",
    address,
    include_market_cap,
    mcap_fdv_fallback,
    include_24hr_vol,
    include_24hr_price_change,
    include_total_reserve_in_usd,
  } = req.query;
  if (!address || typeof address !== "string" || !address.trim()) {
    return res.status(400).json({ error: "address is required (comma-separated for multiple)" });
  }
  const networkId = String(network).toLowerCase();
  const addresses = address.trim().replace(/\s+/g, "");
  const url = new URL(
    `${COINGECKO_X402_BASE}/onchain/simple/networks/${networkId}/token_price/${encodeURIComponent(addresses)}`
  );
  if (include_market_cap != null && include_market_cap !== "")
    url.searchParams.set("include_market_cap", String(include_market_cap));
  if (mcap_fdv_fallback != null && mcap_fdv_fallback !== "")
    url.searchParams.set("mcap_fdv_fallback", String(mcap_fdv_fallback));
  if (include_24hr_vol != null && include_24hr_vol !== "")
    url.searchParams.set("include_24hr_vol", String(include_24hr_vol));
  if (include_24hr_price_change != null && include_24hr_price_change !== "")
    url.searchParams.set("include_24hr_price_change", String(include_24hr_price_change));
  if (include_total_reserve_in_usd != null && include_total_reserve_in_usd !== "")
    url.searchParams.set("include_total_reserve_in_usd", String(include_total_reserve_in_usd));

  debugLog("token-price", "beforeFetch", { path: url.pathname });
  let response;
  try {
    response = await fetchCoinGeckoWithRetry(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    if (isUpstream402ParseError(e)) {
      debugLog("token-price", "402ParseError", { err: e instanceof Error ? e.message : String(e) });
      return res.status(502).json({
        error: "CoinGecko upstream 402 format unsupported",
        message:
          "CoinGecko returned payment required in a format we cannot parse. Please try again later or contact support.",
      });
    }
    throw e;
  }
  debugLog("token-price", "afterFetch", { status: response.status, ok: response.ok });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    debugLog("token-price", "upstreamError", {
      status: response.status,
      bodyLen: text.length,
      isHtml: /<\s*!?\s*DOCTYPE\s+html|<\s*html\s/i.test(text),
    });
    return res.status(response.status).json({
      error: "CoinGecko x402 request failed",
      message: upstreamErrorMessage(response.status, text),
    });
  }
  const data = await response.json();
  res.setHeader("X-Data-Source", "coingecko-pro-x402");
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
  debugLog("token-price", "success");
  res.status(200).json(data);
}

export async function createV2CoingeckoOnchainRouter() {
  const router = express.Router();
  const paymentOptions = {
    price: X402_API_PRICE_COINGECKO_USD,
    description: "CoinGecko x402 onchain data",
    method: "GET",
    discoverable: true,
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/search-pools/dev", async (req, res) => {
      try {
        await handleSearchPools(req, res);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    });
    router.get("/trending-pools/dev", async (req, res) => {
      try {
        await handleTrendingPools(req, res);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    });
    router.get("/token/dev", async (req, res) => {
      try {
        await handleOnchainToken(req, res);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    });
    router.get("/token-price/dev", async (req, res) => {
      try {
        await handleOnchainTokenPrice(req, res);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    });
  }

  router.get(
    "/search-pools",
    requirePayment({
      ...paymentOptions,
      resource: "/v2/coingecko/onchain/search-pools",
      inputSchema: {
        queryParams: {
          query: { type: "string", required: true, description: "Search query (name, symbol, or contract address)" },
          network: { type: "string", description: "Network id (e.g. solana, base)" },
          page: { type: "string", description: "Page number" },
          include: { type: "string", description: "Comma-separated: base_token, quote_token, dex" },
        },
      },
    }),
    (req, res) => handleSearchPools(req, res).catch((e) => {
      res.status(500).json({
        error: "Internal server error",
        message: e instanceof Error ? e.message : String(e),
      });
    })
  );

  router.get(
    "/trending-pools",
    requirePayment({
      ...paymentOptions,
      resource: "/v2/coingecko/onchain/trending-pools",
      inputSchema: {
        queryParams: {
          network: { type: "string", description: "Network id (e.g. base, solana)" },
          duration: { type: "string", description: "e.g. 5m" },
          page: { type: "string", description: "Page number" },
          include_gt_community_data: { type: "string", description: "Include community data" },
          include: { type: "string", description: "Comma-separated fields" },
        },
      },
    }),
    (req, res) => handleTrendingPools(req, res).catch((e) => {
      res.status(500).json({
        error: "Internal server error",
        message: e instanceof Error ? e.message : String(e),
      });
    })
  );

  router.get(
    "/token",
    requirePayment({
      ...paymentOptions,
      resource: "/v2/coingecko/onchain/token",
      inputSchema: {
        queryParams: {
          network: { type: "string", description: "Network id (e.g. base, solana, eth)" },
          address: { type: "string", required: true, description: "Token contract address" },
          include: { type: "string", description: "e.g. top_pools" },
          include_composition: { type: "string", description: "true/false" },
        },
      },
    }),
    (req, res) => handleOnchainToken(req, res).catch((e) => {
      res.status(500).json({
        error: "Internal server error",
        message: e instanceof Error ? e.message : String(e),
      });
    })
  );

  router.get(
    "/token-price",
    requirePayment({
      ...paymentOptions,
      resource: "/v2/coingecko/onchain/token-price",
      inputSchema: {
        queryParams: {
          network: { type: "string", description: "Network id (e.g. base, solana, eth)" },
          address: { type: "string", required: true, description: "Token contract address (comma-separated for multiple)" },
          include_market_cap: { type: "string", description: "true/false" },
          mcap_fdv_fallback: { type: "string", description: "true/false" },
          include_24hr_vol: { type: "string", description: "true/false" },
          include_24hr_price_change: { type: "string", description: "true/false" },
          include_total_reserve_in_usd: { type: "string", description: "true/false" },
        },
      },
    }),
    (req, res) => handleOnchainTokenPrice(req, res).catch((e) => {
      res.status(500).json({
        error: "Internal server error",
        message: e instanceof Error ? e.message : String(e),
      });
    })
  );

  return router;
}
