/**
 * S3Labs Jobs website sync — scrape boards into Mongo independent of Telegram posts.
 */

export const S3LABS_JOB_SYNC_DB_ID = "s3labs-job-sync-latest-run";

/** Default: every hour so /jobs stays fresh without Telegram coupling. */
const DEFAULT_CRON_MS = 60 * 60 * 1000;

export const S3LABS_JOB_SYNC_CRON_MS = Math.max(
  60_000,
  Number.parseInt(process.env.S3LABS_JOB_SYNC_CRON_MS || String(DEFAULT_CRON_MS), 10) ||
    DEFAULT_CRON_MS,
);

/** Master switch for the in-process website sync scheduler. */
export const S3LABS_JOB_SYNC_SCHEDULER_ENABLED =
  String(process.env.S3LABS_JOB_SYNC_SCHEDULER_ENABLED || "true")
    .trim()
    .toLowerCase() !== "false";
