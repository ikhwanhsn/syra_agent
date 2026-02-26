/**
 * v2 x402 API: CoinGecko x402 simple/price — USD price and market data for coins by symbol or CoinGecko id.
 * Proxies to pro-api.coingecko.com/api/v3/x402/simple/price; pays with Solana/USDC or Base/USDC.
 * See https://docs.coingecko.com/docs/x402 and https://docs.coingecko.com/reference/simple-price
 */
import express from "express";
import { X402_API_PRICE_COINGECKO_USD } from "../../../../config/x402Pricing.js";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { ensurePayer, coinGeckoFetch } from "./coinGeckoPayer.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

/** CoinGecko x402 base (do not send x-cg-pro-api-key; payment via x402 only). */
const COINGECKO_X402_BASE = "https://pro-api.coingecko.com/api/v3/x402";
/** Free public API used as fallback when x402 fails so the tool always returns price data. */
const COINGECKO_FREE_BASE = "https://api.coingecko.com/api/v3";

/** Request headers (no API key per CoinGecko x402 docs). */
const COINGECKO_HEADERS = {
  Accept: "application/json",
  "User-Agent": "Syra-API/1.0 (https://syraa.fun; server)",
};

/**
 * Fetch from CoinGecko free API (same query params). Used when x402 is unavailable or fails.
 */
async function fetchFreeSimplePrice(url) {
  const freeUrl = new URL(`${COINGECKO_FREE_BASE}/simple/price`);
  for (const [k, v] of url.searchParams) freeUrl.searchParams.set(k, v);
  const res = await fetch(freeUrl.toString(), { method: "GET", headers: COINGECKO_HEADERS });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * GET / — CoinGecko simple/price. Tries x402 first; on any failure falls back to free API so the tool always returns data.
 * Query params: vs_currencies (default usd), symbols (e.g. btc,eth,sol) OR ids (e.g. bitcoin,ethereum), include_market_cap, include_24hr_vol, include_24hr_change, include_last_updated_at, precision.
 */
async function handleSimplePrice(req, res) {
  const {
    vs_currencies = "usd",
    symbols,
    ids,
    include_market_cap,
    include_24hr_vol,
    include_24hr_change,
    include_last_updated_at,
    precision,
    include_tokens,
  } = req.query;

  const hasSymbols = symbols != null && String(symbols).trim() !== "";
  const hasIds = ids != null && String(ids).trim() !== "";
  if (!hasSymbols && !hasIds) {
    return res.status(400).json({
      error: "Either symbols or ids is required",
      message: "Provide symbols (e.g. btc,eth,sol) or ids (e.g. bitcoin,ethereum,solana)",
    });
  }

  const url = new URL(`${COINGECKO_X402_BASE}/simple/price`);
  url.searchParams.set("vs_currencies", String(vs_currencies).toLowerCase());
  if (hasSymbols) url.searchParams.set("symbols", String(symbols).trim().toLowerCase());
  if (hasIds) url.searchParams.set("ids", String(ids).trim().toLowerCase());
  if (include_market_cap != null && include_market_cap !== "")
    url.searchParams.set("include_market_cap", String(include_market_cap));
  if (include_24hr_vol != null && include_24hr_vol !== "")
    url.searchParams.set("include_24hr_vol", String(include_24hr_vol));
  if (include_24hr_change != null && include_24hr_change !== "")
    url.searchParams.set("include_24hr_change", String(include_24hr_change));
  if (include_last_updated_at != null && include_last_updated_at !== "")
    url.searchParams.set("include_last_updated_at", String(include_last_updated_at));
  if (precision != null && precision !== "") url.searchParams.set("precision", String(precision));
  if (include_tokens != null && include_tokens !== "")
    url.searchParams.set("include_tokens", String(include_tokens));

  let data = null;
  let usedX402 = false;

  try {
    await ensurePayer();
    const response = await coinGeckoFetch(url.toString(), {
      method: "GET",
      headers: COINGECKO_HEADERS,
    });
    if (response.ok) {
      data = await response.json().catch(() => null);
      usedX402 = true;
    }
  } catch {
    // fallback to free API below
  }

  if (!data) {
    data = await fetchFreeSimplePrice(url);
  }
  if (!data) {
    return res.status(502).json({
      error: "CoinGecko request failed",
      message: "Could not fetch price from CoinGecko (x402 and free API failed or rate limited). Try again shortly.",
    });
  }

  // Indicate data source: both are real CoinGecko data (pro = paid x402, free = public API fallback)
  res.setHeader("X-Data-Source", usedX402 ? "coingecko-pro-x402" : "coingecko-free");

  if (req.x402Payment && usedX402) {
    try {
      await settlePaymentAndSetResponse(res, req);
    } catch {
      // settlePayment failed; response may already be sent
    }
  }
  res.status(200).json(data);
}

export async function createV2CoingeckoSimplePriceRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      try {
        await handleSimplePrice(req, res);
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
      price: X402_API_PRICE_COINGECKO_USD,
      description: "CoinGecko x402 simple price (USD and market data by symbol or id)",
      method: "GET",
      discoverable: true,
      resource: "/v2/coingecko/simple-price",
      inputSchema: {
        queryParams: {
          vs_currencies: { type: "string", description: "e.g. usd (default)" },
          symbols: { type: "string", description: "Comma-separated symbols (e.g. btc,eth,sol)" },
          ids: { type: "string", description: "Comma-separated CoinGecko ids (e.g. bitcoin,ethereum,solana)" },
          include_market_cap: { type: "string", description: "true/false" },
          include_24hr_vol: { type: "string", description: "true/false" },
          include_24hr_change: { type: "string", description: "true/false" },
          include_last_updated_at: { type: "string", description: "true/false" },
          precision: { type: "string", description: "e.g. full" },
        },
      },
    }),
    (req, res) =>
      handleSimplePrice(req, res).catch((e) => {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : String(e),
        });
      })
  );

  return router;
}
