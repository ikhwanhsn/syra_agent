/**
 * Public $SYRA buyback proof metrics for GET /api/metrics.
 *
 * Buyback USD is the greater of:
 *   1) ledger spend (x402 + on-chain recorded events)
 *   2) live portfolio value across primary treasury + silent totals wallets
 * so manual SOL buys and wallet holdings always show in the proof total.
 *
 * Proof fields (treasuryWallet, recentBuybacks, lastBuyback*) stay primary-only;
 * silent totals wallets never appear in the public response.
 */
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { isMongooseConnected } from "../config/mongoose.js";
import { BUYBACK_ACCUMULATOR_ID } from "../config/buybackSchedulerConfig.js";
import { resolveBuybackTotalsWallets } from "../config/buybackTotalsWallets.js";
import BuybackAccumulator from "../models/BuybackAccumulator.js";
import BuybackEvent from "../models/BuybackEvent.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import { fetchBuybackSpotPrices } from "./buybackOnchainSync.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.VITE_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";
/** Keep buyback enrichment short — public metrics must not wait on hung RPCs. */
const RPC_TIMEOUT_MS = Math.min(
  8_000,
  Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 4_000,
);
const LIVE_BUDGET_MS = Math.max(
  800,
  Number.parseInt(process.env.PUBLIC_METRICS_BUYBACK_LIVE_MS || "2500", 10) || 2_500,
);
const BUYBACK_SHARE = 0.8;
const USDC_MINT =
  process.env.USDC_MINT ||
  process.env.SOLANA_USDC_MINT ||
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function roundUsd(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} fallback
 * @returns {Promise<T>}
 */
function withBudget(promise, ms, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
      timer.unref?.();
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function resolveTreasuryWallet() {
  const raw = (process.env.AGENT_PRIVATE_KEY || "").trim();
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(raw)).publicKey.toBase58();
  } catch {
    return null;
  }
}

/**
 * On-chain balances for the treasury / agent wallet.
 * @param {string | null} wallet
 * @returns {Promise<{
 *   syra: number | null;
 *   usdc: number;
 *   sol: number;
 * }>}
 */
async function fetchTreasuryBalances(wallet) {
  const empty = { syra: null, usdc: 0, sol: 0 };
  if (!wallet) return empty;
  try {
    const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
    const ownerPubkey = new PublicKey(wallet);
    const [syraAccounts, usdcAccounts, lamports] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(ownerPubkey, {
        mint: new PublicKey(SYRA_TOKEN_MINT),
      }),
      connection.getParsedTokenAccountsByOwner(ownerPubkey, {
        mint: new PublicKey(USDC_MINT),
      }),
      connection.getBalance(ownerPubkey, "confirmed"),
    ]);
    const syra = (syraAccounts.value || []).reduce((sum, acc) => {
      const amt = acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (Number(amt) || 0);
    }, 0);
    const usdc = (usdcAccounts.value || []).reduce((sum, acc) => {
      const amt = acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (Number(amt) || 0);
    }, 0);
    return {
      syra,
      usdc,
      sol: (Number(lamports) || 0) / LAMPORTS_PER_SOL,
    };
  } catch {
    return empty;
  }
}

/**
 * @param {{ syra: number | null; usdc: number; sol: number }} balances
 * @param {{ syraUsd: number | null; solUsd: number | null }} prices
 */
function portfolioUsdFromBalances(balances, prices) {
  const syraValue =
    balances.syra != null && prices.syraUsd != null && prices.syraUsd > 0
      ? balances.syra * prices.syraUsd
      : 0;
  const solValue =
    balances.sol > 0 && prices.solUsd != null && prices.solUsd > 0
      ? balances.sol * prices.solUsd
      : 0;
  return roundUsd(syraValue + balances.usdc + solValue);
}

/**
 * Map a BuybackEvent lean doc to the public recent-buybacks shape.
 * @param {object} e
 * @param {{ syraUsd: number | null }} prices
 */
export function mapRecentBuybackEvent(e, prices) {
  const recordedUsd = Number(e.buybackUsd) || 0;
  const syraAmt = Number(e.outAmountHuman) || 0;
  const estimated =
    recordedUsd <= 0 && syraAmt > 0 && prices.syraUsd != null && prices.syraUsd > 0
      ? syraAmt * prices.syraUsd
      : recordedUsd;
  return {
    at: e.createdAt ? new Date(e.createdAt).toISOString() : null,
    revenueUsd: roundUsd(estimated),
    buybackUsd: roundUsd(estimated),
    syraAcquired: e.outAmountHuman ?? null,
    swapSignature: e.swapSignature,
    source: e.source || "x402_scheduler",
    solscanUrl: e.swapSignature ? `https://solscan.io/tx/${e.swapSignature}` : null,
  };
}

/**
 * Mongo filter: primary treasury proof rows only (legacy null wallet included).
 * @param {string | null} primaryWallet
 */
export function primaryBuybackProofFilter(primaryWallet) {
  if (!primaryWallet) {
    return { treasuryWallet: { $in: [null] } };
  }
  return { treasuryWallet: { $in: [primaryWallet, null] } };
}

/**
 * Build public buyback section for /api/metrics.
 */
export async function buildPublicBuybackSnapshot() {
  const treasuryWallet = resolveTreasuryWallet();
  const silentWallets = resolveBuybackTotalsWallets({ primaryWallet: treasuryWallet });
  const note =
    "When settled x402 revenue is paid to the Syra treasury (not Labs/partner payTo overrides), ~80% is queued and batched into Jupiter/DEX $SYRA buys about every 24h. Labs insight routes that pay to lab wallets intentionally skip this queue (skipRevenueBuyback). Buyback spent is the greater of recorded swap USD and the live treasury wallet portfolio (SYRA + USDC + SOL). pendingRevenueUsd / totalFlushedUsd are the queue proof; totalBuybackUsdSpent may be higher because it includes the live portfolio. $SYRA acquired is the live treasury holding. Tokens fund usage rewards / airdrops - not burned.";
  const empty = {
    buybackShareOfRevenue: BUYBACK_SHARE,
    note,
    pendingRevenueUsd: 0,
    totalAccumulatedUsd: 0,
    totalFlushedUsd: 0,
    totalBuybackUsdSpent: 0,
    totalSyraAcquired: 0,
    treasuryWallet,
    treasurySyraBalance: null,
    treasuryUsdcBalance: 0,
    treasurySolBalance: 0,
    treasuryPortfolioUsd: 0,
    lastFlushAt: null,
    lastBuybackSignature: null,
    lastBuybackSolscan: null,
    recentBuybacks: [],
  };

  const emptyLive = { syra: null, usdc: 0, sol: 0 };
  const [balances, silentBalancesList, prices] = await Promise.all([
    withBudget(fetchTreasuryBalances(treasuryWallet), LIVE_BUDGET_MS, emptyLive),
    Promise.all(
      silentWallets.map((w) =>
        withBudget(fetchTreasuryBalances(w), LIVE_BUDGET_MS, emptyLive),
      ),
    ),
    withBudget(
      fetchBuybackSpotPrices().catch(() => ({ syraUsd: null, solUsd: null })),
      LIVE_BUDGET_MS,
      { syraUsd: null, solUsd: null },
    ),
  ]);

  const primaryPortfolioUsd = portfolioUsdFromBalances(balances, prices);
  let combinedSyra =
    balances.syra != null && Number.isFinite(balances.syra) ? Number(balances.syra) : null;
  let combinedPortfolioUsd = primaryPortfolioUsd;
  for (const silentBal of silentBalancesList) {
    combinedPortfolioUsd = roundUsd(
      combinedPortfolioUsd + portfolioUsdFromBalances(silentBal, prices),
    );
    if (silentBal.syra != null && Number.isFinite(silentBal.syra)) {
      combinedSyra = (combinedSyra ?? 0) + Number(silentBal.syra);
    }
  }

  empty.treasurySyraBalance = balances.syra;
  empty.treasuryUsdcBalance = roundUsd(balances.usdc);
  empty.treasurySolBalance = balances.sol;
  empty.treasuryPortfolioUsd = primaryPortfolioUsd;
  empty.totalSyraAcquired = Number(combinedSyra) || 0;
  empty.totalBuybackUsdSpent = combinedPortfolioUsd;

  if (!isMongooseConnected()) {
    return empty;
  }

  const proofFilter = primaryBuybackProofFilter(treasuryWallet);
  const [doc, recent, eventsAgg, lastPrimary] = await Promise.all([
    BuybackAccumulator.findById(BUYBACK_ACCUMULATOR_ID).lean().catch(() => null),
    BuybackEvent.find(proofFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .catch(() => []),
    BuybackEvent.aggregate([
      {
        $group: {
          _id: null,
          spent: { $sum: { $ifNull: ["$buybackUsd", 0] } },
          syra: { $sum: { $ifNull: ["$outAmountHuman", 0] } },
          zeroSyra: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: [{ $ifNull: ["$buybackUsd", 0] }, 0] },
                    { $gt: [{ $ifNull: ["$outAmountHuman", 0] }, 0] },
                  ],
                },
                "$outAmountHuman",
                0,
              ],
            },
          },
        },
      },
    ]).catch(() => []),
    BuybackEvent.findOne(proofFilter)
      .sort({ createdAt: -1 })
      .select("swapSignature")
      .lean()
      .catch(() => null),
  ]);

  const lastSig =
    lastPrimary?.swapSignature ||
    recent?.[0]?.swapSignature ||
    null;
  const ledgerSpent = Number(
    doc?.totalBuybackUsdSpent ??
      (doc?.totalFlushedUsd != null ? Number(doc.totalFlushedUsd) * BUYBACK_SHARE : 0),
  );
  const eventsSpent = Number(eventsAgg?.[0]?.spent) || 0;
  const zeroSyra = Number(eventsAgg?.[0]?.zeroSyra) || 0;
  const estimatedZeroUsd =
    zeroSyra > 0 && prices.syraUsd != null && prices.syraUsd > 0
      ? zeroSyra * prices.syraUsd
      : 0;
  const eventsWithEstimate = eventsSpent + estimatedZeroUsd;

  // Prefer live holdings (primary + silent) over summed swap events.
  const totalSyraAcquired =
    combinedSyra != null && Number.isFinite(combinedSyra)
      ? combinedSyra
      : Number(doc?.totalSyraAcquired) || 0;

  const totalBuybackUsdSpent = roundUsd(
    Math.max(ledgerSpent, eventsWithEstimate, combinedPortfolioUsd),
  );

  return {
    buybackShareOfRevenue: BUYBACK_SHARE,
    note,
    pendingRevenueUsd: roundUsd(doc?.pendingRevenueUsd ?? 0),
    totalAccumulatedUsd: roundUsd(doc?.totalAccumulatedUsd ?? 0),
    totalFlushedUsd: roundUsd(doc?.totalFlushedUsd ?? 0),
    totalBuybackUsdSpent,
    totalSyraAcquired,
    treasuryWallet,
    treasurySyraBalance: balances.syra,
    treasuryUsdcBalance: roundUsd(balances.usdc),
    treasurySolBalance: balances.sol,
    treasuryPortfolioUsd: primaryPortfolioUsd,
    lastFlushAt: doc?.lastFlushAt
      ? new Date(doc.lastFlushAt).toISOString()
      : null,
    lastBuybackSignature: lastSig,
    lastBuybackSolscan: lastSig
      ? `https://solscan.io/tx/${lastSig}`
      : null,
    recentBuybacks: (recent || []).map((e) => mapRecentBuybackEvent(e, prices)),
  };
}
