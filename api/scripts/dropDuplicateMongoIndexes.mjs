/**
 * Drop duplicate non-TTL `createdAt` indexes left over from schema changes.
 * Run once after deploy: node api/scripts/dropDuplicateMongoIndexes.mjs
 *
 * Only drops a plain createdAt index when a separate TTL createdAt index also exists.
 * Safe to re-run.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

const COLLECTIONS = ["apirequestlogs", "x402calllogs"];

/**
 * @param {import('mongodb').Db} db
 * @param {string} collection
 */
async function dropDuplicatePlainCreatedAt(db, collection) {
  let indexes;
  try {
    indexes = await db.collection(collection).indexes();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[skip] ${collection} — ${msg}`);
    return;
  }

  const createdAtIndexes = indexes.filter(
    (idx) =>
      idx.key &&
      Object.keys(idx.key).length === 1 &&
      idx.key.createdAt === 1,
  );

  if (createdAtIndexes.length <= 1) {
    console.log(`[skip] ${collection} — no duplicate createdAt indexes`);
    return;
  }

  const ttlIndexes = createdAtIndexes.filter((idx) => idx.expireAfterSeconds != null);
  const plainIndexes = createdAtIndexes.filter((idx) => idx.expireAfterSeconds == null);

  if (ttlIndexes.length === 0 || plainIndexes.length === 0) {
    console.log(`[skip] ${collection} — cannot identify plain vs TTL createdAt pair`);
    return;
  }

  for (const idx of plainIndexes) {
    const name = idx.name || "createdAt_1";
    try {
      await db.collection(collection).dropIndex(name);
      console.log(`[ok] dropped ${collection}.${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[warn] ${collection}.${name}: ${msg}`);
    }
  }
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
const db = mongoose.connection.getClient().db(process.env.DB_NAME || "syra");

for (const collection of COLLECTIONS) {
  await dropDuplicatePlainCreatedAt(db, collection);
}

await mongoose.disconnect();
console.log("Done.");
