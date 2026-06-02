/**
 * @deprecated Import from config/s3labsAgentsConfig.js — kept for backward compatibility.
 */
export {
  S3LABS_NEWS_DB_ID,
  S3LABS_TELEGRAM_NEWS_THREAD_ID,
  S3LABS_NEWS_CRON_SECRET_ENV,
  S3LABS_NEWS_SCHEDULER_ENABLED,
  S3LABS_NEWS_SENT_HISTORY_HOURS,
  S3LABS_NEWS_LOOKBACK_HOURS,
  S3LABS_NEWS_ARTICLE_LIMIT,
  S3LABS_NEWS_HOT_CANDIDATE_LIMIT,
  S3LABS_DEV_RSS_SOURCES,
} from "./s3labsAgentsConfig.js";

/** @deprecated Use S3LABS_AGENTS_SCHEDULER + per-agent slots */
export const S3LABS_NEWS_RUNS_PER_DAY = 4;
export const S3LABS_NEWS_INTERVAL_MS = Math.floor((24 * 60 * 60 * 1000) / 4);
export const S3LABS_NEWS_PICK_COUNT = 1;
