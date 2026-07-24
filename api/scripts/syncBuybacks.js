/**
 * One-shot: scan treasury wallet for manual Jupiter USDC→$SYRA buys and record them.
 *
 * Usage (from api/):
 *   node scripts/syncBuybacks.js
 *   node scripts/syncBuybacks.js --limit=120
 *   node scripts/syncBuybacks.js --signature=<txSig>
 *   node scripts/syncBuybacks.js --signature=<txSig> --usd=25 --syra=350000
 *
 * Requires Mongo + AGENT_PRIVATE_KEY + SOLANA_RPC_URL (same as API).
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import {
  ingestBuybackSignature,
  syncOnchainBuybacks,
} from "../libs/buybackOnchainSync.js";

function argValue(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

async function main() {
  const ok = await connectMongoose();
  if (!ok) {
    console.error("MongoDB not connected");
    process.exit(1);
  }

  const signature = argValue("signature");
  if (signature) {
    const out = await ingestBuybackSignature({
      swapSignature: signature,
      buybackUsd: argValue("usd") != null ? Number(argValue("usd")) : undefined,
      outAmountHuman:
        argValue("syra") != null ? Number(argValue("syra")) : undefined,
    });
    console.log(JSON.stringify(out, null, 2));
    if (!out.success) process.exitCode = 1;
  } else {
    const limit = argValue("limit");
    const out = await syncOnchainBuybacks({
      ...(limit != null ? { limit: Number(limit) } : {}),
      requireUsdcSpend: true,
    });
    console.log(JSON.stringify(out, null, 2));
    if (!out.success) process.exitCode = 1;
  }

  await mongoose.connection.close().catch(() => {});
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
