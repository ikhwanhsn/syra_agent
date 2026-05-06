/**
 * Defaults for agent-team crawl, x402 X trends, and growth internal agents.
 * Edit constants here (no env).
 */

import { OPENROUTER_DEFAULT_MODEL } from "./openrouterModels.js";

/** Pipeline-only OpenRouter slug; null falls through to {@link OPENROUTER_DEFAULT_MODEL}. */
export const INTERNAL_PIPELINE_OPENROUTER_MODEL = null;

/**
 * @param {string | null | undefined} modelFromCaller
 * @returns {string}
 */
export function resolveInternalPipelineModel(modelFromCaller) {
  if (typeof modelFromCaller === "string" && modelFromCaller.trim()) {
    return modelFromCaller.trim();
  }
  if (
    typeof INTERNAL_PIPELINE_OPENROUTER_MODEL === "string" &&
    INTERNAL_PIPELINE_OPENROUTER_MODEL.trim()
  ) {
    return INTERNAL_PIPELINE_OPENROUTER_MODEL.trim();
  }
  return OPENROUTER_DEFAULT_MODEL;
}

/** Seed origins for Cloudflare crawl + api.syraa.fun JSON snapshots. */
export const AGENT_TEAM_CRAWL_BASE_URLS = Object.freeze([
  "https://syraa.fun",
  "https://docs.syraa.fun",
  "https://agent.syraa.fun",
  "https://api.syraa.fun",
  "https://playground.syraa.fun",
]);

export const AGENT_TEAM_CRAWL_DEPTH = 2;
export const AGENT_TEAM_CRAWL_PER_SITE_LIMIT = 30;

export const X402_X_TRENDS_SEARCH_QUERIES = Object.freeze([
  "x402 -is:retweet lang:en",
  '("x402" OR payai OR corbits) (payment OR facilitator OR micropayment) -is:retweet lang:en',
]);

export const X402_X_TRENDS_MAX_PER_QUERY = 35;
export const X402_X_TRENDS_MAX_TWEETS_LLM = 55;

export const GROWTH_SYRA_SOCIAL_SEARCH_QUERIES = Object.freeze([
  '"$SYRA" OR $SYRA solana -is:retweet lang:en',
  "(syra_agent OR syraa.fun OR syra agent) -is:retweet lang:en",
]);

export const GROWTH_SYRA_SOCIAL_MAX_PER_QUERY = 32;
export const GROWTH_SYRA_SOCIAL_MAX_TWEETS_LLM = 48;

export const GROWTH_SECTOR_NARRATIVE_SEARCH_QUERIES = Object.freeze([
  '("ai trading agent" OR "crypto agent" OR "solana agent" OR agentic crypto) -is:retweet lang:en',
  '("x402" OR "paid api" OR micropayment) (agent OR developer OR crypto) -is:retweet lang:en',
]);

export const GROWTH_SECTOR_MAX_PER_QUERY = 28;
export const GROWTH_SECTOR_MAX_TWEETS_LLM = 44;
