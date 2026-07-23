/**
 * Public $SYRA buyback proof metrics for GET /api/metrics.
 */
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { isMongooseConnected } from "../config/mongoose.js";
import { BUYBACK_ACCUMULATOR_ID } from "../config/buybackSchedulerConfig.js";
import BuybackAccumulator from "../models/BuybackAccumulator.js";
import BuybackEvent from "../models/BuybackEvent.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.VITE_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 15_000;
const BUYBACK_SHARE = 0.8;

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
 * On-chain $SYRA balance for the treasury / agent wallet.
 * @param {string | null} wallet
 * @returns {Promise<number | null>}
 */
async function fetchTreasurySyraBalance(wallet) {
  if (!wallet) return null;
  try {
    const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
    const mintPubkey = new PublicKey(SYRA_TOKEN_MINT);
    const ownerPubkey = new PublicKey(wallet);
    const accounts = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
      mint: mintPubkey,
    });
    return (accounts.value || []).reduce((sum, acc) => {
      const amt = acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (Number(amt) || 0);
    }, 0);
  } catch {
    return null;
  }
}

/**
 * Build public buyback section for /api/metrics.
 */
export async function buildPublicBuybackSnapshot() {
  const treasuryWallet = resolveTreasuryWallet();
  const empty = {
    buybackShareOfRevenue: BUYBACK_SHARE,
    note:
      "In production, ~80% of settled x402 revenue is batched into Jupiter USDC→$SYRA buys. Tokens are held in treasury for usage rewards / airdrops — not burned.",
    pendingRevenueUsd: 0,
    totalAccumulatedUsd: 0,
    totalFlushedUsd: 0,
    totalBuybackUsdSpent: 0,
    totalSyraAcquired: 0,
    treasuryWallet,
    treasurySyraBalance: null,
    lastFlushAt: null,
    lastBuybackSignature: null,
    lastBuybackSolscan: null,
    recentBuybacks: [],
  };

  if (!isMongooseConnected()) {
    empty.treasurySyraBalance = await fetchTreasurySyraBalance(treasuryWallet);
    return empty;
  }

  const [doc, recent, treasurySyraBalance] = await Promise.all([
    BuybackAccumulator.findById(BUYBACK_ACCUMULATOR_ID).lean().catch(() => null),
    BuybackEvent.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .catch(() => []),
    fetchTreasurySyraBalance(treasuryWallet),
  ]);

  const lastSig = doc?.lastBuybackSignature || recent?.[0]?.swapSignature || null;
  const totalBuybackUsdSpent =
    doc?.totalBuybackUsdSpent ??
    (doc?.totalFlushedUsd != null ? Number(doc.totalFlushedUsd) * BUYBACK_SHARE : 0);

  return {
    buybackShareOfRevenue: BUYBACK_SHARE,
    note:
      "In production, ~80% of settled x402 revenue is batched into Jupiter USDC→$SYRA buys. Tokens are held in treasury for usage rewards / airdrops — not burned.",
    pendingRevenueUsd: roundUsd(doc?.pendingRevenueUsd ?? 0),
    totalAccumulatedUsd: roundUsd(doc?.totalAccumulatedUsd ?? 0),
    totalFlushedUsd: roundUsd(doc?.totalFlushedUsd ?? 0),
    totalBuybackUsdSpent: roundUsd(totalBuybackUsdSpent),
    totalSyraAcquired: Number(doc?.totalSyraAcquired) || 0,
    treasuryWallet,
    treasurySyraBalance,
    lastFlushAt: doc?.lastFlushAt
      ? new Date(doc.lastFlushAt).toISOString()
      : null,
    lastBuybackSignature: lastSig,
    lastBuybackSolscan: lastSig
      ? `https://solscan.io/tx/${lastSig}`
      : null,
    recentBuybacks: (recent || []).map((e) => ({
      at: e.createdAt ? new Date(e.createdAt).toISOString() : null,
      revenueUsd: roundUsd(e.revenueUsd),
      buybackUsd: roundUsd(e.buybackUsd),
      syraAcquired: e.outAmountHuman ?? null,
      swapSignature: e.swapSignature,
      solscanUrl: e.swapSignature
        ? `https://solscan.io/tx/${e.swapSignature}`
        : null,
    })),
  };
}
