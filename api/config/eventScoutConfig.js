/**
 * Event Scout — multi-source aggregator (Web + X + Luma) for tech/crypto/web3 events with lu.ma registration.
 */

export const EVENT_SCOUT_DB_ID = "event-scout-latest-run";

export const EVENT_SCOUT_CRON_SECRET_ENV = "EVENT_SCOUT_CRON_SECRET";

/** Default: every 6h so /events stays near-realtime without hammering sources. */
const DEFAULT_CRON_MS = 6 * 60 * 60 * 1000;

export const EVENT_SCOUT_CRON_MS = Math.max(
  60_000,
  Number.parseInt(process.env.EVENT_SCOUT_CRON_MS || String(DEFAULT_CRON_MS), 10) || DEFAULT_CRON_MS,
);

export const EVENT_STATUSES = Object.freeze([
  "new",
  "interested",
  "registered",
  "attended",
  "skipped",
]);

export const EVENT_SOURCES = Object.freeze(["exa", "web", "x", "luma", "manual"]);

export const EVENT_CATEGORIES = Object.freeze(["tech", "crypto", "web3"]);

/** Keywords that mark an event as Indonesia-related. */
export const INDONESIA_KEYWORDS = Object.freeze([
  "indonesia",
  "indonesian",
  "jakarta",
  "bandung",
  "surabaya",
  "yogyakarta",
  "bali",
  "idn",
  "superteam indonesia",
  "event indonesia",
]);

/** Tech/crypto/web3 relevance keywords. */
export const EVENT_RELEVANCE_KEYWORDS = Object.freeze([
  "tech",
  "technology",
  "crypto",
  "cryptocurrency",
  "web3",
  "blockchain",
  "defi",
  "solana",
  "ethereum",
  "bitcoin",
  "ai",
  "developer",
  "startup",
  "hackathon",
  "meetup",
  "conference",
  "workshop",
]);

/** Web search queries — Indonesia + global tech/crypto/web3 events on Luma. */
export const WEB_EVENT_QUERIES = Object.freeze([
  "crypto event lu.ma registration 2026",
  "web3 meetup lu.ma 2026",
  "tech conference lu.ma registration",
  "blockchain event lu.ma register",
  "Solana event lu.ma 2026",
  "web3 event Indonesia lu.ma",
  "crypto meetup Jakarta lu.ma",
  "tech event Bali lu.ma",
  "developer meetup lu.ma registration",
  "site:lu.ma crypto event 2026",
  "site:lu.ma web3 meetup",
  "site:lu.ma tech conference",
]);

/** X search queries for lu.ma event links. */
export const X_EVENT_SEARCH_QUERIES = Object.freeze([
  'lu.ma (crypto OR web3 OR blockchain OR solana) -is:retweet lang:en',
  'lu.ma (tech OR developer OR startup OR AI) -is:retweet lang:en',
  'lu.ma (Indonesia OR Jakarta OR Bali) (crypto OR web3 OR tech) -is:retweet',
  'lu.ma meetup registration -is:retweet',
]);

/** Max web search results per query. */
export const WEB_EVENT_NUM_RESULTS = Math.min(
  15,
  Math.max(3, Number.parseInt(process.env.EVENT_WEB_NUM_RESULTS || process.env.EVENT_EXA_NUM_RESULTS || "8", 10) || 8),
);

/** Min relevance score (0-100) for extracted events. */
export const WEB_MIN_RELEVANCE_SCORE = Math.max(
  0,
  Math.min(100, Number.parseInt(process.env.EVENT_WEB_MIN_RELEVANCE || process.env.EVENT_EXA_MIN_RELEVANCE || "35", 10) || 35),
);

/** Max Luma pages to fetch per pipeline run. */
export const LUMA_MAX_PAGES_PER_RUN = Math.min(
  40,
  Math.max(5, Number.parseInt(process.env.EVENT_LUMA_MAX_PAGES || "25", 10) || 25),
);

/** Max X tweets to sample per query. */
export const X_EVENT_MAX_TWEETS_PER_QUERY = Math.min(
  30,
  Math.max(5, Number.parseInt(process.env.EVENT_X_MAX_TWEETS || "15", 10) || 15),
);
