#!/usr/bin/env node
/**
 * Read-only reconciliation: match KOL pool wallet outbound SOL transfers
 * against DB records (KolPayout, platform fees, creator refunds).
 *
 * Reports recipients/campaigns that appear to have been paid more than once.
 *
 *   cd api && node scripts/kolPayoutReconcile.js
 *   cd api && node scripts/kolPayoutReconcile.js --limit=200
 *
 * Env: MONGODB_URI, Solana RPC (SOLANA_RPC_URL / defaults), optional
 * KOL_POOL_WALLET_ADDRESS (or derives from KOL_POOL_WALLET_PRIVATE_KEY).
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import connectMongoose from "../config/mongoose.js";
import KolCampaign from "../models/KolCampaign.js";
import KolPayout from "../models/KolPayout.js";
import { getPoolWalletAddress, isPoolWalletConfigured } from "../services/kolPoolWallet.js";
import { createSolanaConnection, getSolanaRpcUrlCandidates } from "../libs/solanaServerRpc.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (!hit) return fallback;
  return hit.slice(prefix.length);
}

/**
 * @param {import("@solana/web3.js").Connection} connection
 * @param {string} poolAddress
 * @param {number} limit
 */
async function fetchOutboundTransfers(connection, poolAddress, limit) {
  const poolPk = new PublicKey(poolAddress);
  const sigs = await connection.getSignaturesForAddress(poolPk, { limit });
  /** @type {Array<{ signature: string; to: string; lamports: number; slot: number; blockTime: number | null }>} */
  const outbound = [];

  for (const row of sigs) {
    if (row.err) continue;
    const tx = await connection.getParsedTransaction(row.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx?.meta || tx.meta.err) continue;

    const keys = tx.transaction.message.accountKeys.map((k) =>
      typeof k === "string" ? k : k.pubkey.toBase58(),
    );
    const poolIndex = keys.findIndex((k) => k === poolAddress);
    if (poolIndex < 0) continue;

    const pre = BigInt(tx.meta.preBalances[poolIndex] ?? 0);
    const post = BigInt(tx.meta.postBalances[poolIndex] ?? 0);
    if (post >= pre) continue; // inbound or fee-only

    // Attribute each recipient that gained SOL in this tx
    for (let i = 0; i < keys.length; i++) {
      if (i === poolIndex) continue;
      const recvPre = BigInt(tx.meta.preBalances[i] ?? 0);
      const recvPost = BigInt(tx.meta.postBalances[i] ?? 0);
      const gained = recvPost - recvPre;
      if (gained <= 0n) continue;
      outbound.push({
        signature: row.signature,
        to: keys[i],
        lamports: Number(gained),
        slot: row.slot,
        blockTime: row.blockTime ?? null,
      });
    }
  }

  return outbound;
}

async function main() {
  const limit = Math.min(Math.max(Number(argValue("limit", "300")) || 300, 50), 1000);

  const ok = await connectMongoose({ required: true });
  if (!ok) {
    console.error("Failed to connect to MongoDB");
    process.exit(1);
  }

  const poolAddress = getPoolWalletAddress();
  console.log(`Pool wallet: ${poolAddress}`);
  console.log(`Configured key: ${isPoolWalletConfigured() ? "yes" : "no (address-only mode)"}`);

  const rpcCandidates = getSolanaRpcUrlCandidates();
  const connection = createSolanaConnection(rpcCandidates[0]);
  console.log(`Fetching up to ${limit} recent signatures…`);

  const outbound = await fetchOutboundTransfers(connection, poolAddress, limit);
  console.log(`Outbound SOL credit legs found: ${outbound.length}`);

  const [payouts, campaigns] = await Promise.all([
    KolPayout.find({ txSignature: { $ne: null } })
      .select("campaignId submissionId kolWallet lamports txSignature status")
      .lean(),
    KolCampaign.find({
      $or: [
        { platformFeeTxSignature: { $ne: null } },
        { creatorRefundTxSignature: { $ne: null } },
      ],
    })
      .select(
        "_id title projectWallet platformFeeTxSignature platformFeeLamports creatorRefundTxSignature creatorRefundLamports status",
      )
      .lean(),
  ]);

  /** @type {Map<string, Array<{ kind: string; campaignId?: string; lamports?: number; status?: string }>>} */
  const dbBySig = new Map();
  for (const p of payouts) {
    const sig = String(p.txSignature || "").trim();
    if (!sig) continue;
    if (!dbBySig.has(sig)) dbBySig.set(sig, []);
    dbBySig.get(sig).push({
      kind: "kol_payout",
      campaignId: String(p.campaignId),
      lamports: p.lamports,
      status: p.status,
    });
  }
  for (const c of campaigns) {
    if (c.platformFeeTxSignature) {
      const sig = String(c.platformFeeTxSignature).trim();
      if (!dbBySig.has(sig)) dbBySig.set(sig, []);
      dbBySig.get(sig).push({
        kind: "platform_fee",
        campaignId: String(c._id),
        lamports: c.platformFeeLamports ?? undefined,
      });
    }
    if (c.creatorRefundTxSignature) {
      const sig = String(c.creatorRefundTxSignature).trim();
      if (!dbBySig.has(sig)) dbBySig.set(sig, []);
      dbBySig.get(sig).push({
        kind: "creator_refund",
        campaignId: String(c._id),
        lamports: c.creatorRefundLamports ?? undefined,
      });
    }
  }

  /** @type {Map<string, { to: string; count: number; lamports: number; signatures: string[] }>} */
  const byRecipient = new Map();
  let unmatchedOnChain = 0;
  let matched = 0;

  for (const leg of outbound) {
    const key = leg.to;
    if (!byRecipient.has(key)) {
      byRecipient.set(key, { to: key, count: 0, lamports: 0, signatures: [] });
    }
    const agg = byRecipient.get(key);
    agg.count += 1;
    agg.lamports += leg.lamports;
    agg.signatures.push(leg.signature);

    if (dbBySig.has(leg.signature)) {
      matched += 1;
    } else {
      unmatchedOnChain += 1;
    }
  }

  /** Recipients with >1 outbound transfer (possible doubles) */
  const multiPay = [...byRecipient.values()]
    .filter((r) => r.count > 1)
    .sort((a, b) => b.lamports - a.lamports);

  /** Confirmed payouts sharing same campaign+submission should be unique — flag DB anomalies */
  const payoutKeyCounts = new Map();
  for (const p of payouts) {
    const k = `${p.campaignId}:${p.submissionId}`;
    payoutKeyCounts.set(k, (payoutKeyCounts.get(k) || 0) + 1);
  }
  const duplicateDbRows = [...payoutKeyCounts.entries()].filter(([, n]) => n > 1);

  console.log("\n=== Summary ===");
  console.log(`DB payout rows with txSignature: ${payouts.length}`);
  console.log(`On-chain legs matched to DB sig: ${matched}`);
  console.log(`On-chain legs with no DB sig:    ${unmatchedOnChain}`);
  console.log(`Recipients with >1 outbound leg: ${multiPay.length}`);
  console.log(`Duplicate DB payout keys:        ${duplicateDbRows.length}`);

  if (multiPay.length) {
    console.log("\n=== Possible double-pays (recipient received multiple outbound legs) ===");
    for (const row of multiPay.slice(0, 40)) {
      console.log(
        `  ${row.to}  x${row.count}  ${row.lamports / LAMPORTS_PER_SOL} SOL`,
      );
      for (const sig of row.signatures) {
        const db = dbBySig.get(sig);
        console.log(
          `    ${sig}  ${db ? JSON.stringify(db) : "(no DB match)"}`,
        );
      }
    }
  }

  // Campaigns where fee or refund status is sending (stuck) or multiple confirmed-looking issues
  const stuck = await KolCampaign.find({
    $or: [
      { platformFeeStatus: "sending" },
      { creatorRefundStatus: "sending" },
      { status: "finalizing" },
    ],
  })
    .select("_id title status platformFeeStatus creatorRefundStatus finalizeStartedAt")
    .lean();

  const stuckPayouts = await KolPayout.find({ status: "sending" })
    .select("campaignId submissionId kolWallet lamports txSignature")
    .lean();

  if (stuck.length || stuckPayouts.length) {
    console.log("\n=== In-flight / stuck states (needs chain resolve, do NOT re-send) ===");
    for (const c of stuck) {
      console.log(
        `  campaign ${c._id} status=${c.status} fee=${c.platformFeeStatus} refund=${c.creatorRefundStatus}`,
      );
    }
    for (const p of stuckPayouts) {
      console.log(
        `  payout campaign=${p.campaignId} submission=${p.submissionId} sig=${p.txSignature}`,
      );
    }
  }

  console.log("\nDone (read-only).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
