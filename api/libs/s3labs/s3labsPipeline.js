/**
 * Generic S3Labs agent pipeline — fetch → pick 1 → Telegram topic → Mongo.
 * Cross-agent dedupe via shared history (URL + title).
 */

import DashboardResearch from "../../models/DashboardResearch.js";
import { getS3labsAgentDefinition } from "../../config/s3labsAgentsConfig.js";
import { fetchS3labsNewsCandidates } from "./s3labsNewsAggregator.js";
import { fetchS3labsDeveloperCandidates } from "./s3labsDeveloperAggregator.js";
import { fetchS3labsEventCandidates } from "./s3labsEventAggregator.js";
import { runS3labsPickAgent } from "./s3labsPickLlm.js";
import { formatS3labsAgentTelegram } from "./s3labsDigests.js";
import {
  loadRecentSentUrls,
  loadRecentSentTitleKeys,
  appendSentHistory,
} from "./s3labsSentHistory.js";
import {
  fetchGlobalExcludes,
  recordSharedSent,
  isContentExcluded,
} from "./s3labsSharedHistory.js";
import { isS3labsTelegramConfigured, sendS3labsTelegram } from "../s3labsTelegramNotifier.js";

/**
 * @typedef {import("../../config/s3labsAgentsConfig.js").S3labsAgentKind} S3labsAgentKind
 * @typedef {import("./s3labsPickLlm.js").S3labsPickOutput} S3labsPickOutput
 * @typedef {import("./s3labsSharedHistory.js").ContentExcludes} ContentExcludes
 */

/**
 * @param {S3labsAgentKind} kind
 * @param {ContentExcludes} excludes
 */
async function fetchCandidates(kind, excludes) {
  if (kind === "news") return fetchS3labsNewsCandidates({ excludes });
  if (kind === "developer") return fetchS3labsDeveloperCandidates({ excludes });
  return fetchS3labsEventCandidates({ excludes });
}

/**
 * If LLM picked something already posted (any agent), use next fresh candidate.
 * @param {S3labsPickOutput} data
 * @param {Array<{ title: string; description: string; url: string; source: string; publishedAt?: string; eventDate?: string }>} articles
 * @param {ContentExcludes} excludes
 * @param {S3labsAgentKind} kind
 * @returns {S3labsPickOutput}
 */
function ensureFreshPick(data, articles, excludes, kind) {
  if (!data.pick || !isContentExcluded(data.pick, excludes)) {
    return data;
  }

  console.warn(`[s3labs-${kind}] LLM pick was duplicate; using next candidate`);

  for (const a of articles) {
    if (isContentExcluded(a, excludes)) continue;
    return {
      ...data,
      pick: {
        title: a.title.slice(0, 200),
        summary: a.description.slice(0, 220) || a.title,
        whyItMatters:
          kind === "event"
            ? "This event has not been shared with the community yet."
            : kind === "developer"
              ? "This dev article is relevant and has not been posted before."
              : "This story has not been shared with the community yet.",
        url: a.url,
        source: a.source,
        category: kind === "news" ? "web3" : kind,
        eventDate: a.eventDate,
      },
    };
  }

  return { ...data, pick: null };
}

/**
 * @param {S3labsAgentKind} kind
 * @returns {Promise<{ success: true; data: S3labsPickOutput; telegramSent?: boolean; skipped?: boolean; reason?: string }>}
 */
export async function runS3labsAgentPipeline(kind) {
  const def = getS3labsAgentDefinition(kind);

  let existingPayload = null;
  try {
    const doc = await DashboardResearch.findOne({ id: def.dbId }).lean();
    existingPayload = doc?.payload ?? null;
  } catch {
    /* Mongo optional */
  }

  const globalExcludes = await fetchGlobalExcludes();
  const localUrls = loadRecentSentUrls(existingPayload);
  const localTitleKeys = loadRecentSentTitleKeys(existingPayload);
  const excludes = {
    urls: new Set([...globalExcludes.urls, ...localUrls]),
    titleKeys: new Set([...globalExcludes.titleKeys, ...localTitleKeys]),
  };

  const { hotCandidates, stats, compactArticles } = await fetchCandidates(kind, excludes);

  if (hotCandidates.length === 0) {
    console.warn(`[s3labs-${kind}] no fresh candidates (cross-agent dedupe active)`);
    return {
      success: true,
      data: {
        pick: null,
        generatedAt: new Date().toISOString(),
        sourceStats: stats,
        agentId: def.agentId,
        agentTag: def.agentTag,
      },
      telegramSent: false,
      skipped: true,
      reason: "no_fresh_candidates",
    };
  }

  let data = await runS3labsPickAgent(kind, compactArticles, stats, null, {
    excludedUrls: [...excludes.urls].slice(0, 40),
    excludedTitles: [...excludes.titleKeys].slice(0, 20),
  });
  data = ensureFreshPick(data, compactArticles, excludes, kind);

  if (data.pick && isContentExcluded(data.pick, excludes)) {
    return {
      success: true,
      data: { ...data, pick: null },
      telegramSent: false,
      skipped: true,
      reason: "duplicate_after_fallback",
    };
  }

  const dataWithIdentity = {
    ...data,
    agentId: def.agentId,
    agentName: def.agentName,
    agentTag: def.agentTag,
  };

  const message = formatS3labsAgentTelegram(kind, dataWithIdentity);

  if (!message) {
    return { success: true, data: dataWithIdentity, telegramSent: false, skipped: true, reason: "no_pick" };
  }

  let telegramSent = false;
  if (isS3labsTelegramConfigured()) {
    telegramSent = await sendS3labsTelegram(message, {
      messageThreadId: def.threadId,
      disableWebPagePreview: false,
    });
    if (!telegramSent) console.warn(`[s3labs-${kind}] Telegram send failed`);
  }

  if (telegramSent && dataWithIdentity.pick) {
    await recordSharedSent(kind, dataWithIdentity.pick);
  }

  const payloadToSave = {
    ...dataWithIdentity,
    sentHistory: dataWithIdentity.pick
      ? appendSentHistory(existingPayload, dataWithIdentity.pick)
      : existingPayload?.sentHistory,
  };

  try {
    await DashboardResearch.findOneAndUpdate(
      { id: def.dbId },
      { id: def.dbId, payload: payloadToSave, savedAt: new Date() },
      { upsert: true, new: true },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[s3labs-${kind}] Mongo persist failed:`, msg);
  }

  return { success: true, data: dataWithIdentity, telegramSent };
}

export async function runS3labsNewsPipeline() {
  return runS3labsAgentPipeline("news");
}

export async function runS3labsDeveloperPipeline() {
  return runS3labsAgentPipeline("developer");
}

export async function runS3labsEventPipeline() {
  return runS3labsAgentPipeline("event");
}

export { S3LABS_NEWS_DB_ID } from "../../config/s3labsAgentsConfig.js";
