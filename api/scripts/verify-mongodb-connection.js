#!/usr/bin/env node
/**
 * Verify MongoDB connectivity and print collection sizes (helps pre/post Flex migration).
 *
 *   cd api && node scripts/verify-mongodb-connection.js
 *   cd api && MONGODB_URI="mongodb+srv://..." node scripts/verify-mongodb-connection.js
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || "syra";
  const ok = await connectMongoose({ required: true });
  if (!ok) {
    console.error("Failed to connect to MongoDB");
    process.exit(1);
  }

  const db = mongoose.connection.getClient().db(dbName);
  const host = mongoose.connection.host ?? "unknown";

  console.log(`Connected: host=${host} db=${dbName}`);

  const stats = await db.stats();
  console.log(`\nDatabase size: ${formatBytes(stats.dataSize)} (storage: ${formatBytes(stats.storageSize)})`);
  console.log(`Collections: ${stats.collections}, indexes: ${stats.indexes}`);

  const collections = await db.listCollections().toArray();
  /** @type {{ name: string; docs: number | string; dataSize: number }[]} */
  const rows = [];

  const batchSize = 15;
  for (let i = 0; i < collections.length; i += batchSize) {
    const batch = collections.slice(i, i + batchSize);
    const batchRows = await Promise.all(
      batch.map(async (coll) => {
        try {
          const collStats = await db.command({ collStats: coll.name });
          return {
            name: coll.name,
            docs: collStats.count ?? 0,
            dataSize: collStats.size ?? 0,
          };
        } catch {
          return { name: coll.name, docs: "?", dataSize: 0 };
        }
      }),
    );
    rows.push(...batchRows);
  }

  rows.sort((a, b) => (b.dataSize ?? 0) - (a.dataSize ?? 0));

  console.log("\nTop collections by data size:");
  console.log("  Collection".padEnd(40), "Docs".padStart(10), "Data".padStart(12));
  console.log("  " + "-".repeat(64));
  for (const row of rows.slice(0, 20)) {
    console.log(
      `  ${row.name.padEnd(38)}`,
      String(row.docs).padStart(10),
      formatBytes(row.dataSize).padStart(12),
    );
  }

  const flexLimitBytes = 5 * 1024 * 1024 * 1024;
  const m0LimitBytes = 512 * 1024 * 1024;
  const totalData = stats.dataSize ?? 0;

  console.log("\nTier fit:");
  console.log(`  M0 Free (512 MB):  ${totalData <= m0LimitBytes ? "OK" : "OVER LIMIT"}`);
  console.log(`  Flex (5 GB):       ${totalData <= flexLimitBytes ? "OK" : "OVER LIMIT"}`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
