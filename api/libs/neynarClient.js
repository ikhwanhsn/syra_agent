/**
 * Neynar Farcaster API client.
 * Set NEYNAR_API_KEY in .env. Optional NEYNAR_SIGNER_UUID for write operations.
 * @see https://docs.neynar.com | https://github.com/BankrBot/skills/tree/main/neynar
 */

const BASE_URL = (process.env.NEYNAR_API_URL || "https://api.neynar.com").replace(/\/$/, "");
const API_KEY = (process.env.NEYNAR_API_KEY || "").trim();
const SIGNER_UUID = (process.env.NEYNAR_SIGNER_UUID || "").trim();
const TIMEOUT_MS = Number(process.env.NEYNAR_TIMEOUT_MS) || 15_000;

function headers() {
  const h = { Accept: "application/json", "Content-Type": "application/json" };
  if (API_KEY) h["x-api-key"] = API_KEY;
  return h;
}

async function request(method, path, query = {}, body = null) {
  if (!API_KEY) {
    return { ok: false, status: 503, data: { error: "NEYNAR_API_KEY not configured" } };
  }
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method,
      headers: headers(),
      signal: controller.signal,
      ...(body != null && method !== "GET" ? { body: JSON.stringify(body) } : {}),
    });
    clearTimeout(to);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(to);
    return { ok: false, status: 502, data: { error: err.name === "AbortError" ? "Neynar request timeout" : (err.message || String(err)) } };
  }
}

/** GET /v2/farcaster/user/bulk – users by FID(s) */
export async function getUsersByFids(fids) {
  const list = Array.isArray(fids) ? fids : [fids].filter(Boolean).map(Number);
  if (list.length === 0) return { error: "fids required" };
  const { ok, status, data } = await request("GET", "/v2/farcaster/user/bulk", { fids: list.join(",") });
  if (!ok) return { error: data?.message || data?.error || `Neynar error ${status}` };
  return { users: data?.users ?? data };
}

/** GET /v2/farcaster/user/by_username – user by username */
export async function getUserByUsername(username) {
  if (!username || typeof username !== "string") return { error: "username required" };
  const { ok, status, data } = await request("GET", "/v2/farcaster/user/by_username", { username: username.trim() });
  if (!ok) return { error: data?.message || data?.error || `Neynar error ${status}` };
  return { user: data?.user ?? data };
}

/** GET /v2/farcaster/feed – feed (feed_type: following, channel, trending; filter_type; fid; channel_id) */
export async function getFeed(opts = {}) {
  const { feedType = "trending", filterType, fid, channelId, limit = 25, cursor } = opts;
  const q = { limit };
  if (feedType) q.feed_type = feedType;
  if (filterType) q.filter_type = filterType;
  if (fid != null) q.fid = fid;
  if (channelId != null) q.channel_id = channelId;
  if (cursor) q.cursor = cursor;
  const { ok, status, data } = await request("GET", "/v2/farcaster/feed", q);
  if (!ok) return { error: data?.message || data?.error || `Neynar error ${status}` };
  return { casts: data?.casts ?? data?.feed ?? [], cursor: data?.next?.cursor, next: data?.next };
}

/** GET /v2/farcaster/cast – single cast by hash or URL */
export async function getCast(identifier) {
  if (!identifier || typeof identifier !== "string") return { error: "identifier (hash or URL) required" };
  const { ok, status, data } = await request("GET", "/v2/farcaster/cast", { identifier: identifier.trim() });
  if (!ok) return { error: data?.message || data?.error || `Neynar error ${status}` };
  return { cast: data?.cast ?? data };
}

/** GET /v2/farcaster/cast/search – search casts */
export async function searchCasts(q, opts = {}) {
  if (!q || typeof q !== "string" || !q.trim()) return { error: "query q required" };
  const { limit = 20, channelId, cursor } = opts;
  const params = { q: q.trim(), limit };
  if (channelId) params.channel_id = channelId;
  if (cursor) params.cursor = cursor;
  const { ok, status, data } = await request("GET", "/v2/farcaster/cast/search", params);
  if (!ok) return { error: data?.message || data?.error || `Neynar error ${status}` };
  return { casts: data?.casts ?? data?.result ?? [], cursor: data?.next?.cursor, next: data?.next };
}

export const neynarConfig = { configured: !!API_KEY, hasSigner: !!SIGNER_UUID };
