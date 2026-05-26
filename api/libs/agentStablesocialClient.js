/**
 * StableSocial API (https://stablesocial.dev) — x402 POST trigger + SIWX poll for job results.
 * @see https://stablesocial.dev/llms.txt
 */
import { getAgentKeypair } from './agentWallet.js';
import { callX402V2WithAgent } from './agentX402Client.js';
import { fetchWithSiwx } from './agentSiwxClient.js';

const STABLESOCIAL_BASE = (process.env.STABLESOCIAL_API_BASE_URL || 'https://stablesocial.dev').replace(
  /\/$/,
  ''
);

const POLL_INTERVAL_MS = Number(process.env.STABLESOCIAL_POLL_INTERVAL_MS) || 2500;
const POLL_MAX_ATTEMPTS = Number(process.env.STABLESOCIAL_POLL_MAX_ATTEMPTS) || 36;

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
 * Build POST JSON body for a StableSocial route from flat agent params.
 * @param {string} stablesocialPath
 * @param {Record<string, string>} params
 */
export function buildStablesocialPostBody(stablesocialPath, params) {
  const override = parseBodyOverride(params);
  if (override) return override;

  const path = stablesocialPath.startsWith('/') ? stablesocialPath : `/${stablesocialPath}`;
  const body = /** @type {Record<string, unknown>} */ ({});

  const handle = trim(params.handle || params.username || params.profile_id);
  if (handle) {
    body.handle = handle;
    if (path.includes('/profile') || path.includes('/posts') || path.includes('/followers')) {
      body.profile_id = handle;
    }
  }

  const keyword = trim(params.keyword || params.q || params.query);
  if (keyword) body.keyword = keyword;

  const hashtag = trim(params.hashtag || params.tag);
  if (hashtag) body.hashtag = hashtag.replace(/^#/, '');

  const postId = trim(params.post_id || params.postId || params.id);
  if (postId) body.post_id = postId;

  const subreddit = trim(params.subreddit || params.sub);
  if (subreddit) body.subreddit = subreddit.replace(/^r\//i, '');

  if (trim(params.cursor)) body.cursor = trim(params.cursor);
  if (trim(params.max_page_size)) body.max_page_size = Number(params.max_page_size) || 50;
  if (trim(params.max_posts)) body.max_posts = Number(params.max_posts) || 50;
  if (trim(params.max_followers)) body.max_followers = Number(params.max_followers) || 500;
  if (trim(params.max_results)) body.max_results = Number(params.max_results) || 50;
  if (trim(params.order_by)) body.order_by = trim(params.order_by);

  return body;
}

/**
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {string} token
 */
async function pollStablesocialJob(keypair, token) {
  const jobsUrl = `${STABLESOCIAL_BASE}/api/jobs?token=${encodeURIComponent(token)}`;

  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const { ok, status, data } = await fetchWithSiwx(keypair, jobsUrl);
    if (!ok && status !== 200) {
      const err =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        `Job poll failed: HTTP ${status}`;
      return { success: false, error: String(err) };
    }

    const jobStatus = data && typeof data === 'object' ? data.status : undefined;
    if (jobStatus === 'finished') {
      return { success: true, data: data.data ?? data };
    }
    if (jobStatus === 'failed') {
      const err = (data && data.error) || 'StableSocial job collection failed';
      return { success: false, error: String(err) };
    }

    if (attempt < POLL_MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }

  return {
    success: false,
    error: `StableSocial job timed out after ${Math.round((POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS) / 1000)}s`,
  };
}

/**
 * @param {string} anonymousId
 * @param {string} stablesocialPath
 * @param {Record<string, string>} params
 * @param {string} [connectedWalletAddress]
 */
export async function callStablesocialWithAgent(
  anonymousId,
  stablesocialPath,
  params,
  connectedWalletAddress
) {
  try {
    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }

    const path = stablesocialPath.startsWith('/') ? stablesocialPath : `/${stablesocialPath}`;
    const body = buildStablesocialPostBody(path, params);
    const url = `${STABLESOCIAL_BASE}${path}`;

    const trigger = await callX402V2WithAgent({
      anonymousId,
      url,
      method: 'POST',
      body,
      connectedWalletAddress,
    });

    if (!trigger.success) {
      return trigger;
    }

    const token =
      trigger.data && typeof trigger.data === 'object' && typeof trigger.data.token === 'string'
        ? trigger.data.token
        : null;

    if (!token) {
      return {
        success: false,
        error: 'StableSocial trigger did not return a job token (expected 202 { token })',
      };
    }

    const polled = await pollStablesocialJob(keypair, token);
    if (!polled.success) {
      return polled;
    }

    return {
      success: true,
      data: {
        status: 'finished',
        token,
        data: polled.data,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
