/**
 * Usage → $SYRA rewards: accrue points on settled x402 spend; fund claimable SYRA from buybacks.
 *
 * Points = USD spent (1:1). Epoch funding converts pending points → claimableSyra
 * proportional to share of pending pool, drawing from treasury buyback inventory.
 */
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  getMint,
} from "@solana/spl-token";
import bs58 from "bs58";
import { isMongooseConnected } from "../config/mongoose.js";
import SyraUsageReward from "../models/SyraUsageReward.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";

const isProduction = process.env.NODE_ENV === "production";
const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.VITE_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

/** Max claimable SYRA per claim (human). */
const MAX_CLAIM_SYRA = Number(process.env.SYRA_REWARDS_MAX_CLAIM) || 100_000;
/** Default epoch conversion: points × rate = SYRA (override via env). */
const DEFAULT_POINTS_TO_SYRA = Number(process.env.SYRA_REWARDS_POINTS_TO_SYRA) || 1000;

function normalizeWallet(wallet) {
  if (!wallet || typeof wallet !== "string") return null;
  const w = wallet.trim();
  if (!w) return null;
  // EVM addresses are case-insensitive
  if (w.startsWith("0x") && w.length === 42) return w.toLowerCase();
  return w;
}

function getTreasuryKeypair() {
  const raw = (process.env.AGENT_PRIVATE_KEY || "").trim();
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    return null;
  }
}

/**
 * Accrue usage rewards after a settled x402 payment.
 * @param {{ payer: string; amountUsd: number }} input
 */
export async function accrueUsageReward({ payer, amountUsd }) {
  if (!isMongooseConnected()) return null;
  const wallet = normalizeWallet(payer);
  const usd = Number(amountUsd);
  if (!wallet || !Number.isFinite(usd) || usd <= 0) return null;

  try {
    return await SyraUsageReward.findOneAndUpdate(
      { wallet },
      {
        $inc: {
          lifetimeSpendUsd: usd,
          lifetimePoints: usd,
          pendingPoints: usd,
        },
        $set: { lastSpendAt: new Date() },
      },
      { upsert: true, new: true },
    );
  } catch (err) {
    console.warn("[syra-rewards] accrue failed:", err?.message ?? err);
    return null;
  }
}

/**
 * Convert pending points → claimable SYRA for all wallets with pendingPoints > 0.
 * Rate: SYRA per USD point (default 1000 SYRA per $1 spend).
 * Caps total funded SYRA at `maxSyraToFund` when provided (treasury inventory).
 *
 * @param {{ pointsToSyra?: number; maxSyraToFund?: number }} [opts]
 */
export async function fundRewardsEpoch(opts = {}) {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  const rate = Number(opts.pointsToSyra) > 0 ? Number(opts.pointsToSyra) : DEFAULT_POINTS_TO_SYRA;
  const maxFund =
    opts.maxSyraToFund != null && Number.isFinite(Number(opts.maxSyraToFund))
      ? Number(opts.maxSyraToFund)
      : null;

  const wallets = await SyraUsageReward.find({ pendingPoints: { $gt: 0 } })
    .select("wallet pendingPoints")
    .lean();
  if (!wallets.length) {
    return { success: true, fundedWallets: 0, totalSyraFunded: 0 };
  }

  const totalPoints = wallets.reduce((s, w) => s + (Number(w.pendingPoints) || 0), 0);
  if (totalPoints <= 0) {
    return { success: true, fundedWallets: 0, totalSyraFunded: 0 };
  }

  let totalSyraFunded = 0;
  let fundedWallets = 0;

  for (const w of wallets) {
    const pts = Number(w.pendingPoints) || 0;
    if (pts <= 0) continue;
    let syra = pts * rate;
    if (maxFund != null) {
      const remaining = maxFund - totalSyraFunded;
      if (remaining <= 0) break;
      syra = Math.min(syra, remaining);
    }
    if (syra <= 0) continue;

    const pointsConsumed = rate > 0 ? syra / rate : pts;
    await SyraUsageReward.updateOne(
      { wallet: w.wallet, pendingPoints: { $gte: pointsConsumed * 0.999 } },
      {
        $inc: {
          pendingPoints: -pointsConsumed,
          claimableSyra: syra,
        },
      },
    );
    totalSyraFunded += syra;
    fundedWallets += 1;
  }

  return { success: true, fundedWallets, totalSyraFunded, rate };
}

/**
 * Get rewards status for a wallet (public).
 * @param {string} wallet
 */
export async function getRewardsForWallet(wallet) {
  const w = normalizeWallet(wallet);
  if (!w) return null;
  if (!isMongooseConnected()) {
    return {
      wallet: w,
      lifetimeSpendUsd: 0,
      lifetimePoints: 0,
      pendingPoints: 0,
      claimableSyra: 0,
      claimedSyra: 0,
      lastSpendAt: null,
      lastClaimAt: null,
      lastClaimTx: null,
    };
  }
  const doc = await SyraUsageReward.findOne({ wallet: w }).lean();
  return {
    wallet: w,
    lifetimeSpendUsd: doc?.lifetimeSpendUsd ?? 0,
    lifetimePoints: doc?.lifetimePoints ?? 0,
    pendingPoints: doc?.pendingPoints ?? 0,
    claimableSyra: doc?.claimableSyra ?? 0,
    claimedSyra: doc?.claimedSyra ?? 0,
    lastSpendAt: doc?.lastSpendAt ? new Date(doc.lastSpendAt).toISOString() : null,
    lastClaimAt: doc?.lastClaimAt ? new Date(doc.lastClaimAt).toISOString() : null,
    lastClaimTx: doc?.lastClaimTx ?? null,
    pointsToSyraRate: DEFAULT_POINTS_TO_SYRA,
    note:
      "Spend on Syra x402 APIs accrues points. Epochs convert points → claimable $SYRA from buyback treasury.",
  };
}

/**
 * Claim claimable $SYRA to the user's Solana wallet (treasury SPL transfer).
 * Production-only for real transfers; returns dry-run shape in non-prod.
 *
 * @param {string} wallet
 * @param {number} [amountSyra]
 */
export async function claimRewards(wallet, amountSyra) {
  const w = normalizeWallet(wallet);
  if (!w || w.startsWith("0x")) {
    return { success: false, error: "solana_wallet_required" };
  }
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }

  const doc = await SyraUsageReward.findOne({ wallet: w });
  if (!doc || !(doc.claimableSyra > 0)) {
    return { success: false, error: "nothing_to_claim" };
  }

  let amount =
    amountSyra != null && Number.isFinite(Number(amountSyra))
      ? Number(amountSyra)
      : Number(doc.claimableSyra);
  amount = Math.min(amount, Number(doc.claimableSyra), MAX_CLAIM_SYRA);
  if (!(amount > 0)) {
    return { success: false, error: "invalid_amount" };
  }

  if (!isProduction) {
    // Dev: mark claimed without on-chain transfer
    doc.claimableSyra = Math.max(0, doc.claimableSyra - amount);
    doc.claimedSyra = (doc.claimedSyra || 0) + amount;
    doc.lastClaimAt = new Date();
    doc.lastClaimTx = "dev_simulated_claim";
    await doc.save();
    return {
      success: true,
      simulated: true,
      amountSyra: amount,
      txSignature: "dev_simulated_claim",
      claimableSyra: doc.claimableSyra,
      claimedSyra: doc.claimedSyra,
    };
  }

  const treasury = getTreasuryKeypair();
  if (!treasury) {
    return { success: false, error: "treasury_not_configured" };
  }

  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const mint = new PublicKey(SYRA_TOKEN_MINT);
    const mintInfo = await getMint(connection, mint);
    const decimals = mintInfo.decimals;
    const rawAmount = BigInt(Math.floor(amount * 10 ** decimals));
    if (rawAmount <= 0n) {
      return { success: false, error: "amount_too_small" };
    }

    const destination = new PublicKey(w);
    const fromAta = getAssociatedTokenAddressSync(mint, treasury.publicKey);
    const toAta = getAssociatedTokenAddressSync(mint, destination);

    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        treasury.publicKey,
        toAta,
        destination,
        mint,
      ),
      createTransferInstruction(fromAta, toAta, treasury.publicKey, rawAmount),
    );
    tx.feePayer = treasury.publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.sign(treasury);
    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
    });
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    doc.claimableSyra = Math.max(0, doc.claimableSyra - amount);
    doc.claimedSyra = (doc.claimedSyra || 0) + amount;
    doc.lastClaimAt = new Date();
    doc.lastClaimTx = sig;
    await doc.save();

    return {
      success: true,
      amountSyra: amount,
      txSignature: sig,
      solscanUrl: `https://solscan.io/tx/${sig}`,
      claimableSyra: doc.claimableSyra,
      claimedSyra: doc.claimedSyra,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Aggregate rewards stats for public metrics.
 */
export async function buildPublicRewardsSnapshot() {
  if (!isMongooseConnected()) {
    return {
      note: "Use Syra x402 APIs → earn $SYRA rewards from buyback treasury.",
      uniqueEarners: 0,
      totalLifetimeSpendUsd: 0,
      totalClaimableSyra: 0,
      totalClaimedSyra: 0,
      pointsToSyraRate: DEFAULT_POINTS_TO_SYRA,
    };
  }
  const [agg] = await SyraUsageReward.aggregate([
    {
      $group: {
        _id: null,
        uniqueEarners: { $sum: 1 },
        totalLifetimeSpendUsd: { $sum: "$lifetimeSpendUsd" },
        totalClaimableSyra: { $sum: "$claimableSyra" },
        totalClaimedSyra: { $sum: "$claimedSyra" },
        totalPendingPoints: { $sum: "$pendingPoints" },
      },
    },
  ]).catch(() => []);

  return {
    note: "Use Syra x402 APIs → earn $SYRA rewards from buyback treasury.",
    uniqueEarners: agg?.uniqueEarners ?? 0,
    totalLifetimeSpendUsd: Math.round((agg?.totalLifetimeSpendUsd ?? 0) * 100) / 100,
    totalClaimableSyra: agg?.totalClaimableSyra ?? 0,
    totalClaimedSyra: agg?.totalClaimedSyra ?? 0,
    totalPendingPoints: agg?.totalPendingPoints ?? 0,
    pointsToSyraRate: DEFAULT_POINTS_TO_SYRA,
  };
}
