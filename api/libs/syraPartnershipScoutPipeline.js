/**
 * Syra Partnership Scout — on-chain signals → LLM → persist new leads → Telegram + MongoDB.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import InternalPartnershipLead from "../models/InternalPartnershipLead.js";
import { runSyraPartnershipScoutAgent } from "../agents/syra-partnership-scout-agent.js";
import { collectOnchainPartnershipSignals } from "./onchainPartnershipSignals.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { formatSyraPartnershipScoutNewLeadsTelegram } from "./syraPartnershipScoutDigests.js";
import { SYRA_PARTNERSHIP_SCOUT_DB_ID } from "../config/syraPartnershipScoutConfig.js";
import {
  integrationDedupeKey,
  isKnownIntegration,
  isKnownPartnership,
  partnershipDedupeKey,
} from "./internalScoutDedupe.js";

export { SYRA_PARTNERSHIP_SCOUT_DB_ID };

/**
 * @returns {Promise<{ keys: Set<string>; brief: { name: string; projectType?: string }[] }>}
 */
async function loadPartnershipDedupeIndex() {
  const rows = await InternalPartnershipLead.find({})
    .select("dedupeKey name projectType kind")
    .sort({ discoveredAt: -1 })
    .limit(500)
    .lean();

  const keys = new Set(rows.map((r) => r.dedupeKey).filter(Boolean));
  /** @type {{ name: string; projectType?: string }[]} */
  const brief = [];
  for (const row of rows) {
    if (brief.length >= 80 || !row.name) continue;
    brief.push({
      name: String(row.name).slice(0, 100),
      projectType: row.projectType ? String(row.projectType).slice(0, 40) : undefined,
    });
  }
  return { keys, brief };
}

/**
 * @returns {Promise<{ success: true; data: object; newLeads: object[] }>}
 */
export async function runSyraPartnershipScoutPipeline() {
  const ranAt = new Date().toISOString();
  const dedupe = await loadPartnershipDedupeIndex();

  const { candidates, sourceStats, ecosystemNotes } = await collectOnchainPartnershipSignals();

  const freshCandidates = candidates.filter(
    (c) => !isKnownPartnership({ name: c.name, link: c.link ?? null }, dedupe.keys),
  );

  let skippedExisting = candidates.length - freshCandidates.length;

  const llmOut = await runSyraPartnershipScoutAgent({
    candidates: freshCandidates,
    ecosystemNotes,
    sourceStats: { ...sourceStats, candidatesTotal: candidates.length, candidatesFresh: freshCandidates.length },
    knownProjects: dedupe.brief,
    model: null,
  });

  /** @type {object[]} */
  const newLeads = [];

  for (const p of llmOut.partnershipTargets ?? []) {
    if (isKnownPartnership(p, dedupe.keys)) {
      skippedExisting += 1;
      await InternalPartnershipLead.updateOne(
        { dedupeKey: partnershipDedupeKey(p) },
        { $set: { lastSeenAt: new Date() } },
      ).catch(() => {});
      continue;
    }

    const key = partnershipDedupeKey(p);
    if (!key) continue;
    dedupe.keys.add(key);

    const doc = await InternalPartnershipLead.create({
      dedupeKey: key,
      kind: "target",
      status: "new",
      name: p.name,
      projectType: p.projectType,
      utility: p.utility,
      whyFitForSyra: p.whyFitForSyra,
      collaborationIdea: p.collaborationIdea,
      onchainSignals: p.onchainSignals ?? [],
      priority: p.priority,
      link: p.link ?? null,
      discoveredAt: new Date(),
      statusUpdatedAt: new Date(),
      lastSeenAt: new Date(),
    });
    newLeads.push(doc.toObject ? doc.toObject() : doc);
  }

  for (const idea of llmOut.quickIntegrations ?? []) {
    const text = String(idea || "").trim();
    if (!text) continue;
    if (isKnownIntegration(text, dedupe.keys)) {
      skippedExisting += 1;
      const iKey = integrationDedupeKey(text);
      if (iKey) {
        await InternalPartnershipLead.updateOne(
          { dedupeKey: iKey },
          { $set: { lastSeenAt: new Date() } },
        ).catch(() => {});
      }
      continue;
    }

    const key = integrationDedupeKey(text);
    if (!key) continue;
    dedupe.keys.add(key);

    const doc = await InternalPartnershipLead.create({
      dedupeKey: key,
      kind: "integration",
      status: "new",
      name: text.slice(0, 120),
      integrationText: text.slice(0, 2000),
      discoveredAt: new Date(),
      statusUpdatedAt: new Date(),
      lastSeenAt: new Date(),
    });
    newLeads.push(doc.toObject ? doc.toObject() : doc);
  }

  const meta = {
    ranAt,
    ecosystemSummary: llmOut.ecosystemSummary,
    onchainThemes: llmOut.onchainThemes,
    risksOrCaveats: llmOut.risksOrCaveats,
    generatedAt: llmOut.generatedAt,
    sourceStats: llmOut.sourceStats,
    candidatesScanned: candidates.length,
    candidatesFresh: freshCandidates.length,
    extractedTargets: llmOut.partnershipTargets?.length ?? 0,
    extractedIntegrations: llmOut.quickIntegrations?.length ?? 0,
    newSaved: newLeads.length,
    skippedExisting,
  };

  if (isDevTelegramConfigured()) {
    const body =
      newLeads.length > 0
        ? formatSyraPartnershipScoutNewLeadsTelegram(newLeads, meta)
        : [
            "Syra · Partnership Scout — no new leads",
            meta.skippedExisting != null ? `Skipped (already in DB): ${meta.skippedExisting}` : "",
            llmOut.ecosystemSummary ? `Summary: ${llmOut.ecosystemSummary}` : "",
          ]
            .filter(Boolean)
            .join("\n");
    const sent = await sendDevTelegram(body, { disableWebPagePreview: true });
    if (!sent) console.warn("[syra-partnership-scout] Telegram send failed");
  }

  await DashboardResearch.findOneAndUpdate(
    { id: SYRA_PARTNERSHIP_SCOUT_DB_ID },
    { id: SYRA_PARTNERSHIP_SCOUT_DB_ID, payload: meta, savedAt: new Date() },
    { upsert: true, new: true },
  );

  return { success: true, data: meta, newLeads };
}

/**
 * @param {{ status?: string; kind?: string; limit?: number; skip?: number }} [opts]
 */
export async function listPartnershipLeads(opts = {}) {
  const filter = {};
  if (opts.status && opts.status !== "all") filter.status = opts.status;
  if (opts.kind && opts.kind !== "all") filter.kind = opts.kind;

  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 50));
  const skip = Math.max(0, Number(opts.skip) || 0);

  const [items, total] = await Promise.all([
    InternalPartnershipLead.find(filter).sort({ discoveredAt: -1 }).skip(skip).limit(limit).lean(),
    InternalPartnershipLead.countDocuments(filter),
  ]);

  return { items, total };
}

/**
 * @param {string} id Mongo _id
 * @param {{ status?: string; notes?: string }} patch
 */
export async function updatePartnershipLead(id, patch) {
  const update = { statusUpdatedAt: new Date() };
  if (patch.status) update.status = patch.status;
  if (typeof patch.notes === "string") update.notes = patch.notes.slice(0, 4000);

  const doc = await InternalPartnershipLead.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!doc) return null;
  return doc;
}

/**
 * @returns {Promise<Record<string, number>>}
 */
export async function partnershipLeadStatusCounts() {
  const rows = await InternalPartnershipLead.aggregate([
    { $group: { _id: { status: "$status", kind: "$kind" }, count: { $sum: 1 } } },
  ]);
  /** @type {Record<string, number>} */
  const out = { all: 0, target: 0, integration: 0 };
  for (const r of rows) {
    const status = r._id?.status;
    const kind = r._id?.kind;
    if (status) {
      out[status] = (out[status] || 0) + r.count;
      out.all += r.count;
    }
    if (kind === "target") out.target += r.count;
    if (kind === "integration") out.integration += r.count;
  }
  return out;
}
