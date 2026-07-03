#!/usr/bin/env node
/**
 * Copy all collections from source MongoDB (M10) to target (Flex).
 *
 *   cd api
 *   $env:MONGODB_URI_SOURCE = "<old M10 URI>"
 *   $env:MONGODB_URI_TARGET = "<new Flex URI>"   # or use MONGODB_URI
 *   node scripts/migrate-mongodb-to-flex.js
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DEFAULT_BATCH_SIZE = Number(process.env.MIGRATE_BATCH_SIZE) || 2000;

/** Collections with large Mixed payloads — chunked copy + field exclusion. */
const SMALL_BATCH_COLLECTIONS = new Set([
  "lpexperimentruns",
  "tradingexperimentruns",
  "agentchats",
  "btcintelligencesnapshots",
  "dashboardresearches",
]);

/** Fields to exclude when copying (large, unused at runtime). */
const COPY_PROJECTION = {
  lpexperimentruns: { signalSnapshot: 0 },
};

const CHUNKED_THRESHOLD = 500;

const CLIENT_OPTIONS = {
  serverSelectionTimeoutMS: 60_000,
  connectTimeoutMS: 60_000,
  socketTimeoutMS: 0,
  heartbeatFrequencyMS: 10_000,
  maxPoolSize: 10,
};

const SKIP_COLLECTIONS = new Set(
  (process.env.MIGRATE_SKIP_COLLECTIONS ??
    "apirequestlogs,x402calllogs,paidapicalls,btc3_system_logs")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

const RESUME = process.argv.includes("--resume");

function maskUri(uri) {
  return uri.replace(/:([^:@/]+)@/, ":****@");
}

async function copyIndexes(sourceColl, targetColl) {
  const indexes = await sourceColl.indexes();
  for (const idx of indexes) {
    if (idx.name === "_id_") continue;
    const { key, ...raw } = idx;
    const options = { ...raw };
    delete options.v;
    delete options.ns;
    try {
      await targetColl.createIndex(key, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`    index ${idx.name} skipped: ${msg}`);
    }
  }
}

async function insertBatch(targetColl, batch, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await targetColl.insertMany(batch, { ordered: false });
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = attempt * 2000;
      console.warn(`\n    insert retry ${attempt}/${retries} in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function migrateCollectionChunked(sourceUri, targetUri, dbName, name, total, batchSize) {
  const projection = COPY_PROJECTION[name] ?? undefined;
  let lastId = null;
  let copied = 0;
  const targetCollName = name;

  while (copied < total) {
    const sourceClient = new MongoClient(sourceUri, CLIENT_OPTIONS);
    const targetClient = new MongoClient(targetUri, CLIENT_OPTIONS);
    await sourceClient.connect();
    await targetClient.connect();

    const sourceColl = sourceClient.db(dbName).collection(name);
    const targetColl = targetClient.db(dbName).collection(targetCollName);

    const query = lastId ? { _id: { $gt: lastId } } : {};
    const docs = await sourceColl
      .find(query, projection ? { projection } : {})
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();

    if (docs.length === 0) break;

    await insertBatch(targetColl, docs);
    copied += docs.length;
    lastId = docs[docs.length - 1]._id;

    await sourceClient.close();
    await targetClient.close();

    process.stdout.write(`\r  ${name}: ${copied}/${total}`);
    if (docs.length < batchSize) break;
  }

  console.log(`\r  ${name}: ${copied}/${total} — done`);
  return { name, copied };
}

async function migrateCollection(sourceDb, targetDb, name, sourceUri, targetUri, dbName) {
  const sourceColl = sourceDb.collection(name);
  const total = await sourceColl.estimatedDocumentCount();
  const batchSize = SMALL_BATCH_COLLECTIONS.has(name) ? 50 : DEFAULT_BATCH_SIZE;
  const useChunked = total >= CHUNKED_THRESHOLD && SMALL_BATCH_COLLECTIONS.has(name);

  if (SKIP_COLLECTIONS.has(name)) {
    console.log(`  ${name}: skipped (${total} docs — log/telemetry, has TTL)`);
    return { name, copied: 0, skipped: true };
  }

  if (RESUME) {
    const targetCount = await targetDb.collection(name).estimatedDocumentCount().catch(() => 0);
    if (targetCount === total) {
      console.log(`  ${name}: already migrated (${total} docs)`);
      return { name, copied: total, resumed: true };
    }
    if (targetCount > 0 && targetCount < total) {
      console.log(`  ${name}: partial (${targetCount}/${total}) — re-copying`);
    }
  }

  process.stdout.write(`  ${name}: ${total} docs`);

  try {
    await targetDb.collection(name).drop();
  } catch {
    /* collection may not exist */
  }

  if (useChunked) {
    process.stdout.write(`  ${name}: ${total} docs (chunked)`);
    const result = await migrateCollectionChunked(sourceUri, targetUri, dbName, name, total, batchSize);
    const targetColl = targetDb.collection(name);
    await copyIndexes(sourceColl, targetColl);
    return result;
  }

  if (total === 0) {
    await targetDb.createCollection(name);
    console.log(" — empty");
    await copyIndexes(sourceColl, targetDb.collection(name));
    return { name, copied: 0 };
  }

  const targetColl = targetDb.collection(name);
  let copied = 0;
  let batch = [];

  const cursor = sourceColl.find({}, COPY_PROJECTION[name] ? { projection: COPY_PROJECTION[name] } : {});
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= batchSize) {
      await insertBatch(targetColl, batch);
      copied += batch.length;
      batch = [];
      process.stdout.write(`\r  ${name}: ${copied}/${total}`);
    }
  }

  if (batch.length > 0) {
    await insertBatch(targetColl, batch);
    copied += batch.length;
  }

  console.log(`\r  ${name}: ${copied}/${total} — done`);
  await copyIndexes(sourceColl, targetColl);
  return { name, copied };
}

async function main() {
  const sourceUri = process.env.MONGODB_URI_SOURCE?.trim();
  const targetUri =
    process.env.MONGODB_URI_TARGET?.trim() || process.env.MONGODB_URI?.trim();
  const dbName = process.env.DB_NAME || "syra";

  if (!sourceUri) {
    console.error("Missing MONGODB_URI_SOURCE (old M10 cluster URI)");
    process.exit(1);
  }
  if (!targetUri) {
    console.error("Missing MONGODB_URI_TARGET or MONGODB_URI (new Flex cluster URI)");
    process.exit(1);
  }
  if (sourceUri === targetUri) {
    console.error("Source and target URIs are identical — aborting.");
    process.exit(1);
  }

  console.log("Source:", maskUri(sourceUri));
  console.log("Target:", maskUri(targetUri));
  console.log("Database:", dbName);
  if (RESUME) console.log("Mode: resume (skip complete collections)");
  if (SKIP_COLLECTIONS.size > 0) {
    console.log("Skipping:", [...SKIP_COLLECTIONS].join(", "));
  }
  console.log("");

  const sourceClient = new MongoClient(sourceUri, CLIENT_OPTIONS);
  const targetClient = new MongoClient(targetUri, CLIENT_OPTIONS);

  await sourceClient.connect();
  await targetClient.connect();
  console.log("Connected to both clusters.\n");

  const sourceDb = sourceClient.db(dbName);
  const targetDb = targetClient.db(dbName);

  // Flex clusters sometimes get an empty default DB with different casing (e.g. Syra vs syra).
  const admin = targetClient.db().admin();
  const { databases } = await admin.listDatabases();
  for (const db of databases) {
    if (db.name.toLowerCase() === dbName.toLowerCase() && db.name !== dbName) {
      console.log(`Dropping conflicting target database "${db.name}" (case mismatch with "${dbName}")`);
      await targetClient.db(db.name).dropDatabase();
    }
  }

  const collections = await sourceDb.listCollections().toArray();
  const names = collections
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."))
    .sort();

  console.log(`Migrating ${names.length} collections...\n`);

  const results = [];
  for (const name of names) {
    results.push(await migrateCollection(sourceDb, targetDb, name, sourceUri, targetUri, dbName));
  }

  const totalCopied = results.reduce((sum, r) => sum + (r.copied ?? 0), 0);
  const skipped = results.filter((r) => r.skipped).length;
  const resumed = results.filter((r) => r.resumed).length;
  console.log(
    `\nMigration complete: ${totalCopied} documents, ${resumed} resumed, ${skipped} skipped, ${results.length} collections total.`,
  );

  await sourceClient.close();
  await targetClient.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("\nMigration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
