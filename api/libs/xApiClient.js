/**
 * X (Twitter) API v2 client for app-only (Bearer token) requests.
 * Uses env: X_BEARER_TOKEN. Optional: X_CONSUMER_KEY, X_SECRET_KEY for OAuth flows later.
 * @see https://docs.x.com/x-api/introduction
 */

const X_API_BASE = "https://api.x.com/2";

/**
 * @returns {string|null} Bearer token or null if not configured
 */
function getBearerToken() {
  const token = (process.env.X_BEARER_TOKEN || "").trim();
  return token || null;
}

/**
 * Make a GET request to X API v2 with Bearer auth.
 * @param {string} path - Path without base (e.g. "users/by/username/syra_agent")
 * @param {Record<string, string>} [params] - Query params
 * @returns {Promise<{ data?: unknown; errors?: Array<{ message: string }> }>}
 */
export async function xApiGet(path, params = {}) {
  const token = getBearerToken();
  if (!token) {
    return { errors: [{ message: "X_BEARER_TOKEN is not set" }] };
  }

  const url = new URL(`${X_API_BASE}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      errors: body.errors || [{ message: body.detail || body.message || `HTTP ${res.status}` }],
    };
  }

  return body;
}

/**
 * Get user by username.
 * @param {string} username - Without @
 * @param {string} [userFields] - e.g. "created_at,description,public_metrics,verified"
 */
export async function getUserByUsername(username, userFields = "created_at,description,public_metrics,verified") {
  if (!username || !String(username).trim()) {
    return { errors: [{ message: "username is required" }] };
  }
  const clean = String(username).trim().replace(/^@/, "");
  const params = {};
  if (userFields) params["user.fields"] = userFields;
  return xApiGet(`users/by/username/${encodeURIComponent(clean)}`, params);
}

/**
 * Search recent tweets (last 7 days). Available to all developers.
 * @param {string} query - Query (e.g. "crypto lang:en", "from:syra_agent")
 * @param {object} [opts]
 * @param {number} [opts.max_results=10] - 10–100
 * @param {string} [opts.tweetFields] - e.g. "created_at,public_metrics,author_id"
 */
export async function searchRecentTweets(
  query,
  opts = {}
) {
  const { max_results = 10, tweetFields = "created_at,public_metrics,author_id,text" } = opts;
  if (!query || !String(query).trim()) {
    return { errors: [{ message: "query is required" }] };
  }
  const params = {
    query: String(query).trim(),
    max_results: Math.min(100, Math.max(10, Number(max_results) || 10)),
  };
  if (tweetFields) params["tweet.fields"] = tweetFields;
  return xApiGet("tweets/search/recent", params);
}

/**
 * Get recent tweets for a user by ID.
 * @param {string} userId - X user ID
 * @param {object} [opts]
 * @param {number} [opts.max_results=10] - 5–100
 * @param {string} [opts.tweetFields]
 */
export async function getUserTweets(userId, opts = {}) {
  const { max_results = 10, tweetFields = "created_at,public_metrics,text" } = opts;
  if (!userId || !String(userId).trim()) {
    return { errors: [{ message: "userId is required" }] };
  }
  const params = {
    max_results: Math.min(100, Math.max(5, Number(max_results) || 10)),
  };
  if (tweetFields) params["tweet.fields"] = tweetFields;
  return xApiGet(`users/${encodeURIComponent(String(userId).trim())}/tweets`, params);
}
