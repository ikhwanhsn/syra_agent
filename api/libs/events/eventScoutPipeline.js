/**
 * Event Scout pipeline — Web + X + Luma → dedupe → MongoDB upsert.
 */

import DashboardResearch from "../../models/DashboardResearch.js";
import Event from "../../models/Event.js";
import { EVENT_SCOUT_DB_ID } from "../../config/eventScoutConfig.js";
import { eventDedupeKey, normalizeLumaUrl } from "../internalScoutDedupe.js";
import { isDevTelegramConfigured, sendDevTelegram } from "../devTelegramNotifier.js";
import { runEventExtractAgent } from "../../agents/event-extract-agent.js";
import { fetchWebEventHits } from "./webEventSource.js";
import { fetchXEventHits } from "./xEventSource.js";
import { fetchLumaEvents } from "./lumaEventSource.js";
import { applyEventFreshness, upcomingEventFilter } from "../discoveryFreshness.js";

export { EVENT_SCOUT_DB_ID };

/**
 * @returns {Promise<{ keys: Set<string>; brief: { title: string; lumaUrl?: string }[] }>}
 */
async function loadDedupeIndex() {
  const rows = await Event.find({})
    .select("dedupeKey title lumaUrl")
    .sort({ discoveredAt: -1 })
    .limit(1000)
    .lean();

  const keys = new Set();
  /** @type {{ title: string; lumaUrl?: string }[]} */
  const brief = [];

  for (const row of rows) {
    if (row.dedupeKey) keys.add(row.dedupeKey);
    const alt = eventDedupeKey(row);
    if (alt) keys.add(alt);
    if (brief.length < 80 && row.title) {
      brief.push({
        title: String(row.title).slice(0, 120),
        lumaUrl: row.lumaUrl ? String(row.lumaUrl) : undefined,
      });
    }
  }

  return { keys, brief };
}

/**
 * @param {{ title?: string; lumaUrl?: string | null; dedupeKey?: string }} rec
 * @param {Set<string>} keys
 * @returns {boolean}
 */
function isKnownRecord(rec, keys) {
  if (rec.dedupeKey && keys.has(rec.dedupeKey)) return true;
  const alt = eventDedupeKey(rec);
  return Boolean(alt && keys.has(alt));
}

/**
 * @param {import("./eventUtils.js").EventRecord} rec
 * @param {Set<string>} keys
 */
function registerKey(rec, keys) {
  if (rec.dedupeKey) keys.add(rec.dedupeKey);
  const alt = eventDedupeKey(rec);
  if (alt) keys.add(alt);
}

/**
 * @param {import("./eventUtils.js").EventRecord} rec
 * @param {Set<string>} keys
 * @returns {Promise<"new" | "updated" | "skipped">}
 */
async function upsertEventRecord(rec, keys) {
  const lumaUrl = normalizeLumaUrl(rec.lumaUrl);
  if (!lumaUrl) return "skipped";

  rec.lumaUrl = lumaUrl;
  rec.url = rec.url ? normalizeLumaUrl(rec.url) || lumaUrl : lumaUrl;
  if (!rec.dedupeKey) rec.dedupeKey = eventDedupeKey(rec);

  let existing = await Event.findOne({ dedupeKey: rec.dedupeKey }).lean();

  if (!existing && isKnownRecord(rec, keys)) {
    existing = await Event.findOne({ lumaUrl }).lean();
  }

  if (existing) {
    await Event.updateOne(
      { _id: existing._id },
      {
        $set: {
          title: rec.title || existing.title,
          organizer: rec.organizer || existing.organizer,
          description: rec.description || existing.description,
          category: rec.category || existing.category,
          location: rec.location || existing.location,
          locationType: rec.locationType || existing.locationType,
          startAt: rec.startAt || existing.startAt,
          endAt: rec.endAt || existing.endAt,
          dateText: rec.dateText || existing.dateText,
          thumbnailUrl: rec.thumbnailUrl || existing.thumbnailUrl,
          relevanceScore: rec.relevanceScore ?? existing.relevanceScore,
          relevanceReason: rec.relevanceReason || existing.relevanceReason,
          lastSeenAt: new Date(),
          ...(rec.isIndonesia ? { isIndonesia: true } : {}),
          ...(rec.isOnline ? { isOnline: true } : {}),
        },
      },
    );
    registerKey(rec, keys);
    return "updated";
  }

  registerKey(rec, keys);
  await Event.create({
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
 * @returns {Promise<{ success: true; data: object; newEvents: object[] }>}
 */
export async function runEventScoutPipeline() {
  const ranAt = new Date().toISOString();
  const dedupe = await loadDedupeIndex();
  /** @type {string[]} */
  const errors = [];
  /** @type {object[]} */
  const newEvents = [];

  const stats = {
    web: { webConfigured: false, queriesRun: 0, hitsSampled: 0, extracted: 0, newSaved: 0, updated: 0, skipped: 0 },
    x: { xConfigured: false, queriesRun: 0, tweetsSampled: 0, hitsSampled: 0, extracted: 0, newSaved: 0, updated: 0, skipped: 0 },
    luma: { urlsRequested: 0, parsed: 0, failed: 0, newSaved: 0, updated: 0, skipped: 0 },
    totalNew: 0,
    totalUpdated: 0,
    errors,
  };

  const [webResult, xResult] = await Promise.allSettled([
    fetchWebEventHits(),
    fetchXEventHits(),
  ]);

  /** @type {import("../../agents/event-extract-agent.js").EventSearchHit[]} */
  let allHits = [];

  if (webResult.status === "fulfilled") {
    Object.assign(stats.web, webResult.value.meta);
    allHits = allHits.concat(webResult.value.hits);
  } else {
    errors.push(`web: ${webResult.reason instanceof Error ? webResult.reason.message : String(webResult.reason)}`);
  }

  if (xResult.status === "fulfilled") {
    Object.assign(stats.x, xResult.value.meta);
    allHits = allHits.concat(xResult.value.hits);
  } else {
    errors.push(`x: ${xResult.reason instanceof Error ? xResult.reason.message : String(xResult.reason)}`);
  }

  const lumaUrls = [
    ...new Set(
      allHits.flatMap((h) => h.lumaUrls || []).map(normalizeLumaUrl).filter(Boolean),
    ),
  ];

  let extractedRecords = [];
  try {
    extractedRecords = await runEventExtractAgent({
      hits: allHits,
      knownEvents: dedupe.brief,
    });
    stats.web.extracted = extractedRecords.filter((r) => r.source === "web").length;
    stats.x.extracted = extractedRecords.filter((r) => r.source === "x").length;
  } catch (e) {
    errors.push(`extract: ${e instanceof Error ? e.message : String(e)}`);
  }

  let lumaRecords = [];
  try {
    const lumaOut = await fetchLumaEvents({ urls: lumaUrls });
    Object.assign(stats.luma, lumaOut.meta);
    lumaRecords = lumaOut.records;
  } catch (e) {
    errors.push(`luma: ${e instanceof Error ? e.message : String(e)}`);
  }

  const allRecords = [...extractedRecords, ...lumaRecords];
  const runKeys = new Set();
  const webBucket = { newSaved: 0, updated: 0, skipped: 0 };
  const xBucket = { newSaved: 0, updated: 0, skipped: 0 };
  const lumaBucket = { newSaved: 0, updated: 0, skipped: 0 };

  for (const rec of allRecords) {
    if (!rec.dedupeKey) rec.dedupeKey = eventDedupeKey(rec);
    if (!rec.dedupeKey || runKeys.has(rec.dedupeKey)) continue;
    runKeys.add(rec.dedupeKey);

    const bucket = rec.source === "x" ? xBucket : rec.source === "luma" ? lumaBucket : webBucket;

    try {
      const outcome = await upsertEventRecord(rec, dedupe.keys);
      if (outcome === "new") {
        bucket.newSaved += 1;
        stats.totalNew += 1;
        const doc = await Event.findOne({ dedupeKey: rec.dedupeKey }).lean();
        if (doc) newEvents.push(doc);
      } else if (outcome === "updated") {
        bucket.updated += 1;
        stats.totalUpdated += 1;
      } else {
        bucket.skipped += 1;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate key") || msg.includes("E11000")) {
        bucket.skipped += 1;
      } else {
        errors.push(`upsert(${rec.title}): ${msg}`);
      }
    }
  }

  Object.assign(stats.web, webBucket);
  Object.assign(stats.x, xBucket);
  Object.assign(stats.luma, lumaBucket);

  const meta = { ranAt, ...stats };

  if (newEvents.length > 0 && isDevTelegramConfigured()) {
    const lines = newEvents.slice(0, 5).map((e) => `• ${e.title} (${e.organizer || "?"})`);
    await sendDevTelegram(
      `Syra · Event Scout — ${newEvents.length} new\n${lines.join("\n")}`,
      { disableWebPagePreview: true },
    );
  }

  await DashboardResearch.findOneAndUpdate(
    { id: EVENT_SCOUT_DB_ID },
    { id: EVENT_SCOUT_DB_ID, payload: meta, savedAt: new Date() },
    { upsert: true, new: true },
  );

  return { success: true, data: meta, newEvents };
}

/**
 * @param {{ status?: string; region?: string; source?: string; category?: string; search?: string; limit?: number; skip?: number; freshOnly?: boolean }} [opts]
 */
export async function listEvents(opts = {}) {
  let filter = {};

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
  if (opts.category && opts.category !== "all") {
    filter.category = opts.category;
  }
  if (opts.search && typeof opts.search === "string" && opts.search.trim()) {
    const q = opts.search.trim();
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { organizer: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { themes: { $elemMatch: { $regex: q, $options: "i" } } },
    ];
  }

  filter = applyEventFreshness(filter, { freshOnly: opts.freshOnly !== false });

  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 50));
  const skip = Math.max(0, Number(opts.skip) || 0);

  const [items, total] = await Promise.all([
    Event.find(filter).sort({ startAt: 1, discoveredAt: -1 }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  return { items, total };
}

/**
 * @param {string} id
 * @param {{ status?: string; notes?: string }} patch
 */
export async function updateEvent(id, patch) {
  const update = { statusUpdatedAt: new Date() };
  if (patch.status) update.status = patch.status;
  if (typeof patch.notes === "string") update.notes = patch.notes.slice(0, 4000);

  const doc = await Event.findByIdAndUpdate(id, update, { new: true }).lean();
  return doc;
}

/**
 * @returns {Promise<Record<string, number>>}
 */
export async function eventStatusCounts() {
  const rows = await Event.aggregate([
    { $match: upcomingEventFilter() },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  /** @type {Record<string, number>} */
  const out = { all: 0 };
  for (const r of rows) {
    out[r._id] = r.count;
    out.all += r.count;
  }
  return out;
}
