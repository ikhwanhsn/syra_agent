import ShipLogStudioState from "../models/ShipLogStudioState.js";
import { isMongooseConnected } from "../config/mongoose.js";

const SINGLETON_ID = "singleton";

function normalizePostedOnX(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const n = Number.parseInt(key, 10);
    if (Number.isFinite(n) && n > 0 && typeof value === "boolean") {
      out[String(n)] = value;
    }
  }
  return out;
}

function normalizeDeleted(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((n) => Number.isFinite(n) && n > 0))].sort((a, b) => a - b);
}

function toClientState(doc) {
  return {
    postedOnX: normalizePostedOnX(doc?.postedOnX),
    deleted: normalizeDeleted(doc?.deletedUpdateNumbers),
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("Database unavailable");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

export async function getShipLogStudioState() {
  assertMongo();
  let doc = await ShipLogStudioState.findById(SINGLETON_ID).lean();
  if (!doc) {
    doc = (
      await ShipLogStudioState.findByIdAndUpdate(
        SINGLETON_ID,
        { postedOnX: {}, deletedUpdateNumbers: [], updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
    ).toObject();
  }
  return { success: true, data: toClientState(doc) };
}

function isStateEmpty(state) {
  return (
    Object.keys(state.postedOnX || {}).length === 0 &&
    (!Array.isArray(state.deleted) || state.deleted.length === 0)
  );
}

export async function migrateShipLogStudioState({ postedOnX, deleted }) {
  assertMongo();
  const existing = await ShipLogStudioState.findById(SINGLETON_ID).lean();
  const current = toClientState(existing);
  if (!isStateEmpty(current)) {
    return { success: true, data: current, migrated: false };
  }

  const nextPosted = normalizePostedOnX(postedOnX);
  const nextDeleted = normalizeDeleted(deleted);
  const doc = await ShipLogStudioState.findByIdAndUpdate(
    SINGLETON_ID,
    {
      postedOnX: nextPosted,
      deletedUpdateNumbers: nextDeleted,
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return { success: true, data: toClientState(doc), migrated: true };
}

export async function setShipLogUpdatePosted(updateNumber, posted) {
  assertMongo();
  const n = Number.parseInt(String(updateNumber), 10);
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error("Invalid updateNumber");
    err.code = "invalid_update_number";
    throw err;
  }
  if (typeof posted !== "boolean") {
    const err = new Error("posted must be a boolean");
    err.code = "invalid_posted";
    throw err;
  }

  const doc = await ShipLogStudioState.findByIdAndUpdate(
    SINGLETON_ID,
    {
      $set: {
        [`postedOnX.${n}`]: posted,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return { success: true, data: toClientState(doc) };
}

export async function deleteShipLogUpdates(updateNumbers) {
  assertMongo();
  const nums = normalizeDeleted(updateNumbers);
  if (nums.length === 0) {
    const err = new Error("updateNumbers required");
    err.code = "invalid_update_numbers";
    throw err;
  }

  const doc = await ShipLogStudioState.findByIdAndUpdate(
    SINGLETON_ID,
    {
      $addToSet: { deletedUpdateNumbers: { $each: nums } },
      $set: { updatedAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return { success: true, data: toClientState(doc), deleted: nums };
}
