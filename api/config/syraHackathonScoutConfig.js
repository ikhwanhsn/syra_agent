/**
 * Syra Hackathon Scout — X discovery for Solana / AI / web3 hackathons (credit-conscious).
 */

export const SYRA_HACKATHON_SCOUT_DB_ID = "syra-hackathon-scout-latest-run";

export const SYRA_HACKATHON_SCOUT_CRON_SECRET_ENV = "SYRA_HACKATHON_SCOUT_CRON_SECRET";

/** Daily run — 06:30 WIB (after trend + partnership scouts). */
export const SYRA_HACKATHON_SCOUT_WIB_HOUR = 6;
export const SYRA_HACKATHON_SCOUT_WIB_MINUTE = 30;

/**
 * Single combined recent-search query (1 X API read per pipeline run when cache cold).
 * Tune via HACKATHON_SCOUT_SEARCH_QUERY env.
 */
export const HACKATHON_SCOUT_DEFAULT_SEARCH_QUERY = Object.freeze(
  '(hackathon OR "hacker house" OR "build week" OR superteam OR colosseum OR "solana hackathon") ' +
    '(solana OR web3 OR "ai agent" OR x402 OR defi OR blockchain) -is:retweet lang:en',
);

/** X recent search max_results (API min 10, max 100). Keep at 10 to limit payload + credits. */
export const HACKATHON_SCOUT_MAX_RESULTS = 10;

/** Max tweets passed to OpenRouter after keyword pre-filter. */
export const HACKATHON_SCOUT_MAX_TWEETS_LLM = 12;

/** Longer search cache for this pipeline (ms). Default 12h. */
export const HACKATHON_SCOUT_SEARCH_CACHE_MS = Math.min(
  24 * 60 * 60 * 1000,
  Math.max(60_000, Number.parseInt(process.env.HACKATHON_SCOUT_SEARCH_CACHE_MS || String(12 * 60 * 60 * 1000), 10)),
);

export const HACKATHON_SCOUT_STATUSES = Object.freeze([
  "new",
  "interested",
  "participate",
  "applied",
  "skip",
  "archived",
]);
