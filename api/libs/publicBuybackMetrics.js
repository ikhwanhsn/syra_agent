/**
 * Public $SYRA buyback proof metrics for GET /api/metrics.
 *
 * Buyback USD is the greater of:
 *   1) ledger spend (x402 + on-chain recorded events)
 *   2) live treasury portfolio value (SYRA + USDC + SOL balances)
 * so manual SOL buys and wallet holdings always show in the proof total.
 */
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { isMongooseConnected } from "../config/mongoose.js";
import { BUYBACK_ACCUMULATOR_ID } from "../config/buybackSchedulerConfig.js";
import BuybackAccumulator from "../models/BuybackAccumulator.js";
import BuybackEvent from "../models/BuybackEvent.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import { fetchBuybackSpotPrices } from "./buybackOnchainSync.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.VITE_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 15_000;
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
 * Build public buyback section for /api/metrics.
 */
export async function buildPublicBuybackSnapshot() {
  const treasuryWallet = resolveTreasuryWallet();
  const note =
    "In production, ~80% of settled x402 revenue is batched into Jupiter/DEX $SYRA buys. Buyback spent is the greater of recorded swap USD and the live treasury wallet portfolio (SYRA + USDC + SOL). $SYRA acquired is the live treasury holding. Tokens fund usage rewards / airdrops — not burned.";
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

  const [balances, prices] = await Promise.all([
    fetchTreasuryBalances(treasuryWallet),
    fetchBuybackSpotPrices().catch(() => ({ syraUsd: null, solUsd: null })),
  ]);

  const syraValue =
    balances.syra != null && prices.syraUsd != null && prices.syraUsd > 0
      ? balances.syra * prices.syraUsd
      : 0;
  const solValue =
    balances.sol > 0 && prices.solUsd != null && prices.solUsd > 0
      ? balances.sol * prices.solUsd
      : 0;
  const portfolioUsd = roundUsd(syraValue + balances.usdc + solValue);

  empty.treasurySyraBalance = balances.syra;
  empty.treasuryUsdcBalance = roundUsd(balances.usdc);
  empty.treasurySolBalance = balances.sol;
  empty.treasuryPortfolioUsd = portfolioUsd;
  empty.totalSyraAcquired = Number(balances.syra) || 0;
  empty.totalBuybackUsdSpent = portfolioUsd;

  if (!isMongooseConnected()) {
    return empty;
  }

  const [doc, recent, eventsAgg] = await Promise.all([
    BuybackAccumulator.findById(BUYBACK_ACCUMULATOR_ID).lean().catch(() => null),
    BuybackEvent.find({})
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
  ]);

  const lastSig = doc?.lastBuybackSignature || recent?.[0]?.swapSignature || null;
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

  // Prefer live treasury holding over summed swap events (manual buys, transfers, etc.).
  const totalSyraAcquired =
    balances.syra != null && Number.isFinite(balances.syra)
      ? balances.syra
      : Number(doc?.totalSyraAcquired) || 0;

  const totalBuybackUsdSpent = roundUsd(
    Math.max(ledgerSpent, eventsWithEstimate, portfolioUsd),
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
    treasuryPortfolioUsd: portfolioUsd,
    lastFlushAt: doc?.lastFlushAt
      ? new Date(doc.lastFlushAt).toISOString()
      : null,
    lastBuybackSignature: lastSig,
    lastBuybackSolscan: lastSig
      ? `https://solscan.io/tx/${lastSig}`
      : null,
    recentBuybacks: (recent || []).map((e) => {
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
        solscanUrl: e.swapSignature
          ? `https://solscan.io/tx/${e.swapSignature}`
          : null,
      };
    }),
  };
}
