/**
 * StableEnrich x402 tools — Exa, Firecrawl, Apollo, Google Maps, Reddit, Serper, Hunter, Cloudflare crawl.
 * @see https://stableenrich.dev/llms.txt
 */
import {
  X402_API_PRICE_STABLEENRICH_0002_USD,
  X402_API_PRICE_STABLEENRICH_01_USD,
  X402_API_PRICE_STABLEENRICH_0126_USD,
  X402_API_PRICE_STABLEENRICH_02_USD,
  X402_API_PRICE_STABLEENRICH_0252_USD,
  X402_API_PRICE_STABLEENRICH_03_USD,
  X402_API_PRICE_STABLEENRICH_04_USD,
  X402_API_PRICE_STABLEENRICH_0495_USD,
  X402_API_PRICE_STABLEENRICH_05_USD,
  X402_API_PRICE_STABLEENRICH_10_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_0002_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_01_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_0126_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_02_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_0252_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_03_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_04_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_0495_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_05_USD,
  X402_DISPLAY_PRICE_STABLEENRICH_10_USD,
} from './x402Pricing.js';

/**
 * @typedef {'none' | 'query' | 'url' | 'urls' | 'email' | 'domain' | 'placeId' | 'textQuery' | 'redditUrl' | 'body'} StableenrichGate
 */

/**
 * @param {string} slug
 * @param {string} stableenrichPath
 * @param {string} name
 * @param {string} description
 * @param {object} opts
 */
function row(slug, stableenrichPath, name, description, opts) {
  return {
    slug,
    stableenrichPath,
    name,
    description,
    method: opts.method || 'POST',
    asyncJob: opts.asyncJob || false,
    priceUsd: opts.priceUsd,
    displayPriceUsd: opts.displayPriceUsd,
    gate: opts.gate || 'none',
  };
}

/** @type {ReturnType<typeof row>[]} */
const SPECS = [
  row(
    'exa-search',
    '/api/exa/search',
    'StableEnrich: Exa search',
    'Semantic web search via Exa. Params: query or q (required); optional category (people, company, news, linkedin profile, etc.), numResults.',
    { priceUsd: X402_API_PRICE_STABLEENRICH_01_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_01_USD, gate: 'query' }
  ),
  row(
    'exa-contents',
    '/api/exa/contents',
    'StableEnrich: Exa URL contents',
    'Extract markdown/content from URLs. Params: urls (required, comma-separated or JSON array). Cheaper bulk scrape alternative.',
    {
      priceUsd: X402_API_PRICE_STABLEENRICH_0002_USD,
      displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_0002_USD,
      gate: 'urls',
    }
  ),
  row(
    'exa-answer',
    '/api/exa/answer',
    'StableEnrich: Exa answer',
    'AI answer with web grounding. Params: query or q (required).',
    { priceUsd: X402_API_PRICE_STABLEENRICH_01_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_01_USD, gate: 'query' }
  ),
  row(
    'exa-find-similar',
    '/api/exa/find-similar',
    'StableEnrich: Exa find similar',
    'Find pages similar to a URL. Params: url (required); optional numResults.',
    { priceUsd: X402_API_PRICE_STABLEENRICH_01_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_01_USD, gate: 'url' }
  ),
  row(
    'firecrawl-scrape',
    '/api/firecrawl/scrape',
    'StableEnrich: Firecrawl scrape',
    'Scrape a single URL to clean markdown. Params: url (required). Prefer for one-page extraction.',
    {
      priceUsd: X402_API_PRICE_STABLEENRICH_0126_USD,
      displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_0126_USD,
      gate: 'url',
    }
  ),
  row(
    'firecrawl-search',
    '/api/firecrawl/search',
    'StableEnrich: Firecrawl search',
    'Search web and return scraped results. Params: query or q (required); optional limit.',
    {
      priceUsd: X402_API_PRICE_STABLEENRICH_0252_USD,
      displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_0252_USD,
      gate: 'query',
    }
  ),
  row(
    'apollo-people-search',
    '/api/apollo/people-search',
    'StableEnrich: Apollo people search',
    'B2B people search. Params: q_keywords or q; optional per_page, page. Follow with apollo-people-enrich for full names.',
    { priceUsd: X402_API_PRICE_STABLEENRICH_02_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_02_USD, gate: 'none' }
  ),
  row(
    'apollo-org-search',
    '/api/apollo/org-search',
    'StableEnrich: Apollo org search',
    'Company/org search — use before people-search by org. Params: q_keywords or q; optional per_page.',
    { priceUsd: X402_API_PRICE_STABLEENRICH_02_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_02_USD, gate: 'none' }
  ),
  row(
    'apollo-people-enrich',
    '/api/apollo/people-enrich',
    'StableEnrich: Apollo people enrich',
    'Enrich a person profile. Params: email or id (Apollo person id from search).',
    {
      priceUsd: X402_API_PRICE_STABLEENRICH_0495_USD,
      displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_0495_USD,
      gate: 'email',
    }
  ),
  row(
    'apollo-org-enrich',
    '/api/apollo/org-enrich',
    'StableEnrich: Apollo org enrich',
    'Enrich company by domain. Params: domain (required, e.g. apollo.io).',
    { priceUsd: X402_API_PRICE_STABLEENRICH_0495_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_0495_USD, gate: 'domain' }
  ),
  row(
    'google-maps-text-search',
    '/api/google-maps/text-search/partial',
    'StableEnrich: Google Maps text search',
    'Find places by text query (partial fields, lower cost). Params: textQuery or query (required).',
    { priceUsd: X402_API_PRICE_STABLEENRICH_02_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_02_USD, gate: 'textQuery' }
  ),
  row(
    'google-maps-place-details',
    '/api/google-maps/place-details/partial',
    'StableEnrich: Google Maps place details',
    'Place details by ID (GET). Params: placeId (required).',
    {
      method: 'GET',
      priceUsd: X402_API_PRICE_STABLEENRICH_02_USD,
      displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_02_USD,
      gate: 'placeId',
    }
  ),
  row(
    'reddit-search',
    '/api/reddit/search',
    'StableEnrich: Reddit search',
    'Search Reddit posts (truncated previews). Params: query (required). Use reddit-post-comments for full thread.',
    { priceUsd: X402_API_PRICE_STABLEENRICH_02_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_02_USD, gate: 'query' }
  ),
  row(
    'reddit-post-comments',
    '/api/reddit/post-comments',
    'StableEnrich: Reddit post + comments',
    'Full post text and comments. Params: url (required, Reddit permalink).',
    {
      priceUsd: X402_API_PRICE_STABLEENRICH_02_USD,
      displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_02_USD,
      gate: 'redditUrl',
    }
  ),
  row(
    'serper-news',
    '/api/serper/news',
    'StableEnrich: Serper news',
    'Google News search. Params: q or query (required); optional num, gl, hl.',
    { priceUsd: X402_API_PRICE_STABLEENRICH_04_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_04_USD, gate: 'query' }
  ),
  row(
    'hunter-email-verifier',
    '/api/hunter/email-verifier',
    'StableEnrich: Hunter email verify',
    'Verify email deliverability. Params: email (required).',
    { priceUsd: X402_API_PRICE_STABLEENRICH_03_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_03_USD, gate: 'email' }
  ),
  row(
    'minerva-resolve',
    '/api/minerva/resolve',
    'StableEnrich: Minerva resolve',
    'Resolve person to Minerva PID + LinkedIn. Pass body JSON with records array (name, email, phone).',
    { priceUsd: X402_API_PRICE_STABLEENRICH_02_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_02_USD, gate: 'body' }
  ),
  row(
    'minerva-enrich',
    '/api/minerva/enrich',
    'StableEnrich: Minerva enrich',
    'Enrich demographics, contacts, work history. Pass body JSON with records (minerva_pid, linkedin_url, or name+email).',
    { priceUsd: X402_API_PRICE_STABLEENRICH_05_USD, displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_05_USD, gate: 'body' }
  ),
  row(
    'cloudflare-crawl',
    '/api/cloudflare/crawl',
    'StableEnrich: Cloudflare site crawl',
    'Multi-page website crawl (async ~30–120s). Params: url (required); optional limit, depth, render. Returns crawled markdown pages.',
    {
      asyncJob: true,
      priceUsd: X402_API_PRICE_STABLEENRICH_10_USD,
      displayPriceUsd: X402_DISPLAY_PRICE_STABLEENRICH_10_USD,
      gate: 'url',
    }
  ),
];

export const STABLEENRICH_AGENT_TOOLS = SPECS.map((s) => ({
  id: `stableenrich-${s.slug}`,
  path: `/stableenrich/${s.slug}`,
  stableenrichPath: s.stableenrichPath,
  stableenrichMethod: s.method,
  stableenrichAsync: s.asyncJob,
  method: s.method,
  priceUsd: s.priceUsd,
  displayPriceUsd: s.displayPriceUsd,
  name: s.name,
  description: s.description,
}));

/** @type {Record<string, StableenrichGate>} */
export const STABLEENRICH_TOOL_GATES = Object.fromEntries(
  SPECS.map((s) => [`stableenrich-${s.slug}`, s.gate])
);

/** @type {Record<string, boolean>} */
export const STABLEENRICH_TOOL_ASYNC = Object.fromEntries(
  SPECS.map((s) => [`stableenrich-${s.slug}`, s.asyncJob])
);

/**
 * @param {string} toolId
 * @param {Record<string, string>} p
 * @returns {string[] | null}
 */
export function getStableenrichGateMissing(toolId, p) {
  const gate = STABLEENRICH_TOOL_GATES[toolId];
  if (!gate || gate === 'none') return null;

  const has = (k) => p[k] != null && String(p[k]).trim() !== '';

  if (gate === 'query' && !has('query') && !has('q') && !has('keyword')) {
    return ['query or q'];
  }
  if (gate === 'url' && !has('url')) return ['url'];
  if (gate === 'urls' && !has('urls') && !has('url')) return ['urls (comma-separated or JSON array)'];
  if (gate === 'email' && !has('email') && !has('id') && !has('person_id')) {
    return ['email or id'];
  }
  if (gate === 'domain' && !has('domain')) return ['domain'];
  if (gate === 'placeId' && !has('placeId') && !has('place_id')) return ['placeId'];
  if (gate === 'textQuery' && !has('textQuery') && !has('query') && !has('q')) {
    return ['textQuery or query'];
  }
  if (gate === 'redditUrl' && !has('url')) return ['url (Reddit post permalink)'];
  if (gate === 'body' && !has('body') && !has('body_json') && !has('bodyJson')) {
    return ['body (JSON string with records array)'];
  }
  return null;
}

/**
 * @param {string} toolId
 */
export function getStableenrichParamsHintForLlm(toolId) {
  const gate = STABLEENRICH_TOOL_GATES[toolId];
  if (gate === 'query') {
    return 'Params: query or q (required). Optional category, numResults, limit — or body JSON for full Exa/Firecrawl payload.';
  }
  if (gate === 'url') return 'Params: url (required). Optional body JSON for advanced options.';
  if (gate === 'urls') return 'Params: urls (required) — comma-separated URLs or JSON array string.';
  if (gate === 'email') return 'Params: email or id (Apollo person id).';
  if (gate === 'domain') return 'Params: domain (required, e.g. stripe.com).';
  if (gate === 'placeId') return 'Params: placeId (required) — Google Maps place ID.';
  if (gate === 'textQuery') return 'Params: textQuery or query (required), e.g. coffee shops in San Francisco.';
  if (gate === 'redditUrl') return 'Params: url (required) — full Reddit post URL.';
  if (gate === 'body') return 'Params: body (required JSON string) — Minerva records array per stableenrich.dev docs.';
  if (toolId === 'stableenrich-cloudflare-crawl') {
    return 'Params: url (required); optional limit (max 25), depth (max 3), render true|false. Async — may take 30–120s.';
  }
  if (gate === 'none') {
    return 'Optional q_keywords/q for Apollo search; or body JSON. For org-filtered people search, run apollo-org-search first.';
  }
  return 'Optional body JSON string to pass through to StableEnrich.';
}
