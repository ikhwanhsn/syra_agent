/**
 * Detect treasury wallet DEX buys (USDC/SOL/WSOL → $SYRA) on-chain
 * and record them alongside x402 scheduler flushes.
 *
 * Every treasury $SYRA increase counts as a buyback. USD is derived from
 * USDC spend, SOL/WSOL spend, or a live $SYRA price estimate.
 */
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import {
  recordBuybackEvent,
  resolveTreasuryWallet,
  humanToOutAmountRaw,
} from "./buybackRecord.js";
import BuybackEvent from "../models/BuybackEvent.js";
import BuybackAccumulator from "../models/BuybackAccumulator.js";
import { BUYBACK_ACCUMULATOR_ID } from "../config/buybackSchedulerConfig.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.VITE_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 15_000;
const USDC_MINT =
  process.env.USDC_MINT ||
  process.env.SOLANA_USDC_MINT ||
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WSOL_MINT = "So11111111111111111111111111111111111111112";
const DEXSCREENER_TOKEN_URL = "https://api.dexscreener.com/tokens/v1/solana";
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

function roundUsd(n) {
  return Math.round((Number(n) || 0) * 1e6) / 1e6;
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
 * @param {unknown[]} accountKeys
 * @returns {string[]}
 */
export function normalizeAccountKeys(accountKeys) {
  return (accountKeys || []).map((k) => {
    if (typeof k === "string") return k;
    if (k?.pubkey?.toBase58) return k.pubkey.toBase58();
    if (typeof k?.pubkey === "string") return k.pubkey;
    if (k?.toBase58) return k.toBase58();
    return String(k?.pubkey ?? k ?? "");
  });
}

/**
 * Native SOL spent by treasury (lamports decrease), excluding nothing — fees included.
 * @param {{ preBalances?: number[]; postBalances?: number[] }} meta
 * @param {string} treasuryWallet
 * @param {string[]} accountKeys
 */
export function nativeSolSpentUi(meta, treasuryWallet, accountKeys) {
  const keys = normalizeAccountKeys(accountKeys);
  const idx = keys.findIndex((k) => k === treasuryWallet);
  if (idx < 0) return 0;
  const pre = Number(meta?.preBalances?.[idx]) || 0;
  const post = Number(meta?.postBalances?.[idx]) || 0;
  const delta = pre - post;
  if (!(delta > 0)) return 0;
  return delta / LAMPORTS_PER_SOL;
}

/**
 * Live $SYRA + SOL USD prices (DexScreener). Best-effort; nulls on failure.
 * @returns {Promise<{ syraUsd: number | null; solUsd: number | null }>}
 */
export async function fetchBuybackSpotPrices() {
  /** @type {{ syraUsd: number | null; solUsd: number | null }} */
  const out = { syraUsd: null, solUsd: null };
  try {
    const url = `${DEXSCREENER_TOKEN_URL}/${encodeURIComponent(SYRA_TOKEN_MINT)}`;
    const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return out;
    const pairs = await res.json().catch(() => null);
    const list = Array.isArray(pairs) ? pairs : [];
    const best = list.find((p) => p?.chainId === "solana" && Number(p?.priceUsd) > 0) || list[0];
    const syra = Number(best?.priceUsd);
    if (Number.isFinite(syra) && syra > 0) out.syraUsd = syra;
    const native = Number(best?.priceNative);
    // priceNative is SYRA per SOL inverted on pumpswap quote — prefer quote price via liquidity if present.
    // DexScreener pair with SOL quote: solUsd ≈ priceUsd / priceNative
    if (Number.isFinite(native) && native > 0 && out.syraUsd != null) {
      const sol = out.syraUsd / native;
      if (Number.isFinite(sol) && sol > 0) out.solUsd = sol;
    }
  } catch {
    /* optional */
  }

  if (out.solUsd == null) {
    try {
      const res = await fetchWithTimeout(
        `${DEXSCREENER_TOKEN_URL}/${WSOL_MINT}`,
        { headers: { Accept: "application/json" } },
      );
      if (res.ok) {
        const pairs = await res.json().catch(() => null);
        const list = Array.isArray(pairs) ? pairs : [];
        const best = list.find((p) => Number(p?.priceUsd) > 0);
        const sol = Number(best?.priceUsd);
        if (Number.isFinite(sol) && sol > 0) out.solUsd = sol;
      }
    } catch {
      /* optional */
    }
  }

  return out;
}

/**
 * Extract a treasury $SYRA buy from parsed tx meta (pre/post token + native balances).
 * @param {object} meta
 * @param {string} treasuryWallet
 * @param {{
 *   syraMint?: string;
 *   usdcMint?: string;
 *   wsolMint?: string;
 *   accountKeys?: unknown[];
 *   solUsd?: number | null;
 *   syraUsd?: number | null;
 * }} [opts]
 * @returns {{
 *   syraAcquired: number;
 *   buybackUsd: number;
 *   outAmountRaw: string | null;
 *   paidWith: "USDC" | "SOL" | "WSOL" | "estimated" | "unknown";
 * } | null}
 */
export function extractTreasurySyraBuy(meta, treasuryWallet, opts = {}) {
  if (!meta || meta.err || !treasuryWallet) return null;

  // Back-compat: extractTreasurySyraBuy(meta, wallet, syraMint, usdcMint)
  const legacySyra = typeof opts === "string" ? opts : null;
  const legacyUsdc = arguments.length >= 4 && typeof arguments[3] === "string" ? arguments[3] : null;
  const options = legacySyra ? {} : opts && typeof opts === "object" ? opts : {};

  const syraMint = legacySyra || options.syraMint || SYRA_TOKEN_MINT;
  const usdcMint = legacyUsdc || options.usdcMint || USDC_MINT;
  const wsolMint = options.wsolMint || WSOL_MINT;
  const solUsd = options.solUsd != null ? Number(options.solUsd) : null;
  const syraUsd = options.syraUsd != null ? Number(options.syraUsd) : null;

  const pre = tokenBalancesByMint(meta.preTokenBalances, treasuryWallet);
  const post = tokenBalancesByMint(meta.postTokenBalances, treasuryWallet);

  const syraPre = pre.get(syraMint)?.ui ?? 0;
  const syraPost = post.get(syraMint)?.ui ?? 0;
  const syraAcquired = syraPost - syraPre;
  if (!(syraAcquired > 0)) return null;

  const usdcPre = pre.get(usdcMint)?.ui ?? 0;
  const usdcPost = post.get(usdcMint)?.ui ?? 0;
  const usdcSpent = usdcPre - usdcPost;

  const wsolPre = pre.get(wsolMint)?.ui ?? 0;
  const wsolPost = post.get(wsolMint)?.ui ?? 0;
  const wsolSpent = wsolPre - wsolPost;

  const solSpent = nativeSolSpentUi(meta, treasuryWallet, options.accountKeys || []);

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
      buybackUsd: roundUsd(usdcSpent),
      outAmountRaw,
      paidWith: "USDC",
    };
  }

  if (wsolSpent > 0 && solUsd != null && solUsd > 0) {
    return {
      syraAcquired,
      buybackUsd: roundUsd(wsolSpent * solUsd),
      outAmountRaw,
      paidWith: "WSOL",
    };
  }

  // Native SOL drop often includes wrap+swap; prefer it over fee-only noise when meaningful.
  if (solSpent > 0.0005 && solUsd != null && solUsd > 0) {
    return {
      syraAcquired,
      buybackUsd: roundUsd(solSpent * solUsd),
      outAmountRaw,
      paidWith: "SOL",
    };
  }

  if (syraUsd != null && syraUsd > 0) {
    return {
      syraAcquired,
      buybackUsd: roundUsd(syraAcquired * syraUsd),
      outAmountRaw,
      paidWith: "estimated",
    };
  }

  // SYRA increased without priced spend (e.g. transfer-in, airdrop). Still a buyback event at $0.
  return {
    syraAcquired,
    buybackUsd: 0,
    outAmountRaw,
    paidWith: wsolSpent > 0 || solSpent > 0 ? "SOL" : "unknown",
  };
}

/**
 * Parse a single confirmed signature for a treasury SYRA buy.
 * @param {import("@solana/web3.js").Connection} connection
 * @param {string} signature
 * @param {string} treasuryWallet
 * @param {{ solUsd?: number | null; syraUsd?: number | null }} [prices]
 */
export async function parseBuybackFromSignature(
  connection,
  signature,
  treasuryWallet,
  prices = {},
) {
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx?.meta) return null;
  const accountKeys = tx.transaction?.message?.accountKeys || [];
  const extracted = extractTreasurySyraBuy(tx.meta, treasuryWallet, {
    accountKeys,
    solUsd: prices.solUsd,
    syraUsd: prices.syraUsd,
  });
  if (!extracted) return null;
  const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : null;
  return { ...extracted, at: blockTime, swapSignature: signature };
}

/**
 * Revalue existing buyback_events that were stored with buybackUsd=0 using live $SYRA price.
 * @param {{ syraUsd?: number | null }} [opts]
 */
export async function backfillZeroBuybackUsd(opts = {}) {
  let syraUsd = opts.syraUsd;
  if (syraUsd == null || !(syraUsd > 0)) {
    const prices = await fetchBuybackSpotPrices();
    syraUsd = prices.syraUsd;
  }
  if (syraUsd == null || !(syraUsd > 0)) {
    return { success: false, error: "syra_price_unavailable", updated: 0, usdAdded: 0 };
  }

  const zeros = await BuybackEvent.find({
    buybackUsd: { $lte: 0 },
    outAmountHuman: { $gt: 0 },
  })
    .select("_id outAmountHuman buybackUsd")
    .lean();

  let updated = 0;
  let usdAdded = 0;

  for (const row of zeros || []) {
    const estimate = roundUsd(Number(row.outAmountHuman) * syraUsd);
    if (!(estimate > 0)) continue;
    const prev = Number(row.buybackUsd) || 0;
    const delta = estimate - prev;
    if (!(delta > 0)) continue;
    await BuybackEvent.updateOne(
      { _id: row._id },
      { $set: { buybackUsd: estimate, revenueUsd: estimate } },
    );
    updated += 1;
    usdAdded += delta;
  }

  if (usdAdded > 0) {
    await BuybackAccumulator.findOneAndUpdate(
      { _id: BUYBACK_ACCUMULATOR_ID },
      {
        $inc: { totalBuybackUsdSpent: roundUsd(usdAdded) },
        $set: { lastManualBuybackAt: new Date() },
      },
      { upsert: true },
    );
  }

  return {
    success: true,
    syraUsd,
    updated,
    usdAdded: roundUsd(usdAdded),
  };
}

/**
 * Scan recent treasury signatures and record new on-chain SYRA buys.
 * @param {{
 *   limit?: number;
 *   minSyra?: number;
 *   requireUsdcSpend?: boolean;
 *   backfillZeroUsd?: boolean;
 * }} [opts]
 */
export async function syncOnchainBuybacks(opts = {}) {
  const treasuryWallet = resolveTreasuryWallet();
  if (!treasuryWallet) {
    return { success: false, error: "treasury_wallet_unavailable", recorded: 0, scanned: 0 };
  }

  const limit = Math.min(200, Math.max(1, Number(opts.limit) || DEFAULT_SCAN_LIMIT));
  const minSyra = Number(opts.minSyra) > 0 ? Number(opts.minSyra) : 0;
  // Default: count every SYRA increase (USDC, SOL, transfers valued by price).
  const requireUsdcSpend = opts.requireUsdcSpend === true;
  const backfillZeroUsd = opts.backfillZeroUsd !== false;

  const prices = await fetchBuybackSpotPrices();
  const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
  const pubkey = new PublicKey(treasuryWallet);

  const sigInfos = await connection.getSignaturesForAddress(pubkey, { limit });
  const signatures = (sigInfos || []).map((s) => s.signature).filter(Boolean);

  const existing = await BuybackEvent.find({
    swapSignature: { $in: signatures },
  })
    .select("swapSignature buybackUsd outAmountHuman")
    .lean()
    .catch(() => []);
  /** @type {Map<string, { swapSignature: string; buybackUsd: number; outAmountHuman?: number }>} */
  const known = new Map((existing || []).map((e) => [e.swapSignature, e]));

  let scanned = 0;
  let recorded = 0;
  let duplicates = 0;
  let skipped = 0;
  let revalued = 0;
  const recordedSigs = [];

  for (const signature of signatures) {
    const prior = known.get(signature);
    if (prior && Number(prior.buybackUsd) > 0) {
      duplicates += 1;
      continue;
    }

    scanned += 1;
    let parsed;
    try {
      parsed = await parseBuybackFromSignature(
        connection,
        signature,
        treasuryWallet,
        prices,
      );
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
    if (requireUsdcSpend && parsed.paidWith !== "USDC") {
      skipped += 1;
      continue;
    }

    if (prior) {
      // Revalue a previously recorded $0 event now that we can price it.
      if (!(Number(prior.buybackUsd) > 0) && parsed.buybackUsd > 0) {
        await BuybackEvent.updateOne(
          { swapSignature: signature },
          {
            $set: {
              buybackUsd: parsed.buybackUsd,
              revenueUsd: parsed.buybackUsd,
              outAmountHuman: parsed.syraAcquired,
              outAmountRaw: parsed.outAmountRaw,
            },
          },
        );
        await BuybackAccumulator.findOneAndUpdate(
          { _id: BUYBACK_ACCUMULATOR_ID },
          {
            $inc: { totalBuybackUsdSpent: parsed.buybackUsd },
            $set: {
              lastBuybackSignature: signature,
              lastManualBuybackAt: new Date(),
              lastFlushError: null,
            },
          },
          { upsert: true },
        );
        revalued += 1;
        known.set(signature, {
          swapSignature: signature,
          buybackUsd: parsed.buybackUsd,
          outAmountHuman: parsed.syraAcquired,
        });
      } else {
        duplicates += 1;
      }
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
      known.set(signature, {
        swapSignature: signature,
        buybackUsd: parsed.buybackUsd,
        outAmountHuman: parsed.syraAcquired,
      });
    } else if (result.duplicate) {
      duplicates += 1;
    } else {
      skipped += 1;
    }
  }

  let backfill = null;
  if (backfillZeroUsd) {
    backfill = await backfillZeroBuybackUsd({ syraUsd: prices.syraUsd }).catch((err) => ({
      success: false,
      error: err?.message ?? String(err),
      updated: 0,
      usdAdded: 0,
    }));
  }

  return {
    success: true,
    treasuryWallet,
    scanned,
    recorded,
    duplicates,
    skipped,
    revalued,
    signaturesConsidered: signatures.length,
    recordedSigs,
    prices,
    backfill,
  };
}

/**
 * Ingest one signature (manual Jupiter/DEX buy). Parses on-chain; optional overrides.
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

  const prices = await fetchBuybackSpotPrices();
  const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
  let parsed = null;
  try {
    parsed = await parseBuybackFromSignature(
      connection,
      swapSignature,
      treasuryWallet,
      prices,
    );
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
      hint: "Pass buybackUsd, or ensure the tx shows USDC/SOL spend (or $SYRA price is available).",
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
    prices,
  };
}
