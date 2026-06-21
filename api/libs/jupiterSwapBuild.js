/**
 * Build Jupiter Swap V1 transaction with Syra referral platform fee.
 */
import axios from "axios";
import { getConnection } from "./meteoraDlmmExecutor.js";
import {
  getReferralAccount,
  getPlatformFeeBps,
  resolveReferralFee,
} from "./jupiterReferral.js";

const JUPITER_SWAP_API = "https://api.jup.ag/swap/v1/swap";

function jupiterHeaders() {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }
  return headers;
}

/**
 * @param {{ quoteResponse: object; userPublicKey: string }} params
 */
export async function buildSwapTransaction({ quoteResponse, userPublicKey }) {
  const taker = String(userPublicKey || "").trim();
  if (!taker) {
    throw new Error("userPublicKey is required");
  }
  if (!quoteResponse || typeof quoteResponse !== "object") {
    throw new Error("quoteResponse is required");
  }

  const outputMint = String(quoteResponse.outputMint ?? "").trim();
  if (!outputMint) {
    throw new Error("quoteResponse.outputMint is required");
  }

  const connection = getConnection();
  const { platformFeeBps, feeAccount } = await resolveReferralFee(connection, outputMint);
  const referralAccount = getReferralAccount();

  const body = {
    quoteResponse,
    userPublicKey: taker,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: "auto",
  };
  if (platformFeeBps > 0 && feeAccount) {
    body.feeAccount = feeAccount;
  }

  let swapResponse;
  try {
    swapResponse = await axios.post(JUPITER_SWAP_API, body, {
      headers: jupiterHeaders(),
      timeout: 30_000,
      validateStatus: (s) => s < 500,
    });
  } catch (err) {
    const msg = err?.response?.data?.error ?? err?.message ?? "Jupiter swap build failed";
    throw new Error(String(msg));
  }

  if (swapResponse.status >= 400) {
    const msg =
      swapResponse.data?.error ??
      swapResponse.data?.message ??
      `Jupiter swap HTTP ${swapResponse.status}`;
    throw new Error(String(msg));
  }

  const { swapTransaction, lastValidBlockHeight } = swapResponse.data ?? {};
  if (!swapTransaction || typeof swapTransaction !== "string") {
    throw new Error("Jupiter did not return a swap transaction");
  }

  return {
    swapTransaction,
    lastValidBlockHeight: lastValidBlockHeight ?? null,
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
