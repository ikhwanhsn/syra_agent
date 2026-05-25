/**
 * Syra Trend Scout — single daily internal agent (news, events, trending → content + product ideas).
 */

/** Mongo document id for latest run. */
export const SYRA_TREND_SCOUT_DB_ID = "syra-trend-scout-latest";

/** Env: optional cron secret for POST /internal/trend-scout/run (GitHub Actions). */
export const SYRA_TREND_SCOUT_CRON_SECRET_ENV = "SYRA_TREND_SCOUT_CRON_SECRET";

/** Daily run anchor — Western Indonesian Time (same as former internal pipelines). */
export const SYRA_TREND_SCOUT_WIB_HOUR = 6;
export const SYRA_TREND_SCOUT_WIB_MINUTE = 0;

/** News lookback for article sampling. */
export const SYRA_TREND_SCOUT_NEWS_HOURS = 48;

/** Max headlines fed to the LLM. */
export const SYRA_TREND_SCOUT_HEADLINE_LIMIT = 30;

/** Max news articles (compact) fed to the LLM. */
export const SYRA_TREND_SCOUT_ARTICLE_LIMIT = 40;
