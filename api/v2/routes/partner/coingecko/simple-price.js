/**
 * v2 x402 API: CoinGecko x402 simple/price — USD price and market data for coins by symbol or CoinGecko id.
 * Proxies to pro-api.coingecko.com/api/v3/x402/simple/price with payer (x402) for payment.
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
 * GET / — CoinGecko x402 simple/price. Requires either symbols or ids.
 * Query params: vs_currencies (default usd), symbols (e.g. btc,eth,sol) OR ids (e.g. bitcoin,ethereum), include_market_cap, include_24hr_vol, include_24hr_change, include_last_updated_at, precision.
 */
async function handleSimplePrice(req, res) {
  await ensurePayer();
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
