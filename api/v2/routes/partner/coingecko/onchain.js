/**
 * v2 x402 API: CoinGecko x402 onchain endpoints (search pools, trending pools, token by address).
 * Proxies to pro-api.coingecko.com/api/v3/x402/ with payer (x402) for payment.
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_COINGECKO_USD } from "../../../../config/x402Pricing.js";
import { payer } from "@faremeter/rides";

const COINGECKO_X402_BASE = "https://pro-api.coingecko.com/api/v3/x402";

function ensurePayer() {
  const keypair = process.env.PAYER_KEYPAIR;
  if (!keypair) throw new Error("PAYER_KEYPAIR must be set for CoinGecko x402");
  return payer.addLocalWallet(keypair);
}

/**
 * GET /search-pools — CoinGecko x402 onchain search pools.
 * Query params: query (required), network (e.g. solana, base), page, include.
 */
async function handleSearchPools(req, res) {
  await ensurePayer();
  const { query, network = "solana", page, include } = req.query;
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "query is required" });
  }
  const url = new URL(`${COINGECKO_X402_BASE}/onchain/search/pools`);
  url.searchParams.set("query", query.trim());
  url.searchParams.set("network", String(network).toLowerCase());
  if (page != null && page !== "") url.searchParams.set("page", String(page));
  if (include != null && include !== "") url.searchParams.set("include", String(include));

  const response = await payer.fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return res.status(response.status).json({
      error: "CoinGecko x402 request failed",
      message: response.status === 402 ? "Payment required (x402)" : text || response.statusText,
    });
  }
  const data = await response.json();
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
  res.status(200).json(data);
}

/**
 * GET /trending-pools — CoinGecko x402 onchain trending pools by network.
 * Query params: network (required, e.g. base, solana), duration (e.g. 5m), page, include_gt_community_data, include.
 */
async function handleTrendingPools(req, res) {
  await ensurePayer();
  const { network = "base", duration = "5m", page, include_gt_community_data, include } = req.query;
  const networkId = String(network).toLowerCase();
  const url = new URL(`${COINGECKO_X402_BASE}/onchain/networks/${networkId}/trending_pools`);
  if (duration != null && duration !== "") url.searchParams.set("duration", String(duration));
  if (page != null && page !== "") url.searchParams.set("page", String(page));
  if (include_gt_community_data != null && include_gt_community_data !== "")
    url.searchParams.set("include_gt_community_data", String(include_gt_community_data));
  if (include != null && include !== "") url.searchParams.set("include", String(include));

  const response = await payer.fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return res.status(response.status).json({
      error: "CoinGecko x402 request failed",
      message: response.status === 402 ? "Payment required (x402)" : text || response.statusText,
    });
  }
  const data = await response.json();
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
  res.status(200).json(data);
}

/**
 * GET /token — CoinGecko x402 onchain token data by network and contract address.
 * Query params: network (required), address (required), include, include_composition.
 */
async function handleOnchainToken(req, res) {
  await ensurePayer();
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

  const response = await payer.fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return res.status(response.status).json({
      error: "CoinGecko x402 request failed",
      message: response.status === 402 ? "Payment required (x402)" : text || response.statusText,
    });
  }
  const data = await response.json();
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
  res.status(200).json(data);
}

/**
 * GET /token-price — CoinGecko x402 onchain simple token price by network and contract address(es).
 * Query params: network (required), address (required; comma-separated for multiple), include_market_cap, mcap_fdv_fallback, include_24hr_vol, include_24hr_price_change, include_total_reserve_in_usd.
 */
async function handleOnchainTokenPrice(req, res) {
  await ensurePayer();
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

  const response = await payer.fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return res.status(response.status).json({
      error: "CoinGecko x402 request failed",
      message: response.status === 402 ? "Payment required (x402)" : text || response.statusText,
    });
  }
  const data = await response.json();
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
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
