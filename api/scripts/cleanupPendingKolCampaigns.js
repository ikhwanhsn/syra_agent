#!/usr/bin/env node
/**
 * Remove all KOL campaigns and top-ups stuck in pending_deposit.
 *
 *   cd api && node scripts/cleanupPendingKolCampaigns.js
 *   cd api && node scripts/cleanupPendingKolCampaigns.js --dry-run
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectMongoose from "../config/mongoose.js";
import KolCampaign from "../models/KolCampaign.js";
import KolCampaignTopUp from "../models/KolCampaignTopUp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const ok = await connectMongoose({ required: true });
  if (!ok) {
    console.error("Failed to connect to MongoDB");
    process.exit(1);
  }

  const pendingCampaigns = await KolCampaign.find({ status: "pending_deposit" })
    .select("_id title projectWallet createdAt")
    .lean();

  const pendingTopUps = await KolCampaignTopUp.find({ status: "pending_deposit" })
    .select("_id campaignId projectWallet createdAt")
    .lean();

  console.log(
    `Found ${pendingCampaigns.length} pending_deposit campaign(s) and ${pendingTopUps.length} pending_deposit top-up(s).`,
  );

  if (pendingCampaigns.length) {
    console.log("\nPending campaigns:");
    for (const row of pendingCampaigns) {
      console.log(
        `  - ${row._id} | ${row.title ?? "(no title)"} | ${row.projectWallet} | ${row.createdAt?.toISOString?.() ?? ""}`,
      );
    }
  }

  if (pendingTopUps.length) {
    console.log("\nPending top-ups:");
    for (const row of pendingTopUps) {
      console.log(
        `  - ${row._id} | campaign ${row.campaignId} | ${row.projectWallet} | ${row.createdAt?.toISOString?.() ?? ""}`,
      );
    }
  }

  if (dryRun) {
    console.log("\nDry run — no records deleted.");
    process.exit(0);
  }

  const topUpResult = await KolCampaignTopUp.deleteMany({
    status: "pending_deposit",
  });
  const campaignResult = await KolCampaign.deleteMany({
    status: "pending_deposit",
  });

  console.log(
    `\nDeleted ${campaignResult.deletedCount} campaign(s) and ${topUpResult.deletedCount} top-up(s).`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
