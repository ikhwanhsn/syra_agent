import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalHolderPulsePost from "../models/InternalHolderPulsePost.js";
import {
  SYRA_HOLDER_PULSE_ANGLES,
  SYRA_HOLDER_PULSE_BRAND_CONTEXT,
  SYRA_HOLDER_PULSE_EXISTING_SAMPLE,
  SYRA_HOLDER_PULSE_MAX_RETRIES,
  SYRA_HOLDER_PULSE_SYSTEM_RULES,
  SYRA_HOLDER_PULSE_TOP_HOLDERS_LIMIT,
  SYRA_STAKING_DECIMALS,
} from "../config/syraHolderPulseConfig.js";
import { trimInternalToolHistory, INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";
import { fetchOnchainTokenPrice } from "./equityPriceFetchers.js";
import { fetchSplTokenTopHolders } from "./solanaTokenLargestHolders.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import { computeOperatorStats } from "../services/streamflowLockAggregates.js";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function contentHash(text) {
  return crypto.createHash("sha256").update(normalizeText(text)).digest("hex");
}

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

function isValidId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id.trim());
}

function formatStakedAmount(raw) {
  try {
    const n = BigInt(String(raw || "0"));
    const divisor = 10n ** BigInt(SYRA_STAKING_DECIMALS);
    const whole = n / divisor;
    const frac = n % divisor;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(SYRA_STAKING_DECIMALS, "0").replace(/0+$/, "");
    return `${whole}.${fracStr}`;
  } catch {
    return "0";
  }
}

function resolveAngle(angleId) {
  if (!angleId) {
    const idx = Math.floor(Math.random() * SYRA_HOLDER_PULSE_ANGLES.length);
    return SYRA_HOLDER_PULSE_ANGLES[idx];
  }
  return SYRA_HOLDER_PULSE_ANGLES.find((a) => a.id === angleId) ?? SYRA_HOLDER_PULSE_ANGLES[0];
}

function formatSnapshotForLlm(snapshot) {
  const lines = [
    `Mint: ${snapshot.mint}`,
    `Price USD: ${snapshot.price?.priceUsd ?? "n/a"}`,
    `24h change: ${snapshot.price?.priceChange24h ?? "n/a"}%`,
    `24h volume: $${snapshot.price?.volume24h ?? "n/a"}`,
    `Liquidity USD: $${snapshot.price?.liquidityUsd ?? "n/a"}`,
    `Market cap USD: $${snapshot.marketCapUsd ?? "n/a"}`,
    `Supply (human): ${snapshot.holders?.supplyHuman ?? "n/a"}`,
    `Top holders sampled: ${snapshot.holders?.holders?.length ?? 0}`,
    `Top 10 concentration: ${snapshot.holders?.top10ConcentrationPct ?? "n/a"}%`,
    `Staking — unique stakers: ${snapshot.staking?.uniqueWallets ?? "n/a"}`,
    `Staking — open locks: ${snapshot.staking?.openLockCount ?? "n/a"}`,
    `Staking — total staked (formatted): ${snapshot.staking?.totalStakedFormatted ?? "n/a"}`,
  ];
  if (snapshot.holders?.holders?.length) {
    lines.push("Top 5 holders:");
    snapshot.holders.holders.slice(0, 5).forEach((h, i) => {
      lines.push(`  ${i + 1}. ${h.wallet?.slice(0, 8)}… — ${h.balanceHuman} (${h.sharePct}%)`);
    });
  }
  return lines.join("\n");
}

function mapDoc(d) {
  return {
    id: String(d._id),
    text: d.text,
    angle: d.angle || "",
    snapshot: d.snapshot ?? {},
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

export async function gatherHolderPulseSnapshot() {
  const mint = SYRA_TOKEN_MINT;

  const [holders, price, dexRaw, staking] = await Promise.all([
    fetchSplTokenTopHolders(mint, { limit: SYRA_HOLDER_PULSE_TOP_HOLDERS_LIMIT }).catch(() => null),
    fetchOnchainTokenPrice(mint).catch(() => null),
    getDexscreenerTokenInfo(mint).catch(() => null),
    isMongooseConnected()
      ? computeOperatorStats(mint, "mainnet").catch(() => null)
      : Promise.resolve(null),
  ]);

  let marketCapUsd = null;
  const pairs = Array.isArray(dexRaw?.pairs) ? dexRaw.pairs : [];
  const best = [...pairs]
    .filter((p) => p?.chainId === "solana")
    .sort((a, b) => (Number(b?.liquidity?.usd) || 0) - (Number(a?.liquidity?.usd) || 0))[0];
  if (best) {
    marketCapUsd = Number(best.marketCap ?? best.fdv) || null;
  }

  const snapshot = {
    mint,
    updatedAt: new Date().toISOString(),
    holders: holders ?? { mint, holders: [], supplyHuman: 0, top10ConcentrationPct: null },
    price: price
      ? {
          priceUsd: price.priceUsd,
          liquidityUsd: price.liquidityUsd,
          volume24h: price.volume24h,
          priceChange24h: price.priceChange24h,
          source: price.source,
        }
      : null,
    marketCapUsd,
    staking: staking
      ? {
          uniqueWallets: staking.uniqueWallets,
          openLockCount: staking.openLockCount,
          totalStakedFormatted: formatStakedAmount(staking.totalAmountRawOpen),
          closedLockCount: staking.closedLockCount,
        }
      : null,
  };

  return { success: true, data: snapshot };
}

async function fetchExistingTexts(limit = SYRA_HOLDER_PULSE_EXISTING_SAMPLE) {
  assertMongo();
  const docs = await InternalHolderPulsePost.find({}).sort({ createdAt: -1 }).limit(limit).select("text").lean();
  return docs.map((d) => String(d.text || "").trim()).filter(Boolean);
}

async function generateDraft({ angle, snapshot, existingTexts, attempt }) {
  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nPOSTS ALREADY USED:\n${existingTexts.slice(0, 20).map((t, i) => `${i + 1}. ${t.slice(0, 200)}`).join("\n")}`
      : "";

  const result = await callOpenRouter(
    [
      { role: "system", content: `${SYRA_HOLDER_PULSE_SYSTEM_RULES}\n\n${SYRA_HOLDER_PULSE_BRAND_CONTEXT}\nAttempt ${attempt}.` },
      {
        role: "user",
        content: `Write one onchain proof X post.\n\nANGLE: ${angle.label}\nFOCUS: ${angle.focus}\n\nONCHAIN SNAPSHOT:\n${formatSnapshotForLlm(snapshot)}${forbiddenBlock}\n\nPost:`,
      },
    ],
    { max_tokens: 550, temperature: 0.88, model: OPENROUTER_DEFAULT_MODEL },
  );

  return String(result.response || "").trim().replace(/^["'`]+|["'`]+$/g, "").replace(/^Post:\s*/i, "").trim();
}

export async function generateHolderPulsePost({ angleId, wallet }) {
  assertMongo();
  const angle = resolveAngle(angleId);
  const { data: snapshot } = await gatherHolderPulseSnapshot();
  const existingTexts = await fetchExistingTexts();

  for (let attempt = 1; attempt <= SYRA_HOLDER_PULSE_MAX_RETRIES; attempt++) {
    const text = await generateDraft({ angle, snapshot, existingTexts, attempt });
    if (!text || text.length < 40) continue;

    const hash = contentHash(text);
    if (await InternalHolderPulsePost.exists({ contentHash: hash })) {
      existingTexts.unshift(text);
      continue;
    }

    try {
      const doc = await InternalHolderPulsePost.create({
        contentHash: hash,
        text,
        angle: angle.id,
        snapshot,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });
      await trimInternalToolHistory(InternalHolderPulsePost);
      return { success: true, data: mapDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(text);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique holder pulse post. Try again.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentHolderPulsePosts(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const docs = await InternalHolderPulsePost.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return { success: true, data: docs.map(mapDoc), total: docs.length };
}

export async function deleteHolderPulsePost(id) {
  assertMongo();
  if (!isValidId(id)) {
    const err = new Error("Holder pulse post not found");
    err.code = "not_found";
    throw err;
  }
  const doc = await InternalHolderPulsePost.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Holder pulse post not found");
    err.code = "not_found";
    throw err;
  }
  return { success: true, deletedId: String(doc._id) };
}
