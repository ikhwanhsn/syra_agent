/**
 * Public read-only RISE market snapshot for the /uponly landing.
 * Same upstream as the agent: riseGetMarketByAddress → public.rise.rich (see api/libs/riseClient.js).
 * GET /uponly-rise-market/:address — address is token mint or rise market PDA
 */
import express from "express";
import { riseGetMarketByAddress } from "../libs/riseClient.js";

const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>} m
 */
export function normalizeRisePublicMarket(m) {
  if (!m || typeof m !== "object") {
    return {
      priceUsd: null,
      marketCapUsd: null,
      volume24hUsd: null,
      holders: null,
      floorPriceUsd: null,
      creatorFeePct: null,
      startingPriceUsd: null,
      allTimeHighUsd: null,
      floorPctOfAth: null,
      totalSupply: null,
      borrowableUsd: null,
      imageUrl: null,
    };
  }
  const mintMain = String(m.mint_main || "");
  const isUsdcQuote = mintMain === USDC_MAINNET;
  const priceInCollateral = toNum(m.price);
  const floorInCollateral = toNum(m.mayflower_floor);
  const directPriceUsd = toNum(m.price_usd) ?? toNum(m.token_price_usd) ?? toNum(m.spot_price_usd);
  const directFloorUsd = toNum(m.mayflower_floor_usd) ?? toNum(m.floor_price_usd);
  const priceUsd = directPriceUsd != null ? directPriceUsd : isUsdcQuote ? priceInCollateral : null;
  const floorPriceUsd = directFloorUsd != null ? directFloorUsd : isUsdcQuote ? floorInCollateral : null;
  const marketCapUsd = toNum(m.market_cap_usd) ?? toNum(m.marketCapUsd);
  const volume24hUsd = toNum(m.volume_h24_usd) ?? toNum(m.volumeH24Usd);
  const hc = m.holders_count;
  const holdersRaw = typeof hc === "number" && Number.isFinite(hc) ? hc : toNum(hc);
  const holders = holdersRaw != null && Number.isFinite(holdersRaw) ? Math.max(0, Math.round(holdersRaw)) : null;
  const creator =
    m.creator_fee_percent != null ? toNum(m.creator_fee_percent) : toNum(m.creatorFeePercent);
  const creatorFeePct = creator;
  const startingPriceUsd = toNum(m.starting_price) ?? toNum(m.startingPrice);
  const allTimeHighUsd = toNum(m.ath_price_usd) ?? toNum(m.ath) ?? toNum(m.allTimeHighUsd);
  let floorPctOfAth = null;
  if (allTimeHighUsd != null && allTimeHighUsd > 0 && floorPriceUsd != null) {
    floorPctOfAth = (floorPriceUsd / allTimeHighUsd) * 100;
  }
  const imageUrl = typeof m.token_image === "string" && m.token_image.startsWith("http") ? m.token_image : null;
  return {
    priceUsd,
    marketCapUsd,
    volume24hUsd,
    holders,
    floorPriceUsd,
    creatorFeePct: creatorFeePct != null ? creatorFeePct : null,
    startingPriceUsd: startingPriceUsd != null ? startingPriceUsd : null,
    allTimeHighUsd: allTimeHighUsd != null ? allTimeHighUsd : null,
    floorPctOfAth: floorPctOfAth != null ? floorPctOfAth : null,
    totalSupply: null,
    borrowableUsd: null,
    imageUrl,
  };
}

export function createUponlyRiseMarketRouter() {
  const router = express.Router();
  /** @param {import('express').Request} req @param {import('express').Response} res */
  const handler = async (req, res) => {
    const address = (req.params.address || "").trim();
    if (!address) {
      return res.status(400).json({ success: false, error: "address required" });
    }
    if (address.length < 32 || address.length > 50) {
      return res.status(400).json({ success: false, error: "invalid address" });
    }
    const result = await riseGetMarketByAddress(address);
    if (!result.ok) {
      const code = result.status && result.status < 500 ? result.status : 502;
      return res.status(code).json({
        success: false,
        error: result.error || "RISE request failed",
      });
    }
    const body = result.data;
    if (!body || typeof body !== "object" || !body.ok || !body.market) {
      return res.status(404).json({
        success: false,
        error: "Market not found for this address",
      });
    }
    const normalized = normalizeRisePublicMarket(body.market);
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=120");
    return res.json({
      success: true,
      address,
      updatedAt: new Date().toISOString(),
      normalized,
    });
  };
  router.get("/:address", handler);
  return router;
}
