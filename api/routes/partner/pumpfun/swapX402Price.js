/**
 * Dynamic x402 USD for POST /pumpfun/agents/swap (volume-aware buys).
 *
 * Formula (SOL buys only — inputMint === wrapped SOL / native mint):
 *   totalUsd = baseUsd + min(solNotional * PUMPFUN_SWAP_VOLUME_FEE_USD_PER_SOL, PUMPFUN_SWAP_VOLUME_FEE_CAP_USD)
 * where solNotional = amount / 1e9 (lamports → SOL).
 *
 * Sells (token in) or missing/invalid amount: charge base only.
 *
 * Env (optional):
 *   PUMPFUN_SWAP_VOLUME_FEE_USD_PER_SOL — extra USD per 1 SOL of buy notional (default "0.01")
 *   PUMPFUN_SWAP_VOLUME_FEE_CAP_USD — max volume surcharge in USD (default "25")
 *
 * Playground dev-wallet discount still applies via getEffectivePriceUsd in x402 middleware.
 */
import { X402_API_PRICE_PUMP_FUN_TX_USD } from "../../../config/x402Pricing.js";

export const PUMP_NATIVE_MINT = "So11111111111111111111111111111111111111112";

/**
 * @param {import("express").Request} req
 * @returns {number} Pre-discount price in USD for this request
 */
export function getPumpfunSwapPriceUsd(req) {
  const base = Number(X402_API_PRICE_PUMP_FUN_TX_USD);
  const baseUsd = Number.isFinite(base) && base >= 0 ? base : 0;

  const perSol = parseFloat(process.env.PUMPFUN_SWAP_VOLUME_FEE_USD_PER_SOL || "0.01");
  const cap = parseFloat(process.env.PUMPFUN_SWAP_VOLUME_FEE_CAP_USD || "25");
  const perSolN = Number.isFinite(perSol) && perSol >= 0 ? perSol : 0;
  const capN = Number.isFinite(cap) && cap >= 0 ? cap : 0;

  const b = req.body && typeof req.body === "object" ? req.body : {};
  const q = req.query && typeof req.query === "object" ? req.query : {};
  const inputMint = String(b.inputMint ?? q.inputMint ?? "").trim();
  const rawAmt = b.amount ?? q.amount;
  let lamports = 0;
  if (typeof rawAmt === "bigint") lamports = Number(rawAmt);
  else if (typeof rawAmt === "number") lamports = rawAmt;
  else lamports = Number(String(rawAmt ?? "").replace(/[^\d.-]/g, "")) || 0;

  if (inputMint !== PUMP_NATIVE_MINT || !Number.isFinite(lamports) || lamports <= 0) {
    return baseUsd;
  }

  const solNotional = lamports / 1e9;
  const volumeUsd = Math.min(solNotional * perSolN, capN);
  return baseUsd + volumeUsd;
}
