/**
 * Detect treasury wallet Jupiter (or any DEX) USDC→$SYRA buys on-chain
 * and record them alongside x402 scheduler flushes.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import {
  recordBuybackEvent,
  resolveTreasuryWallet,
  humanToOutAmountRaw,
} from "./buybackRecord.js";
import BuybackEvent from "../models/BuybackEvent.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.VITE_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 15_000;
const USDC_MINT =
  process.env.USDC_MINT ||
  process.env.SOLANA_USDC_MINT ||
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DEFAULT_SCAN_LIMIT = Math.min(
  200,
  Math.max(10, Number(process.env.BUYBACK_ONCHAIN_SCAN_LIMIT) || 80),
);

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

/**
 * @param {Array<{ owner?: string; mint?: string; uiTokenAmount?: { uiAmount?: number | null; uiAmountString?: string; amount?: string; decimals?: number } }>} balances
 * @param {string} treasuryWallet
 */
export function tokenBalancesByMint(balances, treasuryWallet) {
  /** @type {Map<string, { ui: number; raw: string | null }>} */
  const map = new Map();
  for (const b of balances || []) {
    if (!b?.mint || b.owner !== treasuryWallet) continue;
    const uiRaw = b.uiTokenAmount?.uiAmount;
    const uiFromStr = Number(b.uiTokenAmount?.uiAmountString);
    const ui =
      uiRaw != null && Number.isFinite(uiRaw)
        ? uiRaw
        : Number.isFinite(uiFromStr)
          ? uiFromStr
          : 0;
    const raw = b.uiTokenAmount?.amount != null ? String(b.uiTokenAmount.amount) : null;
    const prev = map.get(b.mint);
    if (prev) {
      map.set(b.mint, {
        ui: prev.ui + ui,
        raw:
          prev.raw && raw && /^\d+$/.test(prev.raw) && /^\d+$/.test(raw)
            ? (BigInt(prev.raw) + BigInt(raw)).toString()
            : raw ?? prev.raw,
      });
    } else {
      map.set(b.mint, { ui, raw });
    }
  }
  return map;
}

/**
 * Extract a treasury $SYRA buy from parsed tx meta (pre/post token balances).
 * @returns {{ syraAcquired: number; buybackUsd: number; outAmountRaw: string | null; paidWith: "USDC" | "unknown" } | null}
 */
export function extractTreasurySyraBuy(meta, treasuryWallet, syraMint = SYRA_TOKEN_MINT, usdcMint = USDC_MINT) {
  if (!meta || meta.err || !treasuryWallet) return null;

  const pre = tokenBalancesByMint(meta.preTokenBalances, treasuryWallet);
  const post = tokenBalancesByMint(meta.postTokenBalances, treasuryWallet);

  const syraPre = pre.get(syraMint)?.ui ?? 0;
  const syraPost = post.get(syraMint)?.ui ?? 0;
  const syraAcquired = syraPost - syraPre;
  if (!(syraAcquired > 0)) return null;

  const usdcPre = pre.get(usdcMint)?.ui ?? 0;
  const usdcPost = post.get(usdcMint)?.ui ?? 0;
  const usdcSpent = usdcPre - usdcPost;

  const postRaw = post.get(syraMint)?.raw;
  const preRaw = pre.get(syraMint)?.raw;
  let outAmountRaw = null;
  if (postRaw && preRaw && /^\d+$/.test(postRaw) && /^\d+$/.test(preRaw)) {
    const delta = BigInt(postRaw) - BigInt(preRaw);
    if (delta > 0n) outAmountRaw = delta.toString();
  }
  if (!outAmountRaw) {
    outAmountRaw = humanToOutAmountRaw(syraAcquired);
  }

  if (usdcSpent > 0) {
    return {
      syraAcquired,
      buybackUsd: Math.round(usdcSpent * 1e6) / 1e6,
      outAmountRaw,
      paidWith: "USDC",
    };
  }

  // SYRA increased without treasury USDC decrease (e.g. SOL→SYRA, or transfer-in).
  // Still count as a buy when the fee payer is the treasury (likely a swap).
  return {
    syraAcquired,
    buybackUsd: 0,
    outAmountRaw,
    paidWith: "unknown",
  };
}

/**
 * Parse a single confirmed signature for a treasury SYRA buy.
 * @param {import("@solana/web3.js").Connection} connection
 * @param {string} signature
 * @param {string} treasuryWallet
 */
export async function parseBuybackFromSignature(connection, signature, treasuryWallet) {
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx?.meta) return null;
  const extracted = extractTreasurySyraBuy(tx.meta, treasuryWallet);
  if (!extracted) return null;
  const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : null;
  return { ...extracted, at: blockTime, swapSignature: signature };
}

/**
 * Scan recent treasury signatures and record new on-chain SYRA buys.
 * @param {{ limit?: number; minSyra?: number; requireUsdcSpend?: boolean }} [opts]
 */
export async function syncOnchainBuybacks(opts = {}) {
  const treasuryWallet = resolveTreasuryWallet();
  if (!treasuryWallet) {
    return { success: false, error: "treasury_wallet_unavailable", recorded: 0, scanned: 0 };
  }

  const limit = Math.min(200, Math.max(1, Number(opts.limit) || DEFAULT_SCAN_LIMIT));
  const minSyra = Number(opts.minSyra) > 0 ? Number(opts.minSyra) : 0;
  const requireUsdcSpend = opts.requireUsdcSpend !== false;

  const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
  const pubkey = new PublicKey(treasuryWallet);

  const sigInfos = await connection.getSignaturesForAddress(pubkey, { limit });
  const signatures = (sigInfos || []).map((s) => s.signature).filter(Boolean);

  const existing = await BuybackEvent.find({
    swapSignature: { $in: signatures },
  })
    .select("swapSignature")
    .lean()
    .catch(() => []);
  const known = new Set((existing || []).map((e) => e.swapSignature));

  let scanned = 0;
  let recorded = 0;
  let duplicates = 0;
  let skipped = 0;
  const recordedSigs = [];

  for (const signature of signatures) {
    if (known.has(signature)) {
      duplicates += 1;
      continue;
    }
    scanned += 1;
    let parsed;
    try {
      parsed = await parseBuybackFromSignature(connection, signature, treasuryWallet);
    } catch (err) {
      console.warn(
        "[buyback-onchain] parse failed",
        signature.slice(0, 8),
        err?.message ?? err,
      );
      skipped += 1;
      continue;
    }
    if (!parsed) {
      skipped += 1;
      continue;
    }
    if (parsed.syraAcquired < minSyra) {
      skipped += 1;
      continue;
    }
    if (requireUsdcSpend && !(parsed.buybackUsd > 0)) {
      // Avoid counting airdrops / transfers as buybacks unless USD spend is known.
      skipped += 1;
      continue;
    }

    const result = await recordBuybackEvent({
      swapSignature: parsed.swapSignature,
      buybackUsd: parsed.buybackUsd,
      revenueUsd: parsed.buybackUsd,
      outAmountRaw: parsed.outAmountRaw,
      outAmountHuman: parsed.syraAcquired,
      source: "manual_onchain",
      treasuryWallet,
      at: parsed.at,
    });

    if (result.recorded) {
      recorded += 1;
      recordedSigs.push(signature);
      known.add(signature);
    } else if (result.duplicate) {
      duplicates += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    success: true,
    treasuryWallet,
    scanned,
    recorded,
    duplicates,
    skipped,
    signaturesConsidered: signatures.length,
    recordedSigs,
  };
}

/**
 * Ingest one signature (manual Jupiter buy). Parses on-chain; optional overrides.
 * @param {{
 *   swapSignature: string;
 *   buybackUsd?: number;
 *   outAmountHuman?: number;
 * }} body
 */
export async function ingestBuybackSignature(body) {
  const swapSignature = String(body?.swapSignature || "").trim();
  if (!swapSignature) {
    return { success: false, error: "swap_signature_required" };
  }

  const treasuryWallet = resolveTreasuryWallet();
  if (!treasuryWallet) {
    return { success: false, error: "treasury_wallet_unavailable" };
  }

  const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
  let parsed = null;
  try {
    parsed = await parseBuybackFromSignature(connection, swapSignature, treasuryWallet);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const buybackUsd =
    body?.buybackUsd != null && Number.isFinite(Number(body.buybackUsd))
      ? Number(body.buybackUsd)
      : parsed?.buybackUsd;
  const outAmountHuman =
    body?.outAmountHuman != null && Number.isFinite(Number(body.outAmountHuman))
      ? Number(body.outAmountHuman)
      : parsed?.syraAcquired;

  if (buybackUsd == null || !Number.isFinite(buybackUsd) || buybackUsd < 0) {
    return {
      success: false,
      error: "could_not_resolve_buyback_usd",
      hint: "Pass buybackUsd in the body, or ensure the tx shows treasury USDC decrease.",
    };
  }
  if (outAmountHuman == null || !(outAmountHuman > 0)) {
    return {
      success: false,
      error: "could_not_resolve_syra_acquired",
      hint: "Pass outAmountHuman, or ensure the tx credits $SYRA to the treasury wallet.",
    };
  }

  const result = await recordBuybackEvent({
    swapSignature,
    buybackUsd,
    revenueUsd: buybackUsd,
    outAmountHuman,
    outAmountRaw: parsed?.outAmountRaw ?? humanToOutAmountRaw(outAmountHuman),
    source: "manual_ingest",
    treasuryWallet,
    at: parsed?.at,
  });

  return {
    success: result.recorded || Boolean(result.duplicate),
    ...result,
    parsed,
  };
}
