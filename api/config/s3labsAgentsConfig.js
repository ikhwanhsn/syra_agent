/**
 * S3Labs Telegram agents — forum topics, schedules, and per-agent settings.
 *
 * Topics: News https://t.me/s3labs/402 | Developer https://t.me/s3labs/4 | Event https://t.me/s3labs/158
 * Jobs https://t.me/s3labs/513
 *
 * Default volume is intentionally low (~1–3 Telegram posts/day total): jobs, events,
 * and hackathons live on the website, so Telegram only highlights a few items.
 */

/** Master switch for all S3Labs in-process schedulers. */
export const S3LABS_AGENTS_SCHEDULER_ENABLED =
  String(process.env.S3LABS_AGENTS_SCHEDULER_ENABLED || "true").trim().toLowerCase() !== "false";

/** Random jitter added to each scheduled post (minutes). */
export const S3LABS_SCHEDULE_JITTER_MAX_MINUTES = Math.min(
  35,
  Math.max(8, Number.parseInt(process.env.S3LABS_SCHEDULE_JITTER_MAX_MINUTES || "22", 10)),
);

/**
 * Default posts per agent per day (random count in inclusive range).
 * Per-agent `postsPerDayMin` / `postsPerDayMax` override these.
 */
export const S3LABS_POSTS_PER_DAY_MIN = Math.min(
  3,
  Math.max(0, Number.parseInt(process.env.S3LABS_POSTS_PER_DAY_MIN || "1", 10)),
);
export const S3LABS_POSTS_PER_DAY_MAX = Math.min(
  3,
  Math.max(S3LABS_POSTS_PER_DAY_MIN, Number.parseInt(process.env.S3LABS_POSTS_PER_DAY_MAX || "1", 10)),
);

/** WIB posting window for random daily slots. */
export const S3LABS_SCHEDULE_HOUR_START_WIB = Math.min(
  12,
  Math.max(6, Number.parseInt(process.env.S3LABS_SCHEDULE_HOUR_START_WIB || "8", 10)),
);
export const S3LABS_SCHEDULE_HOUR_END_WIB = Math.min(
  23,
  Math.max(S3LABS_SCHEDULE_HOUR_START_WIB + 4, Number.parseInt(process.env.S3LABS_SCHEDULE_HOUR_END_WIB || "21", 10)),
);

/** Minimum minutes between two posts for the same agent on the same day. */
export const S3LABS_SCHEDULE_MIN_GAP_MINUTES = Math.min(
  480,
  Math.max(120, Number.parseInt(process.env.S3LABS_SCHEDULE_MIN_GAP_MINUTES || "180", 10)),
);

/** Interactive @mention Q&A in the S3Labs group. */
export const S3LABS_TELEGRAM_QA_ENABLED =
  String(process.env.S3LABS_TELEGRAM_QA_ENABLED || "true").trim().toLowerCase() !== "false";

/** Secret path segment or header for Telegram webhook (required in production). */
export const S3LABS_TELEGRAM_WEBHOOK_SECRET = String(
  process.env.S3LABS_TELEGRAM_WEBHOOK_SECRET || "",
).trim();

/** Max @mention answers per Telegram user per hour. */
export const S3LABS_TELEGRAM_QA_MAX_PER_USER_PER_HOUR = Math.min(
  20,
  Math.max(3, Number.parseInt(process.env.S3LABS_TELEGRAM_QA_MAX_PER_USER_PER_HOUR || "8", 10)),
);

/** Optional public URL for setWebhook on boot (e.g. https://api.example.com/internal/s3labs-telegram/webhook/SECRET). */
export const S3LABS_TELEGRAM_WEBHOOK_URL = String(process.env.S3LABS_TELEGRAM_WEBHOOK_URL || "").trim();

/** Long-polling fallback when webhook URL is not set (dev only). */
export const S3LABS_TELEGRAM_POLLING_ENABLED =
  String(process.env.S3LABS_TELEGRAM_POLLING_ENABLED || "false").trim().toLowerCase() === "true";

/** Hours to skip re-sending the same URL. */
export const S3LABS_SENT_HISTORY_HOURS = Math.min(
  72,
  Math.max(12, Number.parseInt(process.env.S3LABS_SENT_HISTORY_HOURS || "24", 10)),
);

/** Hours to skip re-sending the same job listing (roles stay open longer than news). */
export const S3LABS_JOB_SENT_HISTORY_HOURS = Math.min(
  336,
  Math.max(72, Number.parseInt(process.env.S3LABS_JOB_SENT_HISTORY_HOURS || "168", 10)),
);

/**
 * @deprecated Jobs use the daily WIB schedule (same as other agents). Kept for env/docs compat.
 * Prefer `postsPerDayMin` / `postsPerDayMax` on `S3LABS_JOB_AGENT`.
 */
export const S3LABS_JOB_INTERVAL_MINUTES = Math.min(
  24 * 60,
  Math.max(60, Number.parseInt(process.env.S3LABS_JOB_INTERVAL_MINUTES || String(24 * 60), 10)),
);

/** @typedef {'news' | 'developer' | 'event' | 'job'} S3labsAgentKind */

/**
 * @typedef {{
 *   kind: S3labsAgentKind;
 *   dbId: string;
 *   threadId: number;
 *   topicLabel: string;
 *   headerEmoji: string;
 *   agentId: string;
 *   agentName: string;
 *   agentTag: string;
 *   lookbackHours: number;
 *   articleLimit: number;
 *   candidateLimit: number;
 *   bootDelayMinutes: number;
 *   postsPerDayMin: number;
 *   postsPerDayMax: number;
 * }} S3labsAgentDefinition
 */

/**
 * Clamp a per-agent daily post range (0–3). Total across agents targets ~1–3 Telegram posts/day.
 * @param {number} min
 * @param {number} max
 * @returns {{ postsPerDayMin: number; postsPerDayMax: number }}
 */
function postsPerDayRange(min, max) {
  const postsPerDayMin = Math.min(3, Math.max(0, min));
  const postsPerDayMax = Math.min(3, Math.max(postsPerDayMin, max));
  return { postsPerDayMin, postsPerDayMax };
}

/** Mongo doc for cross-agent dedupe (URL + title fingerprint). */
export const S3LABS_SHARED_HISTORY_DB_ID = "s3labs-shared-history";

/** @type {readonly S3labsAgentDefinition[]} */
export const S3LABS_AGENT_DEFINITIONS = Object.freeze([
  {
    kind: "news",
    dbId: "s3labs-news",
    threadId: 402,
    topicLabel: "Hot News",
    headerEmoji: "🔥",
    agentId: "s3labs-agent-news",
    agentName: "S3Labs News Bot",
    agentTag: "NEWS",
    lookbackHours: 8,
    articleLimit: 40,
    candidateLimit: 15,
    bootDelayMinutes: 8,
    // Always one news highlight/day (primary Telegram value).
    ...postsPerDayRange(1, 1),
  },
  {
    kind: "developer",
    dbId: "s3labs-developer",
    threadId: 4,
    topicLabel: "Developer Highlight",
    headerEmoji: "👨‍💻",
    agentId: "s3labs-agent-developer",
    agentName: "S3Labs Developer Bot",
    agentTag: "DEV",
    lookbackHours: 12,
    articleLimit: 35,
    candidateLimit: 12,
    bootDelayMinutes: 22,
    // Occasional — keeps total volume in the 1–3/day band.
    ...postsPerDayRange(0, 1),
  },
  {
    kind: "event",
    dbId: "s3labs-event",
    threadId: 158,
    topicLabel: "Key Event",
    headerEmoji: "📅",
    agentId: "s3labs-agent-event",
    agentName: "S3Labs Event Bot",
    agentTag: "EVENT",
    lookbackHours: 72,
    articleLimit: 30,
    candidateLimit: 12,
    bootDelayMinutes: 38,
    // Off by default — events/hackathons are on the website.
    ...postsPerDayRange(0, 0),
  },
]);

/**
 * Jobs agent — daily WIB schedule (not a fixed interval), topic https://t.me/s3labs/513
 * Occasional highlight only; full listings live on the website.
 * @type {Readonly<{
 *   kind: 'job';
 *   dbId: string;
 *   threadId: number;
 *   topicLabel: string;
 *   headerEmoji: string;
 *   agentId: string;
 *   agentName: string;
 *   agentTag: string;
 *   lookbackHours: number;
 *   candidateLimit: number;
 *   intervalMinutes: number;
 *   bootDelayMinutes: number;
 *   postsPerDayMin: number;
 *   postsPerDayMax: number;
 * }>}
 */
export const S3LABS_JOB_AGENT = Object.freeze({
  kind: "job",
  dbId: "s3labs-job",
  threadId: 513,
  topicLabel: "Job Openings",
  headerEmoji: "💼",
  agentId: "s3labs-agent-jobs",
  agentName: "S3Labs Jobs Bot",
  agentTag: "JOBS",
  lookbackHours: 336,
  candidateLimit: 40,
  intervalMinutes: S3LABS_JOB_INTERVAL_MINUTES,
  bootDelayMinutes: 5,
  // Occasional job highlight — listings are on the website.
  ...postsPerDayRange(0, 1),
});

/**
 * Resolve daily post range for an agent kind.
 * @param {string} kind
 * @returns {{ min: number; max: number }}
 */
export function getS3labsPostsPerDayRange(kind) {
  try {
    const def = getS3labsAgentDefinition(/** @type {S3labsAgentKind} */ (kind));
    const min = Number.isFinite(def.postsPerDayMin) ? def.postsPerDayMin : S3LABS_POSTS_PER_DAY_MIN;
    const max = Number.isFinite(def.postsPerDayMax) ? def.postsPerDayMax : S3LABS_POSTS_PER_DAY_MAX;
    return { min: Math.max(0, min), max: Math.max(Math.max(0, min), max) };
  } catch {
    return { min: S3LABS_POSTS_PER_DAY_MIN, max: S3LABS_POSTS_PER_DAY_MAX };
  }
}

/**
 * @param {S3labsAgentKind} kind
 * @returns {S3labsAgentDefinition | typeof S3LABS_JOB_AGENT}
 */
export function getS3labsAgentDefinition(kind) {
  if (kind === "job") return S3LABS_JOB_AGENT;
  const def = S3LABS_AGENT_DEFINITIONS.find((a) => a.kind === kind);
  if (!def) throw new Error(`Unknown S3Labs agent kind: ${kind}`);
  return def;
}

/** Tech / remote job RSS feeds (web3 + crypto + engineering). */
export const S3LABS_JOB_RSS_SOURCES = Object.freeze([
  {
    id: "wwr-programming",
    name: "WeWorkRemotely",
    url: "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    category: "tech",
  },
  {
    id: "wwr-devops",
    name: "WeWorkRemotely DevOps",
    url: "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
    category: "tech",
  },
  {
    id: "hn-jobs",
    name: "Hacker News Jobs",
    url: "https://hnrss.org/jobs",
    category: "tech",
  },
]);

/** Developer / tech RSS — used only by developer agent. */
export const S3LABS_DEV_RSS_SOURCES = Object.freeze([
  { id: "hackernews", name: "Hacker News", url: "https://hnrss.org/frontpage" },
  { id: "github-blog", name: "GitHub Blog", url: "https://github.blog/feed/" },
  { id: "devto", name: "dev.to", url: "https://dev.to/feed" },
  { id: "stackoverflow", name: "Stack Overflow Blog", url: "https://stackoverflow.blog/feed/" },
  { id: "lobsters", name: "Lobsters", url: "https://lobste.rs/rss" },
]);

/** Backward-compatible exports for news-only code */
export const S3LABS_NEWS_DB_ID = "s3labs-news";
export const S3LABS_TELEGRAM_NEWS_THREAD_ID = 402;
export const S3LABS_NEWS_CRON_SECRET_ENV = "S3LABS_NEWS_CRON_SECRET";
export const S3LABS_NEWS_SCHEDULER_ENABLED = S3LABS_AGENTS_SCHEDULER_ENABLED;
export const S3LABS_NEWS_SENT_HISTORY_HOURS = S3LABS_SENT_HISTORY_HOURS;
export const S3LABS_NEWS_LOOKBACK_HOURS = 8;
export const S3LABS_NEWS_ARTICLE_LIMIT = 40;
export const S3LABS_NEWS_HOT_CANDIDATE_LIMIT = 15;
