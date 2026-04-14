/**
 * Dynamic x402 USD for POST /pumpfun/agents/create-coin (initial-buy notional).
 *
 * Formula:
 *   totalUsd = baseUsd + min(solNotional * PUMPFUN_CREATE_COIN_VOLUME_FEE_USD_PER_SOL, PUMPFUN_CREATE_COIN_VOLUME_FEE_CAP_USD)
 * where solNotional = solLamports / 1e9 (lamports → SOL from body.solLamports).
 *
 * Zero or missing / invalid solLamports: charge base only.
 *
 * Env (optional):
 *   PUMPFUN_CREATE_COIN_VOLUME_FEE_USD_PER_SOL — extra USD per 1 SOL of initial buy (default "0.01")
 *   PUMPFUN_CREATE_COIN_VOLUME_FEE_CAP_USD — max volume surcharge in USD (default "25")
 *
 * Playground dev-wallet discount still applies via getEffectivePriceUsd in x402 middleware.
 */
import { X402_API_PRICE_PUMP_FUN_TX_USD } from "../../../config/x402Pricing.js";

/**
 * @param {import("express").Request} req
 * @returns {number} Pre-discount price in USD for this request
 */
export function getPumpfunCreateCoinPriceUsd(req) {
  const base = Number(X402_API_PRICE_PUMP_FUN_TX_USD);
  const baseUsd = Number.isFinite(base) && base >= 0 ? base : 0;

  const perSol = parseFloat(process.env.PUMPFUN_CREATE_COIN_VOLUME_FEE_USD_PER_SOL || "0.01");
  const cap = parseFloat(process.env.PUMPFUN_CREATE_COIN_VOLUME_FEE_CAP_USD || "25");
  const perSolN = Number.isFinite(perSol) && perSol >= 0 ? perSol : 0;
  const capN = Number.isFinite(cap) && cap >= 0 ? cap : 0;

  const b = req.body && typeof req.body === "object" ? req.body : {};
  const q = req.query && typeof req.query === "object" ? req.query : {};
  const raw = b.solLamports ?? q.solLamports;
  let lamports = 0;
  if (typeof raw === "bigint") lamports = Number(raw);
  else if (typeof raw === "number") lamports = raw;
  else lamports = Number(String(raw ?? "").replace(/[^\d.-]/g, "")) || 0;

  if (!Number.isFinite(lamports) || lamports <= 0) {
    return baseUsd;
  }

  const solNotional = lamports / 1e9;
  const volumeUsd = Math.min(solNotional * perSolN, capN);
  return baseUsd + volumeUsd;
}
