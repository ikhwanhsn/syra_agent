/**
 * One-shot: clamp public Earn LpRealConfig.maxConcurrentPositions to 3.
 * Usage: node api/scripts/heal-earn-max-concurrent.js [agentAddress]
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const EARN_MAX = 3;
const targetAgent = process.argv[2] || "p6AkUCvR5CXoQJVgkSffLNNXNdV8xpP7x3EzMApnxTZ";

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI required");
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 45000, family: 4 });
  const names = (await mongoose.connection.db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => /lp.?real.?config/i.test(n) || n === "lprealconfigs");
  console.log("candidate collections", names);

  let healed = 0;
  for (const name of names.length ? names : ["lprealconfigs"]) {
    const col = mongoose.connection.db.collection(name);
    const doc = await col.findOne({ agentAddress: targetAgent });
    if (!doc) {
      // also try healing all publicEarnListed over-fragmented
      const res = await col.updateMany(
        { publicEarnListed: true, maxConcurrentPositions: { $gt: EARN_MAX } },
        { $set: { maxConcurrentPositions: EARN_MAX } },
      );
      console.log(name, "bulk heal matched", res.matchedCount, "modified", res.modifiedCount);
      healed += res.modifiedCount;
      continue;
    }
    console.log(
      "before",
      JSON.stringify({
        collection: name,
        enabled: doc.enabled,
        publicEarnListed: doc.publicEarnListed,
        maxConcurrentPositions: doc.maxConcurrentPositions,
        maxPositionSol: doc.maxPositionSol,
        lastError: doc.lastError,
        earnDepositSol: doc.earnDepositSol,
      }),
    );
    if (Number(doc.maxConcurrentPositions) > EARN_MAX) {
      const r = await col.updateOne(
        { agentAddress: targetAgent },
        { $set: { maxConcurrentPositions: EARN_MAX, lastError: null } },
      );
      console.log("healed", r.modifiedCount);
      healed += r.modifiedCount;
    } else {
      console.log("already <=", EARN_MAX);
    }
  }
  await mongoose.disconnect();
  console.log("done healed", healed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
