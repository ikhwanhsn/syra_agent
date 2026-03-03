/**
 * CoinMarketCap x402 API routes.
 * Proxies to https://pro-api.coinmarketcap.com/x402/ — quotes latest, listing latest, DEX pairs quotes, DEX search, MCP.
 * Single route: GET and POST /coinmarketcap proxy to CMC x402 by path/query/body.
 * See https://coinmarketcap.com/api/x402/ and https://pro.coinmarketcap.com/api/documentation/v1/#tag/x402-(beta)
 */
import express from "express";
import { X402_API_PRICE_COINMARKETCAP_USD } from "../../../config/x402Pricing.js";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import {
  ensureCmcPayer,
  cmcX402Fetch,
  buildCmcX402Url,
  CMC_X402_ENDPOINTS,
} from "../../../utils/coinmarketcapX402.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const PAYMENT_OPTIONS = {
  price: X402_API_PRICE_COINMARKETCAP_USD,
  description: "CoinMarketCap x402 — cryptocurrency quotes, listing, DEX pairs quotes, DEX search, MCP",
  method: "GET",
  discoverable: true,
  resource: "/coinmarketcap",
  inputSchema: {
    queryParams: {
      endpoint: {
        type: "string",
        description:
          "One of: quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp",
      },
      id: { type: "string", description: "CMC id (e.g. 1 for Bitcoin) for quotes/listing" },
      slug: { type: "string", description: "Slug for quotes/listing" },
      symbol: { type: "string", description: "Symbol(s) for quotes/listing" },
      start: { type: "string", description: "Start rank for listing" },
      limit: { type: "string", description: "Limit for listing" },
      convert: { type: "string", description: "Convert to (e.g. USD)" },
      q: { type: "string", description: "Search query for dex-search" },
      chain_id: { type: "string", description: "Chain id for DEX endpoints" },
      pair_address: { type: "string", description: "Pair address for DEX" },
    },
  },
};

function upstreamErrorMessage(status, text) {
  if (status === 402) return "Payment required (x402).";
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return status >= 500 ? "CoinMarketCap temporarily unavailable." : "Request failed.";
  if (t.length > 500 || /<\s*!?\s*DOCTYPE\s+html|<\s*html\s/i.test(t))
    return status >= 500 ? "CoinMarketCap temporarily unavailable." : "Upstream request failed.";
  if (status === 400) {
    try {
      const j = JSON.parse(t);
      const msg = j?.status?.error_message ?? j?.error_message ?? j?.error;
      if (msg) return typeof msg === "string" ? msg : t;
    } catch {
      // ignore
    }
  }
  return t;
}

/**
 * Resolve CMC x402 path from endpoint name.
 */
function getPathForEndpoint(endpoint) {
  const pathMap = {
    "quotes-latest": CMC_X402_ENDPOINTS.quotesLatest,
    "listing-latest": CMC_X402_ENDPOINTS.listingLatest,
    "dex-pairs-quotes-latest": CMC_X402_ENDPOINTS.dexPairsQuotesLatest,
    "dex-search": CMC_X402_ENDPOINTS.dexSearch,
    mcp: CMC_X402_ENDPOINTS.mcp,
  };
  return pathMap[endpoint] || null;
}

/** Default query/body param values per endpoint so testing works with minimal input. */
const ENDPOINT_DEFAULTS = {
  "quotes-latest": { id: "1", convert: "USD" },
  "listing-latest": { start: "1", limit: "10", convert: "USD" },
  "dex-search": { q: "pepe" },
  "dex-pairs-quotes-latest": {
    chain_id: "8453",
    pair_address: "0xc71f10fcb03e95f7a624da72dc6f1f8936e15025", // Uniswap v3 Base example (Ed/USDC)
  },
  mcp: {},
};

/**
 * Build CMC URL from req: endpoint + all query params (and body for POST).
 * Applies endpoint-specific defaults for missing params so users can test with minimal input.
 */
function buildUrlFromRequest(req) {
  const endpoint =
    req.query.endpoint ||
    req.body?.endpoint ||
    "quotes-latest";
  const path = getPathForEndpoint(String(endpoint).toLowerCase());
  if (!path) {
    return null;
  }
  const source = req.method === "POST" && req.body && typeof req.body === "object" ? req.body : req.query;
  const params = {};
  const allowed = [
    "id",
    "slug",
    "symbol",
    "start",
    "limit",
    "convert",
    "convert_id",
    "aux",
    "skip_invalid",
    "q",
    "chain_id",
    "pair_address",
    "pair_addresses",
    "address",
  ];
  for (const k of allowed) {
    if (source[k] !== undefined && source[k] !== "" && source[k] !== null) {
      params[k] = source[k];
    }
  }
  // Apply endpoint-specific defaults for any missing params (easier testing)
  const defaults = ENDPOINT_DEFAULTS[endpoint.toLowerCase()] || {};
  for (const [k, v] of Object.entries(defaults)) {
    if (params[k] === undefined || params[k] === "" || params[k] === null) {
      params[k] = v;
    }
  }
  return buildCmcX402Url(path, params);
}

/**
 * Shared handler: proxy to CMC x402. GET uses query; POST uses body for endpoint + params.
 */
async function handleCmcProxy(req, res) {
  try {
    await ensureCmcPayer();
  } catch (e) {
    return res.status(503).json({
      error: "CoinMarketCap x402 payer unavailable",
      message: e instanceof Error ? e.message : String(e),
    });
  }

  const endpoint = String(
    req.query.endpoint ?? req.body?.endpoint ?? "quotes-latest"
  ).toLowerCase();
  const url = buildUrlFromRequest(req);
  if (!url) {
    return res.status(400).json({
      error: "Invalid or missing endpoint",
      message:
        "Set endpoint to one of: quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp. Use query params (GET) or body (POST) for id, slug, symbol, start, limit, convert, q, chain_id, pair_address, etc.",
    });
  }
  const method = req.method === "POST" ? "POST" : "GET";
  let response;
  try {
    response = await cmcX402Fetch(url, { method });
  } catch (e) {
    return res.status(502).json({
      error: "CoinMarketCap x402 request failed",
      message: e instanceof Error ? e.message : String(e),
    });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return res.status(response.status).json({
      error: "CoinMarketCap x402 request failed",
      message: upstreamErrorMessage(response.status, text),
    });
  }

  const data = await response.json().catch(() => ({}));
  res.setHeader("X-Data-Source", "coinmarketcap-x402");
  if (req.x402Payment) {
    try {
      await settlePaymentAndSetResponse(res, req);
    } catch {
      // settlePayment failed; response may already be sent
    }
  }
  res.status(200).json(data);
}

export async function createCoinmarketcapRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      try {
        await handleCmcProxy(req, res);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    });
  }

  router.get(
    "/",
    requirePayment({
      ...PAYMENT_OPTIONS,
      method: "GET",
    }),
    (req, res) =>
      handleCmcProxy(req, res).catch((e) => {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : String(e),
        });
      })
  );

  router.post(
    "/",
    requirePayment({
      ...PAYMENT_OPTIONS,
      method: "POST",
      bodyType: "json",
    }),
    (req, res) =>
      handleCmcProxy(req, res).catch((e) => {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : String(e),
        });
      })
  );

  return router;
}
