/**
 * Jupiter Swap API V1 quote with Syra referral platform fee (when referral ATA exists).
 */
import axios from "axios";
import { getConnection } from "./meteoraDlmmExecutor.js";
import {
  getReferralAccount,
  getPlatformFeeBps,
  resolveReferralFee,
} from "./jupiterReferral.js";

const JUPITER_QUOTE_API = "https://api.jup.ag/swap/v1/quote";
const DEFAULT_SLIPPAGE_BPS = 50;
const MAX_SLIPPAGE_BPS = 5000;

function jupiterHeaders() {
  const headers = { Accept: "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }
  return headers;
}

function pickSource(method, query, body) {
  if (method === "POST" && body && typeof body === "object" && !Array.isArray(body)) {
    return body;
  }
  return query && typeof query === "object" ? query : {};
}

/**
 * @param {{ method: string; query?: Record<string, unknown>; body?: unknown }} input
 */
export function parseJupiterQuoteRequest(input) {
  const method = String(input.method || "GET").toUpperCase();
  const src = pickSource(method, input.query, input.body);

  const inputMint = String(src.inputMint ?? "").trim();
  const outputMint = String(src.outputMint ?? "").trim();
  const amount = String(src.amount ?? "").trim();

  if (!inputMint || !outputMint || !amount) {
    throw new Error("inputMint, outputMint, and amount are required");
  }
  if (!/^\d+$/.test(amount) || amount === "0") {
    throw new Error("amount must be a positive integer (raw token units)");
  }

  let slippageBps = DEFAULT_SLIPPAGE_BPS;
  if (src.slippageBps != null && String(src.slippageBps).trim() !== "") {
    const n = Number(src.slippageBps);
    if (!Number.isFinite(n) || n < 0 || n > MAX_SLIPPAGE_BPS) {
      throw new Error(`slippageBps must be 0–${MAX_SLIPPAGE_BPS}`);
    }
    slippageBps = Math.floor(n);
  }

  const swapMode =
    src.swapMode != null && String(src.swapMode).trim() !== ""
      ? String(src.swapMode).trim()
      : undefined;

  return { inputMint, outputMint, amount, slippageBps, swapMode };
}

/**
 * @param {{ inputMint: string; outputMint: string; amount: string; slippageBps?: number; swapMode?: string }} params
 */
export async function fetchJupiterQuote(params) {
  const { inputMint, outputMint, amount, slippageBps, swapMode } = params;
  const connection = getConnection();
  const { platformFeeBps, feeAccount } = await resolveReferralFee(connection, outputMint);

  const quoteUrl = new URL(JUPITER_QUOTE_API);
  quoteUrl.searchParams.set("inputMint", inputMint);
  quoteUrl.searchParams.set("outputMint", outputMint);
  quoteUrl.searchParams.set("amount", amount);
  quoteUrl.searchParams.set("slippageBps", String(slippageBps ?? DEFAULT_SLIPPAGE_BPS));
  if (platformFeeBps > 0) {
    quoteUrl.searchParams.set("platformFeeBps", String(platformFeeBps));
  }
  if (swapMode) {
    quoteUrl.searchParams.set("swapMode", swapMode);
  }

  let quoteResponse;
  try {
    quoteResponse = await axios.get(quoteUrl.toString(), {
      headers: jupiterHeaders(),
      timeout: 25_000,
      validateStatus: (s) => s < 500,
    });
  } catch (err) {
    const msg = err?.response?.data?.error ?? err?.message ?? "Jupiter quote request failed";
    throw new Error(String(msg));
  }

  if (quoteResponse.status >= 400) {
    const msg =
      quoteResponse.data?.error ??
      quoteResponse.data?.message ??
      `Jupiter quote HTTP ${quoteResponse.status}`;
    throw new Error(String(msg));
  }

  const referralAccount = getReferralAccount();
  return {
    quote: quoteResponse.data,
    referral: {
      referralAccount: referralAccount ? referralAccount.toBase58() : null,
      configuredPlatformFeeBps: getPlatformFeeBps(),
      platformFeeBps,
      feeAccount,
      applied: platformFeeBps > 0 && Boolean(feeAccount),
    },
    computedAt: new Date().toISOString(),
  };
}
