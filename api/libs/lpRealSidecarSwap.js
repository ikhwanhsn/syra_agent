/**
 * Jupiter sidecar swaps for LP Real: SOL→pool token on open, token→SOL on close-all.
 */
import axios from "axios";
import BN from "bn.js";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { executeIntent } from "../services/walletBroker.js";
import { getConnection, isSolMint, WRAPPED_SOL_MINT } from "./meteoraDlmmExecutor.js";

const JUPITER_API_BASE = "https://api.jup.ag";
const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;
const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1/swap`;
/** Skip Jupiter sidecar when swap size is dust (saves failed Meteora opens). */
const MIN_SIDECAR_SWAP_LAMPORTS = 5_000;
/** Preserve USDC for agent tool payments when sweeping after close-all. */
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DEFAULT_SWEEP_SKIP_MINTS = new Set([USDC_MINT, WRAPPED_SOL_MINT]);

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

async function getMintBalanceRaw(connection, owner, mintStr) {
  const mint = String(mintStr || "");
  if (isSolMint(mint)) {
    const native = await connection.getBalance(owner, "confirmed");
    try {
      const wsolAta = await getAssociatedTokenAddress(
        new PublicKey(WRAPPED_SOL_MINT),
        owner,
        false,
        TOKEN_PROGRAM_ID,
      );
      const ta = await connection.getTokenAccountBalance(wsolAta, "confirmed");
      return BigInt(native) + BigInt(ta.value.amount);
    } catch {
      return BigInt(native);
    }
  }
  try {
    const ata = await getAssociatedTokenAddress(
      new PublicKey(mint),
      owner,
      false,
      TOKEN_PROGRAM_ID,
    );
    const ta = await connection.getTokenAccountBalance(ata, "confirmed");
    return BigInt(ta.value.amount);
  } catch {
    return 0n;
  }
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
async function executeJupiterSwap({
  anonymousId,
  agentAddress,
  inputMint,
  outputMint,
  amountRaw,
  estimatedUsd,
  summary,
  slippageBps = 100,
  solPriceUsd = 150,
}) {
  const amountStr = String(amountRaw);
  if (!amountStr || amountStr === "0") {
    return { signature: null, skipped: true };
  }

  const headers = jupiterHeaders();
  const quoteUrl = new URL(JUPITER_QUOTE_API);
  quoteUrl.searchParams.append("inputMint", inputMint);
  quoteUrl.searchParams.append("outputMint", outputMint);
  quoteUrl.searchParams.append("amount", amountStr);
  quoteUrl.searchParams.append("slippageBps", String(slippageBps));

  const quoteResponse = await axios.get(quoteUrl.toString(), { headers });
  let policyUsd = toNum(estimatedUsd, 1);
  if (isSolMint(outputMint)) {
    const outLamports = toNum(quoteResponse.data?.outAmount, 0);
    policyUsd = Math.max(policyUsd, (outLamports / LAMPORTS_PER_SOL) * toNum(solPriceUsd, 150));
  }
  const swapResponse = await axios.post(
    JUPITER_SWAP_API,
    {
      quoteResponse: quoteResponse.data,
      userPublicKey: agentAddress,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    },
    { headers },
  );

  const swapTxBase64 = swapResponse.data?.swapTransaction;
  if (!swapTxBase64) {
    throw new Error("sidecar_swap_no_transaction");
  }

  const brokerResult = await executeIntent(
    { anonymousId, guest: false },
    {
      type: "tx_sign",
      chain: "solana",
      toolId: "lp_real_swap",
      serializedTxBase64: swapTxBase64,
      estimatedUsd: policyUsd,
      summary,
    },
  );

  if (brokerResult.status !== "ok") {
    const reasons = brokerResult.reasons || [];
    throw new Error(`sidecar_swap_broker_failed:${reasons.join(";")}`);
  }

  return {
    signature: brokerResult.signature,
    skipped: false,
    outAmount: String(quoteResponse.data?.outAmount ?? "0"),
  };
}

/**
 * Bins on the non-SOL side of the position (needs the other token).
 */
export function otherSideBinCount(binsBelow, binsAbove, solIsX) {
  return solIsX ? Math.max(0, toNum(binsBelow, 0)) : Math.max(0, toNum(binsAbove, 0));
}

/**
 * Pre-swap SOL → pool's non-SOL token before Meteora LP open when strategy bins need both sides.
 *
 * @param {object} params
 * @param {string} params.anonymousId
 * @param {string} params.agentAddress
 * @param {string} params.baseMint
 * @param {string} params.quoteMint
 * @param {string} [params.otherSymbol]
 * @param {number} params.depositSol
 * @param {number} params.binsBelow
 * @param {number} params.binsAbove
 * @param {number} params.solPriceUsd
 * @returns {Promise<{ swappedSol: number, swappedSolLamports: number, otherTokenRaw: BN }>}
 */
export async function ensureSidecarTokenForPool({
  anonymousId,
  agentAddress,
  baseMint,
  quoteMint,
  otherSymbol = "token",
  depositSol,
  binsBelow,
  binsAbove,
  solPriceUsd,
}) {
  const solIsX = isSolMint(baseMint);
  const solIsY = isSolMint(quoteMint);
  if (!solIsX && !solIsY) {
    throw new Error("non_sol_pool_unsupported");
  }
  if (solIsX && solIsY) {
    return { swappedSol: 0, swappedSolLamports: 0, otherTokenRaw: new BN(0) };
  }

  const otherBins = otherSideBinCount(binsBelow, binsAbove, solIsX);
  const totalBins = toNum(binsBelow, 0) + toNum(binsAbove, 0) + 1;
  if (otherBins <= 0 || totalBins <= 0) {
    return { swappedSol: 0, swappedSolLamports: 0, otherTokenRaw: new BN(0) };
  }

  const otherMint = solIsX ? quoteMint : baseMint;
  if (!otherMint || isSolMint(otherMint)) {
    return { swappedSol: 0, swappedSolLamports: 0, otherTokenRaw: new BN(0) };
  }

  const connection = getConnection();
  const owner = new PublicKey(agentAddress);

  const swapFraction = Math.min(0.5, (otherBins / totalBins) * 1.05);
  const swapLamports = Math.floor(toNum(depositSol) * swapFraction * LAMPORTS_PER_SOL);
  if (swapLamports < MIN_SIDECAR_SWAP_LAMPORTS) {
    return { swappedSol: 0, swappedSolLamports: 0, otherTokenRaw: new BN(0) };
  }

  const headers = jupiterHeaders();
  const quoteUrl = new URL(JUPITER_QUOTE_API);
  quoteUrl.searchParams.append("inputMint", WRAPPED_SOL_MINT);
  quoteUrl.searchParams.append("outputMint", otherMint);
  quoteUrl.searchParams.append("amount", String(swapLamports));
  quoteUrl.searchParams.append("slippageBps", "100");

  const quoteResponse = await axios.get(quoteUrl.toString(), { headers });
  const outAmountStr = String(quoteResponse.data?.outAmount ?? "0");
  if (outAmountStr === "0" || outAmountStr === "") {
    throw new Error("jupiter_quote_zero");
  }
  const targetOtherRaw = new BN(outAmountStr);
  if (targetOtherRaw.isZero()) {
    throw new Error("jupiter_quote_zero");
  }

  const existingRaw = await getMintBalanceRaw(connection, owner, otherMint);
  const targetBn = BigInt(targetOtherRaw.toString());
  if (targetBn > 0n && existingRaw * 100n >= targetBn * 95n) {
    return {
      swappedSol: 0,
      swappedSolLamports: 0,
      otherTokenRaw: new BN(existingRaw.toString()),
    };
  }

  const swapUsd = (swapLamports / LAMPORTS_PER_SOL) * toNum(solPriceUsd, 150);
  await executeJupiterSwap({
    anonymousId,
    agentAddress,
    inputMint: WRAPPED_SOL_MINT,
    outputMint: otherMint,
    amountRaw: swapLamports,
    estimatedUsd: swapUsd,
    summary: `Sidecar SOL→${otherSymbol} for LP open`,
    solPriceUsd,
  });

  const afterRaw = await getMintBalanceRaw(connection, owner, otherMint);
  return {
    swappedSol: swapLamports / LAMPORTS_PER_SOL,
    swappedSolLamports: swapLamports,
    otherTokenRaw: new BN(afterRaw.toString()),
  };
}

/**
 * After close-all, swap every non-SOL SPL balance back to SOL (keeps USDC for agent payments).
 *
 * @param {object} params
 * @param {string} params.anonymousId
 * @param {string} params.agentAddress
 * @param {number} params.solPriceUsd
 * @param {string[]} [params.skipMints]
 * @returns {Promise<{ swapped: Array<{ mint: string, amountRaw: string, signature: string | null }>, errors: string[] }>}
 */
export async function sweepNonSolTokensToSol({
  anonymousId,
  agentAddress,
  solPriceUsd,
  skipMints = [],
}) {
  const connection = getConnection();
  const owner = new PublicKey(agentAddress);
  const skip = new Set([...DEFAULT_SWEEP_SKIP_MINTS, ...skipMints.map(String)]);

  const resp = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });
  const rows = resp?.value ?? [];
  const swapped = [];
  const errors = [];

  for (const row of rows) {
    const info = row.account?.data?.parsed?.info;
    const mint = info?.mint;
    const amountStr = info?.tokenAmount?.amount;
    const decimals = toNum(info?.tokenAmount?.decimals, 0);
    if (!mint || !amountStr || amountStr === "0") continue;
    if (skip.has(mint) || isSolMint(mint)) continue;

    const uiAmount = Number(amountStr) / 10 ** decimals;
    if (!Number.isFinite(uiAmount) || uiAmount < 0.000_001) continue;

    try {
      const result = await executeJupiterSwap({
        anonymousId,
        agentAddress,
        inputMint: mint,
        outputMint: WRAPPED_SOL_MINT,
        amountRaw: amountStr,
        estimatedUsd: 1,
        summary: `Close-all: swap token→SOL`,
        solPriceUsd,
      });
      swapped.push({ mint, amountRaw: amountStr, signature: result.signature });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${mint.slice(0, 8)}:${msg}`);
    }
  }

  return { swapped, errors };
}
