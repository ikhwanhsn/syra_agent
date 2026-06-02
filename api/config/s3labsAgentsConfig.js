/**
 * S3Labs Telegram agents — forum topics, schedules, and per-agent settings.
 *
 * Topics: News https://t.me/s3labs/402 | Developer https://t.me/s3labs/4 | Event https://t.me/s3labs/158
 */

/** Master switch for all S3Labs in-process schedulers. */
export const S3LABS_AGENTS_SCHEDULER_ENABLED =
  String(process.env.S3LABS_AGENTS_SCHEDULER_ENABLED || "true").trim().toLowerCase() !== "false";

/** Random jitter added to each scheduled post (minutes). */
export const S3LABS_SCHEDULE_JITTER_MAX_MINUTES = Math.min(
  30,
  Math.max(5, Number.parseInt(process.env.S3LABS_SCHEDULE_JITTER_MAX_MINUTES || "18", 10)),
);

/** Hours to skip re-sending the same URL. */
export const S3LABS_SENT_HISTORY_HOURS = Math.min(
  72,
  Math.max(12, Number.parseInt(process.env.S3LABS_SENT_HISTORY_HOURS || "24", 10)),
);

/** @typedef {'news' | 'developer' | 'event'} S3labsAgentKind */

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
 *   wibSlots: ReadonlyArray<readonly [number, number]>;
 *   bootDelayMinutes: number;
 * }} S3labsAgentDefinition
 */

/** Mongo doc for cross-agent dedupe (URL + title fingerprint). */
export const S3LABS_SHARED_HISTORY_DB_ID = "s3labs-shared-history";

/** @type {readonly S3labsAgentDefinition[]} */
export const S3LABS_AGENT_DEFINITIONS = Object.freeze([
  {
    kind: "news",
    dbId: "s3labs-news",
    threadId: 402,
    topicLabel: "Berita Terpanas",
    headerEmoji: "🔥",
    agentId: "s3labs-agent-news",
    agentName: "S3Labs News Bot",
    agentTag: "NEWS",
    lookbackHours: 8,
    articleLimit: 40,
    candidateLimit: 15,
    /** Spread away from developer/event slots */
    wibSlots: Object.freeze([
      [8, 7],
      [13, 41],
      [18, 22],
      [22, 53],
    ]),
    bootDelayMinutes: 8,
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
    wibSlots: Object.freeze([
      [9, 23],
      [14, 18],
      [19, 47],
      [23, 11],
    ]),
    bootDelayMinutes: 22,
  },
  {
    kind: "event",
    dbId: "s3labs-event",
    threadId: 158,
    topicLabel: "Event Penting",
    headerEmoji: "📅",
    agentId: "s3labs-agent-event",
    agentName: "S3Labs Event Bot",
    agentTag: "EVENT",
    lookbackHours: 72,
    articleLimit: 30,
    candidateLimit: 12,
    wibSlots: Object.freeze([
      [7, 52],
      [12, 34],
      [17, 6],
      [21, 38],
    ]),
    bootDelayMinutes: 38,
  },
]);

/**
 * @param {S3labsAgentKind} kind
 * @returns {S3labsAgentDefinition}
 */
export function getS3labsAgentDefinition(kind) {
  const def = S3LABS_AGENT_DEFINITIONS.find((a) => a.kind === kind);
  if (!def) throw new Error(`Unknown S3Labs agent kind: ${kind}`);
  return def;
}

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
