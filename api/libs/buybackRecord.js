/**
 * Shared idempotent buyback recording (x402 scheduler + manual Jupiter / on-chain).
 */
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { isMongooseConnected } from "../config/mongoose.js";
import { BUYBACK_ACCUMULATOR_ID } from "../config/buybackSchedulerConfig.js";
import BuybackAccumulator from "../models/BuybackAccumulator.js";
import BuybackEvent from "../models/BuybackEvent.js";

const SYRA_DECIMALS = Number(process.env.SYRA_TOKEN_DECIMALS) || 6;

/** @typedef {"x402_scheduler" | "manual_onchain" | "manual_ingest"} BuybackSource */

export function outAmountToHuman(outAmountRaw) {
  const raw = String(outAmountRaw ?? "").trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  try {
    const n = BigInt(raw);
    const divisor = 10n ** BigInt(SYRA_DECIMALS);
    const whole = n / divisor;
    const frac = n % divisor;
    const fracStr = frac.toString().padStart(SYRA_DECIMALS, "0").replace(/0+$/, "");
    const human = fracStr ? Number(`${whole}.${fracStr}`) : Number(whole);
    return Number.isFinite(human) ? human : null;
  } catch {
    return null;
  }
}

export function humanToOutAmountRaw(human) {
  const n = Number(human);
  if (!Number.isFinite(n) || n <= 0) return null;
  try {
    const scaled = BigInt(Math.round(n * 10 ** SYRA_DECIMALS));
    return scaled.toString();
  } catch {
    return null;
  }
}

export function resolveTreasuryWallet() {
  const raw = (process.env.AGENT_PRIVATE_KEY || "").trim();
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(raw)).publicKey.toBase58();
  } catch {
    return null;
  }
}

/**
 * Record a successful USDC/SOL → $SYRA buy into events + accumulator.
 * Idempotent on swapSignature.
 *
 * @param {{
 *   swapSignature: string;
 *   buybackUsd: number;
 *   revenueUsd?: number;
 *   outAmountRaw?: string | null;
 *   outAmountHuman?: number | null;
 *   source?: BuybackSource;
 *   treasuryWallet?: string | null;
 *   at?: Date | string | null;
 * }} input
 * @returns {Promise<{ recorded: boolean; duplicate?: boolean; event?: object; error?: string }>}
 */
export async function recordBuybackEvent(input) {
  if (!isMongooseConnected()) {
    return { recorded: false, error: "mongodb_not_connected" };
  }

  const swapSignature = String(input?.swapSignature || "").trim();
  if (!swapSignature) {
    return { recorded: false, error: "swap_signature_required" };
  }

  const buybackUsd = Number(input?.buybackUsd);
  if (!Number.isFinite(buybackUsd) || buybackUsd < 0) {
    return { recorded: false, error: "invalid_buyback_usd" };
  }

  const existing = await BuybackEvent.findOne({ swapSignature }).lean();
  if (existing) {
    return { recorded: false, duplicate: true, event: existing };
  }

  const source = input?.source || "x402_scheduler";
  const outAmountHuman =
    input?.outAmountHuman != null && Number.isFinite(Number(input.outAmountHuman))
      ? Number(input.outAmountHuman)
      : outAmountToHuman(input?.outAmountRaw);
  const outAmountRaw =
    input?.outAmountRaw != null
      ? String(input.outAmountRaw)
      : humanToOutAmountRaw(outAmountHuman);
  const revenueUsd =
    input?.revenueUsd != null && Number.isFinite(Number(input.revenueUsd))
      ? Number(input.revenueUsd)
      : buybackUsd;
  const treasuryWallet = input?.treasuryWallet ?? resolveTreasuryWallet();
  const createdAt = input?.at ? new Date(input.at) : undefined;

  let event;
  try {
    event = await BuybackEvent.create({
      revenueUsd,
      buybackUsd,
      outAmountRaw,
      outAmountHuman,
      swapSignature,
      treasuryWallet,
      source,
      ...(createdAt && !Number.isNaN(createdAt.getTime()) ? { createdAt, updatedAt: createdAt } : {}),
    });
  } catch (err) {
    if (err?.code === 11000) {
      const dup = await BuybackEvent.findOne({ swapSignature }).lean();
      return { recorded: false, duplicate: true, event: dup };
    }
    throw err;
  }

  const inc = { totalBuybackUsdSpent: buybackUsd };
  if (outAmountHuman != null && outAmountHuman > 0) {
    inc.totalSyraAcquired = outAmountHuman;
  }
  // x402 flushes also increment totalFlushedUsd in the scheduler; manual buys do not.

  await BuybackAccumulator.findOneAndUpdate(
    { _id: BUYBACK_ACCUMULATOR_ID },
    {
      $inc: inc,
      $set: {
        lastBuybackSignature: swapSignature,
        lastBuybackOutAmount: outAmountRaw ?? null,
        lastFlushError: null,
        ...(source === "x402_scheduler" ? {} : { lastManualBuybackAt: new Date() }),
      },
    },
    { upsert: true },
  );

  return { recorded: true, event: event.toObject?.() ?? event };
}
