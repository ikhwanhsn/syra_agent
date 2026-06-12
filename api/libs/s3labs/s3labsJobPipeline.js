/**
 * S3Labs Jobs pipeline — scrape → pick highest-paid fresh job → Telegram topic 513.
 */

import DashboardResearch from "../../models/DashboardResearch.js";
import { S3LABS_JOB_AGENT } from "../../config/s3labsAgentsConfig.js";
import { fetchS3labsJobCandidates } from "./s3labsJobAggregator.js";
import { formatS3labsJobTelegram } from "./s3labsJobDigests.js";
import {
  appendJobSentHistory,
  loadRecentSentJobDedupeKeys,
  loadRecentSentJobKeys,
  loadRecentSentJobUrls,
} from "./s3labsJobSentHistory.js";
import { isS3labsTelegramConfigured, sendS3labsTelegram } from "../s3labsTelegramNotifier.js";

/**
 * @returns {Promise<{
 *   success: true;
 *   data: {
 *     lastJob: import("./s3labsJobIdentity.js").JobListing | null;
 *     generatedAt: string;
 *     sourceStats: Record<string, number>;
 *     agentId: string;
 *     agentName: string;
 *     agentTag: string;
 *   };
 *   telegramSent?: boolean;
 *   skipped?: boolean;
 *   reason?: string;
 * }>}
 */
export async function runS3labsJobPipeline() {
  const def = S3LABS_JOB_AGENT;

  let existingPayload = null;
  try {
    const doc = await DashboardResearch.findOne({ id: def.dbId }).lean();
    existingPayload = doc?.payload ?? null;
  } catch {
    /* Mongo optional */
  }

  const excludes = {
    jobIdentityKeys: loadRecentSentJobKeys(existingPayload),
    dedupeKeys: loadRecentSentJobDedupeKeys(existingPayload),
    urls: loadRecentSentJobUrls(existingPayload),
  };

  const { candidates, stats } = await fetchS3labsJobCandidates({ excludes });

  if (candidates.length === 0) {
    console.warn("[s3labs-job] no fresh job candidates");
    return {
      success: true,
      data: {
        lastJob: null,
        generatedAt: new Date().toISOString(),
        sourceStats: stats,
        agentId: def.agentId,
        agentName: def.agentName,
        agentTag: def.agentTag,
      },
      telegramSent: false,
      skipped: true,
      reason: "no_fresh_candidates",
    };
  }

  const pick = candidates[0];
  const message = formatS3labsJobTelegram(pick);

  let telegramSent = false;
  if (isS3labsTelegramConfigured()) {
    try {
      telegramSent = await sendS3labsTelegram(message, {
        messageThreadId: def.threadId,
        parseMode: "HTML",
        disableWebPagePreview: false,
      });
      if (!telegramSent) console.warn("[s3labs-job] Telegram send failed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[s3labs-job] Telegram send error:", msg);
    }
  }

  const data = {
    lastJob: pick,
    generatedAt: new Date().toISOString(),
    sourceStats: stats,
    agentId: def.agentId,
    agentName: def.agentName,
    agentTag: def.agentTag,
  };

  const payloadToSave = {
    ...data,
    jobSentHistory: telegramSent ? appendJobSentHistory(existingPayload, pick) : existingPayload?.jobSentHistory,
  };

  try {
    await DashboardResearch.findOneAndUpdate(
      { id: def.dbId },
      { id: def.dbId, payload: payloadToSave, savedAt: new Date() },
      { upsert: true, new: true },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[s3labs-job] Mongo persist failed:", msg);
  }

  return { success: true, data, telegramSent };
}

export { S3LABS_JOB_AGENT };
