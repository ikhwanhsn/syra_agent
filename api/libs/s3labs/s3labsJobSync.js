/**
 * S3Labs Jobs website sync — scrape boards → upsert Mongo (no Telegram).
 * Keeps /jobs listings fresh independently of the Telegram highlight bot.
 */

import DashboardResearch from "../../models/DashboardResearch.js";
import { S3LABS_JOB_SYNC_DB_ID } from "../../config/s3labsAgentsConfig.js";
import { dedupeJobListings, fetchAllJobListings } from "./s3labsJobSources.js";
import { upsertScrapedJobs } from "./s3labsJobStore.js";

/**
 * @returns {Promise<{
 *   success: true;
 *   data: {
 *     scrapedCount: number;
 *     dedupedCount: number;
 *     upserted: number;
 *     bySource: Record<string, number>;
 *     generatedAt: string;
 *   };
 * }>}
 */
export async function runS3labsJobSync() {
  const raw = await fetchAllJobListings();
  const deduped = dedupeJobListings(raw);

  /** @type {Record<string, number>} */
  const bySource = {};
  for (const job of raw) {
    const key = job.sourceId || job.source || "unknown";
    bySource[key] = (bySource[key] || 0) + 1;
  }

  let upserted = 0;
  try {
    const result = await upsertScrapedJobs(deduped);
    upserted = result.upserted;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[s3labs-job-sync] upsert failed:", msg);
    throw e;
  }

  const data = {
    scrapedCount: raw.length,
    dedupedCount: deduped.length,
    upserted,
    bySource,
    generatedAt: new Date().toISOString(),
  };

  try {
    await DashboardResearch.findOneAndUpdate(
      { id: S3LABS_JOB_SYNC_DB_ID },
      { id: S3LABS_JOB_SYNC_DB_ID, payload: data, savedAt: new Date() },
      { upsert: true, new: true },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[s3labs-job-sync] Mongo persist failed:", msg);
  }

  if (raw.length === 0) {
    console.warn("[s3labs-job-sync] scrape returned 0 jobs — check sources");
  } else {
    console.log(
      `[s3labs-job-sync] OK — scraped=${raw.length} deduped=${deduped.length} upserted=${upserted}`,
    );
  }

  return { success: true, data };
}

export { S3LABS_JOB_SYNC_DB_ID };
