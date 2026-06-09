/**
 * Jupiter sidecar swaps for LP Real: SOL→pool token on open, token→SOL on every close.
 */
import axios from "axios";
import BN from "bn.js";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { executeIntent } from "../services/walletBroker.js";
import { resolveReferralFee } from "./jupiterReferral.js";
import { getConnection, isSolMint, WRAPPED_SOL_MINT } from "./meteoraDlmmExecutor.js";

const JUPITER_API_BASE = "https://api.jup.ag";
const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;
const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1/swap`;
/** Skip Jupiter sidecar when swap size is dust (saves failed Meteora opens). */
const MIN_SIDECAR_SWAP_LAMPORTS = 5_000;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DEFAULT_SWEEP_SKIP_MINTS = new Set([USDC_MINT, WRAPPED_SOL_MINT]);
/** Min raw token amount to swap on close (≈0.01 USDC at 6 decimals). */
const MIN_TOKEN_SWEEP_RAW = 10_000n;

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

  const isStableQuote =
    /usdc|usdt|usd1/i.test(String(otherSymbol || "")) ||
    otherMint === USDC_MINT;
  const baseFraction = (otherBins / totalBins) * 1.02;
  const swapFraction = isStableQuote
    ? Math.min(0.18, baseFraction)
    : Math.min(0.32, baseFraction);
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
 * After a position closes, swap the pool's non-SOL leg (e.g. USDC from open sidecar) back to SOL.
 *
 * @param {object} params
 * @param {string} params.anonymousId
 * @param {string} params.agentAddress
 * @param {string} params.baseMint
 * @param {string} params.quoteMint
 * @param {string} [params.otherSymbol]
 * @param {number} params.solPriceUsd
 */
export async function sweepPoolTokensToSolAfterClose({
  anonymousId,
  agentAddress,
  baseMint,
  quoteMint,
  otherSymbol = "token",
  solPriceUsd,
}) {
  const connection = getConnection();
  const owner = new PublicKey(agentAddress);
  const mints = [];
  if (baseMint && !isSolMint(baseMint)) mints.push({ mint: baseMint, label: otherSymbol });
  if (quoteMint && !isSolMint(quoteMint)) {
    const label =
      quoteMint === USDC_MINT ? "USDC" : otherSymbol !== "token" ? otherSymbol : "quote";
    if (!mints.some((m) => m.mint === quoteMint)) mints.push({ mint: quoteMint, label });
  }

  const swapped = [];
  const errors = [];

  for (const { mint, label } of mints) {
    const raw = await getMintBalanceRaw(connection, owner, mint);
    if (raw < MIN_TOKEN_SWEEP_RAW) continue;

    try {
      const decimals = mint === USDC_MINT ? 6 : 9;
      const uiAmount = Number(raw) / 10 ** decimals;
      const estimatedUsd =
        mint === USDC_MINT
          ? Math.max(0.5, uiAmount)
          : Math.max(0.5, uiAmount * toNum(solPriceUsd, 150) * 0.01);
      const result = await executeJupiterSwap({
        anonymousId,
        agentAddress,
        inputMint: mint,
        outputMint: WRAPPED_SOL_MINT,
        amountRaw: raw.toString(),
        estimatedUsd,
        summary: `LP close: ${label}→SOL`,
        solPriceUsd,
        slippageBps: 100,
      });
      swapped.push({ mint, amountRaw: raw.toString(), signature: result.signature });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${mint.slice(0, 8)}:${msg}`);
    }
  }

  return { swapped, errors };
}

/**
 * Swap wallet SPL balances back to SOL. Used when no LP slots are open.
 *
 * @param {object} params
 * @param {string} params.anonymousId
 * @param {string} params.agentAddress
 * @param {number} params.solPriceUsd
 * @param {string[]} [params.skipMints]
 * @param {boolean} [params.preserveUsdc] — when true, keeps USDC for non-LP agent tool payments
 * @returns {Promise<{ swapped: Array<{ mint: string, amountRaw: string, signature: string | null }>, errors: string[] }>}
 */
export async function sweepNonSolTokensToSol({
  anonymousId,
  agentAddress,
  solPriceUsd,
  skipMints = [],
  preserveUsdc = true,
}) {
  const connection = getConnection();
  const owner = new PublicKey(agentAddress);
  const skip = new Set([WRAPPED_SOL_MINT, ...skipMints.map(String)]);
  if (preserveUsdc) skip.add(USDC_MINT);

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
        summary: `LP idle: swap token→SOL`,
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
