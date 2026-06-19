/**
 * Hackathon Scout pipeline — Devpost + Exa → dedupe → MongoDB upsert.
 */

import DashboardResearch from "../../models/DashboardResearch.js";
import Hackathon from "../../models/Hackathon.js";
import { HACKATHON_SCOUT_DB_ID } from "../../config/hackathonScoutConfig.js";
import { hackathonDedupeKey } from "../internalScoutDedupe.js";
import { isDevTelegramConfigured, sendDevTelegram } from "../devTelegramNotifier.js";
import { fetchDevpostHackathons } from "./devpostSource.js";
import { fetchExaHackathons } from "./exaSource.js";

export { HACKATHON_SCOUT_DB_ID };

/**
 * @returns {Promise<{ keys: Set<string>; brief: { title: string; organizer: string }[] }>}
 */
async function loadDedupeIndex() {
  const rows = await Hackathon.find({})
    .select("dedupeKey title organizer applicationUrl")
    .sort({ discoveredAt: -1 })
    .limit(1000)
    .lean();

  const keys = new Set();
  /** @type {{ title: string; organizer: string }[]} */
  const brief = [];

  for (const row of rows) {
    if (row.dedupeKey) keys.add(row.dedupeKey);
    const alt = hackathonDedupeKey(row);
    if (alt) keys.add(`title:${alt}`);
    if (brief.length < 80 && row.title) {
      brief.push({
        title: String(row.title).slice(0, 120),
        organizer: String(row.organizer || "").slice(0, 80),
      });
    }
  }

  return { keys, brief };
}

/**
 * @param {{ title?: string; organizer?: string; applicationUrl?: string | null; dedupeKey?: string }} rec
 * @param {Set<string>} keys
 * @returns {boolean}
 */
function isKnownRecord(rec, keys) {
  if (rec.dedupeKey && keys.has(rec.dedupeKey)) return true;
  const alt = hackathonDedupeKey(rec);
  return Boolean(alt && keys.has(`title:${alt}`));
}

/**
 * @param {import("./devpostSource.js").HackathonRecord} rec
 * @param {Set<string>} keys
 */
function registerKey(rec, keys) {
  if (rec.dedupeKey) keys.add(rec.dedupeKey);
  const alt = hackathonDedupeKey(rec);
  if (alt) keys.add(`title:${alt}`);
}

/**
 * @typedef {{
 *   ranAt: string;
 *   devpost: { globalFetched: number; indonesiaFetched: number; newSaved: number; updated: number; skipped: number };
 *   exa: { exaConfigured: boolean; queriesRun: number; hitsSampled: number; extracted: number; newSaved: number; updated: number; skipped: number };
 *   totalNew: number;
 *   totalUpdated: number;
 *   errors: string[];
 * }} HackathonScoutRunMeta
 */

/**
 * @param {import("./devpostSource.js").HackathonRecord} rec
 * @param {Set<string>} keys
 * @returns {Promise<"new" | "updated" | "skipped">}
 */
async function upsertHackathonRecord(rec, keys) {
  let existing = await Hackathon.findOne({ dedupeKey: rec.dedupeKey }).lean();

  if (!existing && isKnownRecord(rec, keys)) {
    const alt = hackathonDedupeKey(rec);
    if (alt) {
      const rows = await Hackathon.find({ title: rec.title }).limit(3).lean();
      existing = rows.find((row) => hackathonDedupeKey(row) === alt) || null;
    }
  }

  if (existing) {
    await Hackathon.updateOne(
      { _id: existing._id },
      {
        $set: {
          openState: rec.openState || existing.openState,
          deadline: rec.deadline || existing.deadline,
          submissionDates: rec.submissionDates || existing.submissionDates,
          registrationsCount: rec.registrationsCount ?? existing.registrationsCount,
          prizePool: rec.prizePool || existing.prizePool,
          prizeAmountUsd: rec.prizeAmountUsd ?? existing.prizeAmountUsd,
          thumbnailUrl: rec.thumbnailUrl || existing.thumbnailUrl,
          lastSeenAt: new Date(),
          ...(rec.isIndonesia ? { isIndonesia: true } : {}),
        },
      },
    );
    registerKey(rec, keys);
    return "updated";
  }

  registerKey(rec, keys);
  await Hackathon.create({
    ...rec,
    status: "new",
    notes: "",
    discoveredAt: new Date(),
    statusUpdatedAt: new Date(),
    lastSeenAt: new Date(),
  });
  return "new";
}

/**
 * @returns {Promise<{ success: true; data: HackathonScoutRunMeta; newHackathons: object[] }>}
 */
export async function runHackathonScoutPipeline() {
  const ranAt = new Date().toISOString();
  const dedupe = await loadDedupeIndex();
  /** @type {string[]} */
  const errors = [];
  /** @type {object[]} */
  const newHackathons = [];

  const stats = {
    devpost: { globalFetched: 0, indonesiaFetched: 0, newSaved: 0, updated: 0, skipped: 0 },
    exa: {
      exaConfigured: false,
      queriesRun: 0,
      hitsSampled: 0,
      extracted: 0,
      newSaved: 0,
      updated: 0,
      skipped: 0,
    },
    totalNew: 0,
    totalUpdated: 0,
    errors,
  };

  const [devpostResult, exaResult] = await Promise.allSettled([
    fetchDevpostHackathons(),
    fetchExaHackathons({ knownHackathons: dedupe.brief }),
  ]);

  /** @type {import("./devpostSource.js").HackathonRecord[]} */
  let allRecords = [];

  if (devpostResult.status === "fulfilled") {
    stats.devpost.globalFetched = devpostResult.value.meta.globalFetched;
    stats.devpost.indonesiaFetched = devpostResult.value.meta.indonesiaFetched;
    allRecords = allRecords.concat(devpostResult.value.records);
  } else {
    errors.push(`devpost: ${devpostResult.reason instanceof Error ? devpostResult.reason.message : String(devpostResult.reason)}`);
  }

  if (exaResult.status === "fulfilled") {
    Object.assign(stats.exa, exaResult.value.meta);
    allRecords = allRecords.concat(exaResult.value.records);
  } else {
    errors.push(`exa: ${exaResult.reason instanceof Error ? exaResult.reason.message : String(exaResult.reason)}`);
  }

  const runKeys = new Set();

  for (const rec of allRecords) {
    if (!rec.dedupeKey) {
      rec.dedupeKey = rec.source === "devpost" && rec.sourceId
        ? `devpost:${rec.sourceId}`
        : `exa:${hackathonDedupeKey(rec) || rec.sourceId || rec.url}`;
    }

    if (runKeys.has(rec.dedupeKey)) continue;
    runKeys.add(rec.dedupeKey);

    try {
      const outcome = await upsertHackathonRecord(rec, dedupe.keys);
      const bucket = rec.source === "devpost" ? stats.devpost : stats.exa;
      if (outcome === "new") {
        bucket.newSaved += 1;
        stats.totalNew += 1;
        const doc = await Hackathon.findOne({ dedupeKey: rec.dedupeKey }).lean();
        if (doc) newHackathons.push(doc);
      } else if (outcome === "updated") {
        bucket.updated += 1;
        stats.totalUpdated += 1;
      } else {
        bucket.skipped += 1;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate key") || msg.includes("E11000")) {
        const bucket = rec.source === "devpost" ? stats.devpost : stats.exa;
        bucket.skipped += 1;
      } else {
        errors.push(`upsert(${rec.title}): ${msg}`);
      }
    }
  }

  const meta = { ranAt, ...stats };

  if (newHackathons.length > 0 && isDevTelegramConfigured()) {
    const lines = newHackathons.slice(0, 5).map((h) => `• ${h.title} (${h.organizer || "?"})`);
    await sendDevTelegram(
      `Syra · Hackathon Scout — ${newHackathons.length} new\n${lines.join("\n")}`,
      { disableWebPagePreview: true },
    );
  }

  await DashboardResearch.findOneAndUpdate(
    { id: HACKATHON_SCOUT_DB_ID },
    { id: HACKATHON_SCOUT_DB_ID, payload: meta, savedAt: new Date() },
    { upsert: true, new: true },
  );

  return { success: true, data: meta, newHackathons };
}

/**
 * @param {{ status?: string; region?: string; source?: string; openState?: string; search?: string; limit?: number; skip?: number }} [opts]
 */
export async function listHackathons(opts = {}) {
  const filter = {};

  if (opts.status && opts.status !== "all") {
    filter.status = opts.status;
  }
  if (opts.region === "indonesia") {
    filter.isIndonesia = true;
  } else if (opts.region === "global") {
    filter.isIndonesia = false;
  }
  if (opts.source && opts.source !== "all") {
    filter.source = opts.source;
  }
  if (opts.openState && opts.openState !== "all") {
    filter.openState = opts.openState;
  }
  if (opts.search && typeof opts.search === "string" && opts.search.trim()) {
    const q = opts.search.trim();
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { organizer: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { themes: { $elemMatch: { $regex: q, $options: "i" } } },
    ];
  }

  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 50));
  const skip = Math.max(0, Number(opts.skip) || 0);

  const [items, total] = await Promise.all([
    Hackathon.find(filter).sort({ discoveredAt: -1 }).skip(skip).limit(limit).lean(),
    Hackathon.countDocuments(filter),
  ]);

  return { items, total };
}

/**
 * @param {string} id
 * @param {{ status?: string; notes?: string }} patch
 */
export async function updateHackathon(id, patch) {
  const update = { statusUpdatedAt: new Date() };
  if (patch.status) update.status = patch.status;
  if (typeof patch.notes === "string") update.notes = patch.notes.slice(0, 4000);

  const doc = await Hackathon.findByIdAndUpdate(id, update, { new: true }).lean();
  return doc;
}

/**
 * @returns {Promise<Record<string, number>>}
 */
export async function hackathonStatusCounts() {
  const rows = await Hackathon.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  /** @type {Record<string, number>} */
  const out = { all: 0 };
  for (const r of rows) {
    out[r._id] = r.count;
    out.all += r.count;
  }
  return out;
}
