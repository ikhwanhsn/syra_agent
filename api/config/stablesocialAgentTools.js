/**
 * StableSocial x402 tools — TikTok, Instagram, Facebook, Reddit via stablesocial.dev.
 * Async flow: paid POST trigger (~$0.06) then SIWX poll on GET /api/jobs.
 * @see https://stablesocial.dev/llms.txt
 */
import { X402_API_PRICE_STABLESOCIAL_USD, X402_DISPLAY_PRICE_STABLESOCIAL_USD } from './x402Pricing.js';

/**
 * @typedef {'none' | 'handle' | 'keyword' | 'post_id' | 'subreddit' | 'body'} StablesocialGate
 */

/**
 * @param {string} slug
 * @param {string} stablesocialPath
 * @param {string} name
 * @param {string} description
 * @param {StablesocialGate} [gate]
 */
function row(slug, stablesocialPath, name, description, gate = 'none') {
  return { slug, stablesocialPath, name, description, gate };
}

/** @type {ReturnType<typeof row>[]} */
const SPECS = [
  row(
    'tiktok-profile',
    '/api/tiktok/profile',
    'StableSocial: TikTok profile',
    'TikTok user profile by handle. Params: handle (required, username without @).',
    'handle'
  ),
  row(
    'tiktok-posts',
    '/api/tiktok/posts',
    'StableSocial: TikTok posts',
    'Recent TikTok videos for a user. Params: handle (required). Optional max_posts, cursor.',
    'handle'
  ),
  row(
    'tiktok-search',
    '/api/tiktok/search',
    'StableSocial: TikTok search',
    'Search TikTok posts by keyword. Params: keyword or q (required). Optional max_results.',
    'keyword'
  ),
  row(
    'instagram-profile',
    '/api/instagram/profile',
    'StableSocial: Instagram profile',
    'Instagram profile by handle. Params: handle (required).',
    'handle'
  ),
  row(
    'instagram-posts',
    '/api/instagram/posts',
    'StableSocial: Instagram posts',
    'Instagram posts for a user. Params: handle (required). Optional max_posts, cursor.',
    'handle'
  ),
  row(
    'instagram-search',
    '/api/instagram/search',
    'StableSocial: Instagram search',
    'Search Instagram posts by keyword. Params: keyword or q (required).',
    'keyword'
  ),
  row(
    'facebook-profile',
    '/api/facebook/profile',
    'StableSocial: Facebook profile',
    'Facebook page or user profile. Params: handle (required).',
    'handle'
  ),
  row(
    'facebook-posts',
    '/api/facebook/posts',
    'StableSocial: Facebook posts',
    'Facebook posts for a page/user. Params: handle (required).',
    'handle'
  ),
  row(
    'reddit-post',
    '/api/reddit/post',
    'StableSocial: Reddit post',
    'Reddit post details. Params: post_id (required) or pass full Reddit URL in body JSON.',
    'post_id'
  ),
  row(
    'reddit-search',
    '/api/reddit/search',
    'StableSocial: Reddit search',
    'Search Reddit posts by keyword. Params: keyword or q (required).',
    'keyword'
  ),
  row(
    'reddit-subreddit',
    '/api/reddit/subreddit',
    'StableSocial: Reddit subreddit',
    'Posts from a subreddit. Params: subreddit (required, without r/ prefix).',
    'subreddit'
  ),
];

export const STABLESOCIAL_AGENT_TOOLS = SPECS.map((s) => ({
  id: `stablesocial-${s.slug}`,
  path: `/stablesocial/${s.slug}`,
  stablesocialPath: s.stablesocialPath,
  method: 'POST',
  priceUsd: X402_API_PRICE_STABLESOCIAL_USD,
  displayPriceUsd: X402_DISPLAY_PRICE_STABLESOCIAL_USD,
  name: s.name,
  description: s.description,
}));

/** @type {Record<string, StablesocialGate>} */
export const STABLESOCIAL_TOOL_GATES = Object.fromEntries(
  SPECS.map((s) => [`stablesocial-${s.slug}`, s.gate])
);

/**
 * @param {string} toolId
 * @param {Record<string, string>} p
 * @returns {string[] | null}
 */
export function getStablesocialGateMissing(toolId, p) {
  const gate = STABLESOCIAL_TOOL_GATES[toolId];
  if (!gate || gate === 'none' || gate === 'body') return null;

  const trim = (v) => (v != null ? String(v).trim() : '');

  if (gate === 'handle' && !trim(p.handle) && !trim(p.username) && !trim(p.profile_id)) {
    return ['handle (TikTok/Instagram/Facebook username)'];
  }
  if (gate === 'keyword' && !trim(p.keyword) && !trim(p.q) && !trim(p.query)) {
    return ['keyword or q'];
  }
  if (gate === 'post_id' && !trim(p.post_id) && !trim(p.postId) && !trim(p.id) && !trim(p.body)) {
    return ['post_id'];
  }
  if (gate === 'subreddit' && !trim(p.subreddit) && !trim(p.sub)) {
    return ['subreddit'];
  }
  return null;
}

/**
 * @param {string} toolId
 */
export function getStablesocialParamsHintForLlm(toolId) {
  const gate = STABLESOCIAL_TOOL_GATES[toolId];
  if (gate === 'handle') {
    return 'Params: handle (required — username without @). Optional body JSON for advanced fields.';
  }
  if (gate === 'keyword') {
    return 'Params: keyword or q (required). Optional max_results, cursor.';
  }
  if (gate === 'post_id') {
    return 'Params: post_id (required) or body JSON with post id/URL.';
  }
  if (gate === 'subreddit') {
    return 'Params: subreddit (required). Optional max_results, cursor.';
  }
  return 'Optional body JSON string to pass through to StableSocial POST. Job results return after async poll (~5–60s).';
}
