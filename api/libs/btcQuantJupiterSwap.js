/**
 * Jupiter swap adapter for BTC quant real agent (USDC <-> cbBTC).
 */
import axios from "axios";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { executeIntent } from "../services/walletBroker.js";
import { resolveReferralFee } from "./jupiterReferral.js";
import { getConnection, isSolMint } from "./meteoraDlmmExecutor.js";
import {
  BTC_QUANT_QUOTE_MINT,
  CBBTC_MINT,
} from "../config/tradingExperimentStrategies.js";

const JUPITER_API_BASE = "https://api.jup.ag";
const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;
const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1/swap`;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function jupiterHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }
  return headers;
}

/**
 * @param {object} params
 * @param {string} params.anonymousId
 * @param {string} params.agentAddress
 * @param {string} params.inputMint
 * @param {string} params.outputMint
 * @param {string|number|bigint} params.amountRaw
 * @param {number} params.estimatedUsd
 * @param {string} params.summary
 * @param {number} [params.slippageBps]
 * @param {number} [params.solPriceUsd]
 */
export async function executeBtcQuantJupiterSwap({
  anonymousId,
  agentAddress,
  inputMint,
  outputMint,
  amountRaw,
  estimatedUsd,
  summary,
  slippageBps = 50,
  solPriceUsd = 150,
}) {
  const amountStr = String(amountRaw);
  if (!amountStr || amountStr === "0") {
    return { signature: null, skipped: true, outAmount: "0" };
  }

  const headers = jupiterHeaders();
  const connection = getConnection();
  const { platformFeeBps, feeAccount } = await resolveReferralFee(connection, outputMint);

  const quoteUrl = new URL(JUPITER_QUOTE_API);
  quoteUrl.searchParams.append("inputMint", inputMint);
  quoteUrl.searchParams.append("outputMint", outputMint);
  quoteUrl.searchParams.append("amount", amountStr);
  quoteUrl.searchParams.append("slippageBps", String(slippageBps));
  if (platformFeeBps > 0) {
    quoteUrl.searchParams.append("platformFeeBps", String(platformFeeBps));
  }

  const quoteResponse = await axios.get(quoteUrl.toString(), { headers });
  let policyUsd = toNum(estimatedUsd, 1);
  if (isSolMint(outputMint)) {
    const outLamports = toNum(quoteResponse.data?.outAmount, 0);
    policyUsd = Math.max(policyUsd, (outLamports / LAMPORTS_PER_SOL) * toNum(solPriceUsd, 150));
  }

  const swapBody = {
    quoteResponse: quoteResponse.data,
    userPublicKey: agentAddress,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
  };
  if (platformFeeBps > 0 && feeAccount) {
    swapBody.feeAccount = feeAccount;
  }

  const swapResponse = await axios.post(JUPITER_SWAP_API, swapBody, { headers });
  const swapTxBase64 = swapResponse.data?.swapTransaction;
  if (!swapTxBase64) {
    throw new Error("btc_quant_swap_no_transaction");
  }

  const brokerResult = await executeIntent(
    { anonymousId, guest: false },
    {
      type: "tx_sign",
      chain: "solana",
      toolId: "jupiter-swap-order",
      serializedTxBase64: swapTxBase64,
      estimatedUsd: policyUsd,
      summary,
    },
  );

  if (brokerResult.status !== "ok") {
    const reasons = brokerResult.reasons || [];
    throw new Error(`btc_quant_swap_broker_failed:${reasons.join(";")}`);
  }

  return {
    signature: brokerResult.signature,
    skipped: false,
    outAmount: String(quoteResponse.data?.outAmount ?? "0"),
    inAmount: String(quoteResponse.data?.inAmount ?? amountStr),
  };
}

export const BTC_QUANT_SWAP_MINTS = {
  usdc: BTC_QUANT_QUOTE_MINT,
  cbbtc: CBBTC_MINT,
};
