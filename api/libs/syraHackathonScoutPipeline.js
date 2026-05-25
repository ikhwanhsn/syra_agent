/**
 * Syra Hackathon Scout — 1× X search → LLM → save new leads → Telegram if any new.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import InternalHackathonLead from "../models/InternalHackathonLead.js";
import { runSyraHackathonScoutAgent } from "../agents/syra-hackathon-scout-agent.js";
import { fetchHackathonTweetsFromX } from "./syraHackathonScoutXFetch.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { formatHackathonScoutNewLeadsTelegram } from "./syraHackathonScoutDigests.js";
import { SYRA_HACKATHON_SCOUT_DB_ID } from "../config/syraHackathonScoutConfig.js";

export { SYRA_HACKATHON_SCOUT_DB_ID };

/**
 * @typedef {{
 *   ranAt: string;
 *   query: string;
 *   tweetsSampled: number;
 *   extracted: number;
 *   newSaved: number;
 *   fromCache: boolean;
 *   xConfigured: boolean;
 * }} HackathonScoutRunMeta
 */

/**
 * @returns {Promise<{ success: true; data: HackathonScoutRunMeta; newLeads: object[] }>}
 */
export async function runSyraHackathonScoutPipeline() {
  const ranAt = new Date().toISOString();
  const { query, tweets, fromCache, xConfigured } = await fetchHackathonTweetsFromX();

  let extracted = [];
  if (tweets.length > 0) {
    extracted = await runSyraHackathonScoutAgent({ tweets, model: null });
  }

  /** @type {object[]} */
  const newLeads = [];
  for (const h of extracted) {
    const existing = await InternalHackathonLead.findOne({ tweetId: h.tweetId }).lean();
    if (existing) continue;

    const tweet = tweets.find((t) => t.id === h.tweetId);
    const doc = await InternalHackathonLead.create({
      tweetId: h.tweetId,
      status: "new",
      title: h.title,
      organizer: h.organizer,
      description: h.description,
      relevanceScore: h.relevanceScore,
      relevanceReason: h.relevanceReason,
      tags: h.tags,
      deadline: h.deadline,
      prizePool: h.prizePool,
      applicationUrl: h.applicationUrl,
      tweetUrl: tweet?.url || `https://x.com/i/web/status/${h.tweetId}`,
      tweetText: tweet?.text?.slice(0, 2000) || "",
      authorHandle: tweet?.authorHandle || "",
      sourceQuery: query,
      discoveredAt: new Date(),
      statusUpdatedAt: new Date(),
    });
    newLeads.push(doc.toObject ? doc.toObject() : doc);
  }

  const meta = {
    ranAt,
    query,
    tweetsSampled: tweets.length,
    extracted: extracted.length,
    newSaved: newLeads.length,
    fromCache,
    xConfigured,
  };

  if (newLeads.length > 0 && isDevTelegramConfigured()) {
    await sendDevTelegram(
      formatHackathonScoutNewLeadsTelegram(
        newLeads.map((l) => ({
          title: l.title,
          organizer: l.organizer,
          relevanceScore: l.relevanceScore,
          tweetUrl: l.tweetUrl,
        })),
        { query, newCount: newLeads.length, fromCache },
      ),
      { disableWebPagePreview: true },
    );
  }

  await DashboardResearch.findOneAndUpdate(
    { id: SYRA_HACKATHON_SCOUT_DB_ID },
    { id: SYRA_HACKATHON_SCOUT_DB_ID, payload: meta, savedAt: new Date() },
    { upsert: true, new: true },
  );

  return { success: true, data: meta, newLeads };
}

/**
 * @param {{ status?: string; limit?: number; skip?: number }} [opts]
 */
export async function listHackathonLeads(opts = {}) {
  const filter = {};
  if (opts.status && opts.status !== "all") {
    filter.status = opts.status;
  }
  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 50));
  const skip = Math.max(0, Number(opts.skip) || 0);

  const [items, total] = await Promise.all([
    InternalHackathonLead.find(filter).sort({ discoveredAt: -1 }).skip(skip).limit(limit).lean(),
    InternalHackathonLead.countDocuments(filter),
  ]);

  return { items, total };
}

/**
 * @param {string} id Mongo _id
 * @param {{ status?: string; notes?: string }} patch
 */
export async function updateHackathonLead(id, patch) {
  const update = { statusUpdatedAt: new Date() };
  if (patch.status) update.status = patch.status;
  if (typeof patch.notes === "string") update.notes = patch.notes.slice(0, 4000);

  const doc = await InternalHackathonLead.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!doc) return null;
  return doc;
}

/**
 * @returns {Promise<Record<string, number>>}
 */
export async function hackathonLeadStatusCounts() {
  const rows = await InternalHackathonLead.aggregate([
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
