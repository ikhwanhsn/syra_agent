import axios from "axios";
import {
  Connection,
  PublicKey,
  Keypair,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { resolveReferralFee } from "../libs/jupiterReferral.js";

const isProduction = process.env.NODE_ENV === "production";

/** Poll interval for confirmation (ms). */
const CONFIRM_POLL_MS = 1500;
/** Max time to wait for confirmation (ms). */
const CONFIRM_TIMEOUT_MS = 90_000;

/**
 * Wait for transaction confirmation using HTTP-only polling (getSignatureStatuses).
 * Does not use signatureSubscribe, so it works with RPCs that don't support WebSocket subscriptions.
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string} signature
 * @param {number} lastValidBlockHeight
 * @param {number} [maxWaitMs]
 * @returns {Promise<void>} resolves when confirmed; throws if expired or failed
 */
async function confirmTransactionByPolling(
  connection,
  signature,
  lastValidBlockHeight,
  maxWaitMs = CONFIRM_TIMEOUT_MS,
) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const currentBlockHeight =
        await connection.getBlockHeight("confirmed");
      if (currentBlockHeight > lastValidBlockHeight) {
        throw new Error(
          "Signature has expired: block height exceeded",
        );
      }
      const { value } = await connection.getSignatureStatuses([signature]);
      const status = value?.[0];
      if (status?.err) {
        throw new Error(String(status.err));
      }
      if (
        status?.confirmationStatus === "confirmed" ||
        status?.confirmationStatus === "finalized" ||
        status?.confirmationStatus === "processed"
      ) {
        return;
      }
    } catch (e) {
      if (e.message?.includes("expired") || e.message?.includes("block height"))
        throw e;
      // Transient RPC error; keep polling
    }
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS));
  }
  throw new Error("Confirmation timeout");
}

/**
 * Swap accumulated x402 revenue into SYRA (80% of queued revenue) via Jupiter.
 * Called by the 24h buyback scheduler — not on each individual x402 settlement.
 * Only runs in production (`NODE_ENV === 'production'`). In other environments, returns null without error.
 * @param {number} revenueAmountUSD - Revenue in USD (e.g. price charged for the API call)
 * @returns {Promise<{ swapSignature: string, outAmount: string } | null>}
 */
export async function buybackSYRAFromRevenue(revenueAmountUSD) {
  if (!isProduction) {
    return null;
  }

  const connection = new Connection(process.env.SOLANA_RPC_URL);
  const agentKeypair = Keypair.fromSecretKey(
    bs58.decode(process.env.AGENT_PRIVATE_KEY),
  );
  const syraMint = new PublicKey(process.env.SYRA_TOKEN_MINT);
  const usdcMint = new PublicKey(process.env.USDC_MINT);

  const revenue =
    typeof revenueAmountUSD === "string"
      ? parseFloat(revenueAmountUSD)
      : revenueAmountUSD;

  if (isNaN(revenue) || revenue <= 0) {
    throw new Error(`Invalid revenue amount: ${revenueAmountUSD}`);
  }

  const buybackAmountUSD = revenue * 0.8;
  const buybackAmountLamports = Math.floor(buybackAmountUSD * 1_000_000);

  if (
    !Number.isInteger(buybackAmountLamports) ||
    buybackAmountLamports <= 0
  ) {
    throw new Error(
      `Invalid buyback amount: ${buybackAmountLamports}. Must be a positive integer. Revenue was: ${revenue} USD`,
    );
  }

  const JUPITER_API_BASE = "https://api.jup.ag";
  const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;
  const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1/swap`;

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": process.env.JUPITER_API_KEY,
  };

  const { platformFeeBps, feeAccount } = await resolveReferralFee(connection, syraMint.toString());

  const quoteUrl = new URL(JUPITER_QUOTE_API);
  quoteUrl.searchParams.append("inputMint", usdcMint.toString());
  quoteUrl.searchParams.append("outputMint", syraMint.toString());
  quoteUrl.searchParams.append("amount", buybackAmountLamports.toString());
  quoteUrl.searchParams.append("slippageBps", "100");
  if (platformFeeBps > 0) {
    quoteUrl.searchParams.append("platformFeeBps", String(platformFeeBps));
  }

  const quoteResponse = await axios.get(quoteUrl.toString(), { headers });
  const outAmount = String(quoteResponse.data?.outAmount ?? "");

  const swapBody = {
    quoteResponse: quoteResponse.data,
    userPublicKey: agentKeypair.publicKey.toString(),
    wrapAndUnwrapSol: false,
    skipPreflight: true,
    dynamicComputeUnitLimit: true,
    dynamicSlippage: true,
    prioritizationFeeLamports: {
      priorityLevelWithMaxLamports: {
        maxLamports: 100000,
        priorityLevel: "medium",
      },
    },
  };
  if (platformFeeBps > 0 && feeAccount) {
    swapBody.feeAccount = feeAccount;
  }
  const swapResponse = await axios.post(JUPITER_SWAP_API, swapBody, { headers });

  const { swapTransaction } = swapResponse.data;

  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  transaction.sign([agentKeypair]);

  const swapSignature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await confirmTransactionByPolling(
    connection,
    swapSignature,
    latestBlockhash.lastValidBlockHeight,
  );

  return {
    swapSignature,
    outAmount,
    buybackUsd: buybackAmountUSD,
    revenueUsd: revenue,
  };
}
