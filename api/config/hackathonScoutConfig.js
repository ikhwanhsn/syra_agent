/**
 * Hackathon Scout — multi-source aggregator (Devpost + Exa) for global + Indonesia tech hackathons.
 */

export const HACKATHON_SCOUT_DB_ID = "hackathon-scout-latest-run";

export const HACKATHON_SCOUT_CRON_SECRET_ENV = "HACKATHON_SCOUT_CRON_SECRET";

const DEFAULT_CRON_MS = 24 * 60 * 60 * 1000;

export const HACKATHON_SCOUT_CRON_MS = Math.max(
  60_000,
  Number.parseInt(process.env.HACKATHON_SCOUT_CRON_MS || String(DEFAULT_CRON_MS), 10) || DEFAULT_CRON_MS,
);

export const HACKATHON_STATUSES = Object.freeze([
  "new",
  "interested",
  "joined",
  "in_progress",
  "submitted",
  "skipped",
  "archived",
]);

export const HACKATHON_SOURCES = Object.freeze(["devpost", "exa", "manual"]);

/** Devpost API base */
export const DEVPOST_API_BASE = "https://devpost.com/api/hackathons";

/** Pages to fetch for global recently-added listings (9 per page). */
export const DEVPOST_GLOBAL_PAGES = Math.min(
  10,
  Math.max(1, Number.parseInt(process.env.HACKATHON_DEVPOST_GLOBAL_PAGES || "3", 10) || 3),
);

/** Pages for Indonesia search query. */
export const DEVPOST_INDONESIA_PAGES = Math.min(
  5,
  Math.max(1, Number.parseInt(process.env.HACKATHON_DEVPOST_INDONESIA_PAGES || "2", 10) || 2),
);

/** Technology theme IDs on Devpost (subset — we also filter by theme names). */
export const DEVPOST_TECH_THEME_NAMES = Object.freeze([
  "machine learning/ai",
  "web",
  "mobile",
  "blockchain",
  "gaming",
  "devops",
  "iot",
  "open ended",
  "beginner friendly",
  "productivity",
  "fintech",
  "cybersecurity",
  "databases",
  "low/no code",
  "robotic process automation",
  "enterprise",
  "social good",
  "education",
  "design",
]);

/** Keywords that mark a hackathon as Indonesia-related. */
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
  "hackathon indonesia",
]);

/** Exa search queries — Indonesia + global tech hackathons. */
export const EXA_HACKATHON_QUERIES = Object.freeze([
  "hackathon Indonesia 2026 technology registration",
  "hackathon Indonesia pendaftaran teknologi 2026",
  "technology hackathon 2026 registration open",
  "AI hackathon 2026 registration",
  "blockchain hackathon 2026 registration",
  "startup hackathon 2026 apply",
]);

/** Max Exa results per query. */
export const EXA_HACKATHON_NUM_RESULTS = Math.min(
  15,
  Math.max(3, Number.parseInt(process.env.HACKATHON_EXA_NUM_RESULTS || "8", 10) || 8),
);

/** Min relevance score (0-100) for Exa-extracted hackathons. */
export const EXA_MIN_RELEVANCE_SCORE = Math.max(
  0,
  Math.min(100, Number.parseInt(process.env.HACKATHON_EXA_MIN_RELEVANCE || "40", 10) || 40),
);
