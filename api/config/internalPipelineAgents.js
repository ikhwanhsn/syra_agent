/**
 * Defaults for agent-team crawl, x402 X trends, and growth internal agents.
 * Most knobs are constants; OpenRouter model can be overridden with {@link INTERNAL_TEAM_OPENROUTER_MODEL_ENV}.
 */

import { OPENROUTER_DEFAULT_MODEL } from "./openrouterModels.js";

/** Env name: optional OpenRouter slug for all internal-team pipelines (15 agents). */
export const INTERNAL_TEAM_OPENROUTER_MODEL_ENV = "INTERNAL_TEAM_OPENROUTER_MODEL";

/** Pipeline-only OpenRouter slug; null falls through to env then {@link OPENROUTER_DEFAULT_MODEL}. */
export const INTERNAL_PIPELINE_OPENROUTER_MODEL = null;

/**
 * Per-page markdown cap fed to internal-team LLMs (smaller ⇒ fewer input tokens / lower cost).
 */
export const AGENT_TEAM_LLM_PAGE_MARKDOWN_MAX = 6144;

/**
 * Total crawl snapshot character budget before internal research / strategy (smaller ⇒ cheaper).
 */
export const AGENT_TEAM_LLM_SNAPSHOT_TOTAL_MAX = 120_000;

/**
 * @param {string | null | undefined} modelFromCaller
 * @returns {string}
 */
export function resolveInternalPipelineModel(modelFromCaller) {
  if (typeof modelFromCaller === "string" && modelFromCaller.trim()) {
    return modelFromCaller.trim();
  }
  const fromEnv =
    typeof process.env[INTERNAL_TEAM_OPENROUTER_MODEL_ENV] === "string"
      ? process.env[INTERNAL_TEAM_OPENROUTER_MODEL_ENV].trim()
      : "";
  if (fromEnv) {
    return fromEnv;
  }
  if (
    typeof INTERNAL_PIPELINE_OPENROUTER_MODEL === "string" &&
    INTERNAL_PIPELINE_OPENROUTER_MODEL.trim()
  ) {
    return INTERNAL_PIPELINE_OPENROUTER_MODEL.trim();
  }
  return OPENROUTER_DEFAULT_MODEL;
}

/**
 * User-facing Syra surfaces that are safe to deep-crawl with Cloudflare Browser Rendering.
 * These render HTML for unauthenticated browsers, so the crawler gets real product content.
 *
 * NOTE: api.syraa.fun is intentionally NOT here — it's an API surface where most internal
 * paths require API key / x402 auth and return 401 to anonymous crawlers (expected behavior).
 * Deep-crawling it caused the internal research agent to hallucinate "401 across all surfaces"
 * recommendations. The API surface is described by AGENT_TEAM_API_DISCOVERY_HOST below.
 */
export const AGENT_TEAM_CRAWL_BASE_URLS = Object.freeze([
  // Canonical host avoids apex→www redirect noise for Browser Rendering crawls
  "https://www.syraa.fun",
  "https://docs.syraa.fun",
  "https://agent.syraa.fun",
  "https://playground.syraa.fun",
]);

/**
 * The API host. The crawler does NOT deep-crawl it; instead it fetches a fixed list of
 * public discovery JSON endpoints (see agentTeamCrawl.js#API_DISCOVERY_PATHS).
 */
export const AGENT_TEAM_API_DISCOVERY_HOST = "https://api.syraa.fun";

export const AGENT_TEAM_CRAWL_DEPTH = 2;
export const AGENT_TEAM_CRAWL_PER_SITE_LIMIT = 30;

/** One recent-search call (OR of former dual queries) — fewer X API reads per run. */
export const X402_X_TRENDS_SEARCH_QUERY = Object.freeze(
  '(x402 -is:retweet lang:en) OR (("x402" OR payai OR corbits) (payment OR facilitator OR micropayment) -is:retweet lang:en)',
);

/** @deprecated Use {@link X402_X_TRENDS_SEARCH_QUERY}; kept for callers expecting an array. */
export const X402_X_TRENDS_SEARCH_QUERIES = Object.freeze([X402_X_TRENDS_SEARCH_QUERY]);

export const X402_X_TRENDS_MAX_PER_QUERY = 24;
export const X402_X_TRENDS_MAX_TWEETS_LLM = 36;

/** Single-query variant of former SYRA social pair. */
export const GROWTH_SYRA_SOCIAL_SEARCH_QUERY = Object.freeze(
  '(("$SYRA" OR $SYRA) solana -is:retweet lang:en) OR ((syra_agent OR syraa.fun OR "syra agent") -is:retweet lang:en)',
);

/** @deprecated Use {@link GROWTH_SYRA_SOCIAL_SEARCH_QUERY}. */
export const GROWTH_SYRA_SOCIAL_SEARCH_QUERIES = Object.freeze([GROWTH_SYRA_SOCIAL_SEARCH_QUERY]);

export const GROWTH_SYRA_SOCIAL_MAX_PER_QUERY = 22;
export const GROWTH_SYRA_SOCIAL_MAX_TWEETS_LLM = 34;

/** Single-query variant of former sector narrative pair. */
export const GROWTH_SECTOR_NARRATIVE_SEARCH_QUERY = Object.freeze(
  '(("ai trading agent" OR "crypto agent" OR "solana agent" OR "agentic crypto") -is:retweet lang:en) OR (("x402" OR "paid api" OR micropayment) (agent OR developer OR crypto) -is:retweet lang:en)',
);

/** @deprecated Use {@link GROWTH_SECTOR_NARRATIVE_SEARCH_QUERY}. */
export const GROWTH_SECTOR_NARRATIVE_SEARCH_QUERIES = Object.freeze([
  GROWTH_SECTOR_NARRATIVE_SEARCH_QUERY,
]);

export const GROWTH_SECTOR_MAX_PER_QUERY = 22;
export const GROWTH_SECTOR_MAX_TWEETS_LLM = 32;

/**
 * OpenRouter completion caps for internal pipelines (lower bill, JSON still fits with retry).
 * @type {Readonly<{
 *   internalResearch: number;
 *   businessStrategy: number;
 *   growthSyraMarket: number;
 *   growthSyraSocial: number;
 *   growthSectorNarrative: number;
 *   growthScout: number;
 *   x402XTrends: number;
 *   hrTeamCoach: number;
 *   uponlyFundDevSpecialists: number;
 *   hackathonScout: number;
 * }>}
 */
export const INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS = Object.freeze({
  internalResearch: 1900,
  businessStrategy: 1900,
  growthSyraMarket: 1150,
  growthSyraSocial: 1200,
  growthSectorNarrative: 1200,
  growthScout: 1400,
  x402XTrends: 1250,
  hackathonScout: 1200,
  eventScout: 1200,
  hrTeamCoach: 300,
  uponlyFundDevSpecialists: 4200,
  uponlyFundHrCoach: 360,
});
