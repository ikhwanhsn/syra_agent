/**
 * StableEnrich API (https://stableenrich.dev) — x402 POST/GET + Cloudflare crawl async SIWX poll.
 * @see https://stableenrich.dev/llms.txt
 */
import { getAgentKeypair } from './agentWallet.js';
import { callX402V2WithAgent } from './agentX402Client.js';
import { fetchWithSiwx } from './agentSiwxClient.js';

const STABLEENRICH_BASE = (process.env.STABLEENRICH_API_BASE_URL || 'https://stableenrich.dev').replace(
  /\/$/,
  ''
);

const CF_POLL_INTERVAL_MS = Number(process.env.STABLEENRICH_CF_POLL_INTERVAL_MS) || 4000;
const CF_POLL_MAX_ATTEMPTS = Number(process.env.STABLEENRICH_CF_POLL_MAX_ATTEMPTS) || 45;

const CLOUDFLARE_CRAWL_PATH = '/api/cloudflare/crawl';
const CLOUDFLARE_JOBS_PATH = '/api/cloudflare/jobs';

function trim(v) {
  return v != null ? String(v).trim() : '';
}

/**
 * @param {Record<string, string>} params
 * @returns {Record<string, unknown> | undefined}
 */
function parseBodyOverride(params) {
  const raw = params.body ?? params.body_json ?? params.bodyJson;
  if (!trim(raw)) return undefined;
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('body must be a JSON object');
    }
    return /** @type {Record<string, unknown>} */ (parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON in body: ${msg}`);
  }
}

/**
 * @param {string} raw
 * @returns {string[]}
 */
function parseListParam(raw) {
  const t = trim(raw);
  if (!t) return [];
  if (t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      /* fall through */
    }
  }
  return t
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {string} stableenrichPath
 * @param {'GET' | 'POST'} method
 * @param {Record<string, string>} params
 * @returns {{ method: 'GET' | 'POST'; body?: Record<string, unknown>; query?: Record<string, string> }}
 */
export function buildStableenrichRequest(stableenrichPath, method, params) {
  const override = parseBodyOverride(params);
  const path = stableenrichPath.startsWith('/') ? stableenrichPath : `/${stableenrichPath}`;

  if (method === 'GET') {
    const query = /** @type {Record<string, string>} */ ({});
    if (override) {
      for (const [k, v] of Object.entries(override)) {
        if (v != null && v !== '') query[k] = String(v);
      }
      return { method: 'GET', query };
    }
    if (path.includes('/place-details/')) {
      const placeId = trim(params.placeId || params.place_id);
      if (!placeId) throw new Error('placeId is required for Google Maps place details');
      query.placeId = placeId;
      return { method: 'GET', query };
    }
    if (path.includes('/solar/building-insights')) {
      const latitude = trim(params.latitude || params.lat);
      const longitude = trim(params.longitude || params.lng || params.lon);
      if (!latitude || !longitude) throw new Error('latitude and longitude are required');
      query.latitude = latitude;
      query.longitude = longitude;
      if (trim(params.requiredQuality)) query.requiredQuality = trim(params.requiredQuality);
      return { method: 'GET', query };
    }
    if (path.includes('/aerial-view/lookup-video')) {
      const address = trim(params.address);
      const videoId = trim(params.videoId || params.video_id);
      if (address) query.address = address;
      else if (videoId) query.videoId = videoId;
      else throw new Error('address or videoId is required');
      return { method: 'GET', query };
    }
    throw new Error(`GET ${path} requires body JSON or supported flat params`);
  }

  if (override) return { method: 'POST', body: override };

  const body = /** @type {Record<string, unknown>} */ ({});

  if (path === '/api/exa/search' || path === '/api/exa/answer' || path === '/api/firecrawl/search') {
    const query = trim(params.query || params.q || params.keyword);
    if (!query) throw new Error('query (or q) is required');
    body.query = query;
    if (trim(params.category)) body.category = trim(params.category);
    if (trim(params.numResults)) body.numResults = Number(params.numResults) || 5;
    if (trim(params.limit)) body.limit = Number(params.limit) || 5;
    return { method: 'POST', body };
  }

  if (path === '/api/exa/find-similar') {
    const url = trim(params.url);
    if (!url) throw new Error('url is required');
    body.url = url;
    if (trim(params.numResults)) body.numResults = Number(params.numResults) || 5;
    return { method: 'POST', body };
  }

  if (path === '/api/exa/contents') {
    const urls = parseListParam(params.urls || params.url);
    if (!urls.length) throw new Error('urls is required (comma-separated or JSON array)');
    body.urls = urls;
    return { method: 'POST', body };
  }

  if (path === '/api/firecrawl/scrape') {
    const url = trim(params.url);
    if (!url) throw new Error('url is required');
    body.url = url;
    return { method: 'POST', body };
  }

  if (path === '/api/apollo/people-search' || path === '/api/apollo/org-search') {
    const q = trim(params.q_keywords || params.q || params.keyword);
    if (q) body.q_keywords = q;
    if (trim(params.per_page)) body.per_page = Number(params.per_page) || 5;
    if (trim(params.page)) body.page = Number(params.page) || 1;
    return { method: 'POST', body };
  }

  if (path === '/api/apollo/people-enrich') {
    const email = trim(params.email);
    const id = trim(params.id || params.person_id);
    if (email) body.email = email;
    else if (id) body.id = id;
    else throw new Error('email or id is required for Apollo people enrich');
    return { method: 'POST', body };
  }

  if (path === '/api/apollo/org-enrich') {
    const domain = trim(params.domain);
    if (!domain) throw new Error('domain is required');
    body.domain = domain;
    return { method: 'POST', body };
  }

  if (path.includes('/google-maps/text-search/')) {
    const textQuery = trim(params.textQuery || params.query || params.q);
    if (!textQuery) throw new Error('textQuery is required');
    body.textQuery = textQuery;
    if (trim(params.maxResultCount)) body.maxResultCount = Number(params.maxResultCount) || 5;
    return { method: 'POST', body };
  }

  if (path === '/api/reddit/search') {
    const query = trim(params.query || params.q);
    if (!query) throw new Error('query is required');
    body.query = query;
    if (trim(params.sort)) body.sort = trim(params.sort);
    if (trim(params.timeframe)) body.timeframe = trim(params.timeframe);
    if (trim(params.maxResults)) body.maxResults = Number(params.maxResults) || 10;
    return { method: 'POST', body };
  }

  if (path === '/api/reddit/post-comments') {
    const url = trim(params.url);
    if (!url) throw new Error('url is required (Reddit post permalink)');
    body.url = url;
    return { method: 'POST', body };
  }

  if (path === '/api/serper/news') {
    const q = trim(params.q || params.query);
    if (!q) throw new Error('q is required');
    body.q = q;
    if (trim(params.num)) body.num = Number(params.num) || 10;
    if (trim(params.gl)) body.gl = trim(params.gl);
    if (trim(params.hl)) body.hl = trim(params.hl);
    return { method: 'POST', body };
  }

  if (path === '/api/hunter/email-verifier') {
    const email = trim(params.email);
    if (!email) throw new Error('email is required');
    body.email = email;
    return { method: 'POST', body };
  }

  if (path === CLOUDFLARE_CRAWL_PATH) {
    const url = trim(params.url);
    if (!url) throw new Error('url is required');
    body.url = url;
    if (trim(params.limit)) body.limit = Number(params.limit) || 10;
    if (trim(params.depth)) body.depth = Number(params.depth) || 1;
    if (trim(params.render)) body.render = params.render === 'true' || params.render === '1';
    return { method: 'POST', body };
  }

  return { method: 'POST', body };
}

/**
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {string} token
 */
async function pollCloudflareCrawlJob(keypair, token) {
  const jobsUrl = `${STABLEENRICH_BASE}${CLOUDFLARE_JOBS_PATH}?token=${encodeURIComponent(token)}`;

  for (let attempt = 0; attempt < CF_POLL_MAX_ATTEMPTS; attempt++) {
    const { ok, status, data } = await fetchWithSiwx(keypair, jobsUrl);
    if (!ok && status !== 200) {
      const err =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        `Cloudflare job poll failed: HTTP ${status}`;
      return { success: false, error: String(err) };
    }

    if (data && typeof data === 'object') {
      const total = Number(data.total) || 0;
      const finished = Number(data.finished) || 0;
      const skipped = Number(data.skipped) || 0;
      if (total > 0 && finished + skipped >= total) {
        return { success: true, data };
      }
      const records = data.records;
      if (Array.isArray(records) && records.length > 0) {
        const queued = records.some(
          (r) => r && typeof r === 'object' && r.status === 'queued'
        );
        if (!queued && finished + skipped >= total) {
          return { success: true, data };
        }
      }
    }

    if (attempt < CF_POLL_MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, CF_POLL_INTERVAL_MS));
    }
  }

  return {
    success: false,
    error: `StableEnrich Cloudflare crawl timed out after ${Math.round(
      (CF_POLL_MAX_ATTEMPTS * CF_POLL_INTERVAL_MS) / 1000
    )}s`,
  };
}

/**
 * @param {string} anonymousId
 * @param {string} stableenrichPath
 * @param {'GET' | 'POST'} method
 * @param {Record<string, string>} params
 * @param {boolean} [asyncJob]
 * @param {string} [connectedWalletAddress]
 */
export async function callStableenrichWithAgent(
  anonymousId,
  stableenrichPath,
  method,
  params,
  asyncJob = false,
  connectedWalletAddress
) {
  try {
    const path = stableenrichPath.startsWith('/') ? stableenrichPath : `/${stableenrichPath}`;
    const req = buildStableenrichRequest(path, method, params);
    const url = `${STABLEENRICH_BASE}${path}`;

    if (!asyncJob) {
      return await callX402V2WithAgent({
        anonymousId,
        url,
        method: req.method,
        query: req.query,
        body: req.body,
        connectedWalletAddress,
      });
    }

    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }

    const trigger = await callX402V2WithAgent({
      anonymousId,
      url,
      method: 'POST',
      body: req.body,
      connectedWalletAddress,
    });

    if (!trigger.success) return trigger;

    const token =
      trigger.data && typeof trigger.data === 'object' && typeof trigger.data.token === 'string'
        ? trigger.data.token
        : null;

    if (!token) {
      return {
        success: false,
        error: 'StableEnrich crawl did not return a job token (expected 202 { token })',
      };
    }

    const polled = await pollCloudflareCrawlJob(keypair, token);
    if (!polled.success) return polled;

    return {
      success: true,
      data: { status: 'finished', token, data: polled.data },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
