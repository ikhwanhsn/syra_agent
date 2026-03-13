/**
 * Cloudflare Browser Rendering /crawl API client.
 * See: https://developers.cloudflare.com/browser-rendering/rest-api/crawl-endpoint/
 *
 * Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (Bearer).
 */

const CLOUDFLARE_BR_BASE = "https://api.cloudflare.com/client/v4/accounts";

/**
 * @returns {{ accountId: string; apiToken: string } | null}
 */
export function getCloudflareCrawlConfig() {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_BEARER_TOKEN || "").trim();
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken };
}

/**
 * Start a crawl job.
 * @param {string} accountId
 * @param {string} apiToken
 * @param {{ url: string; limit?: number; depth?: number; formats?: string[]; render?: boolean; source?: string }} opts
 * @returns {Promise<string>} job id
 */
export async function startCrawl(accountId, apiToken, opts) {
  const { url, limit = 20, depth = 2, formats = ["markdown"], render = true, source = "all" } = opts;
  if (!url || typeof url !== "string" || !url.trim()) {
    throw new Error("url is required");
  }
  const body = {
    url: url.trim(),
    limit: Math.min(Math.max(1, Number(limit) || 20), 500),
    depth: Math.min(Math.max(1, Number(depth) || 2), 10),
    formats: Array.isArray(formats) ? formats : ["markdown"],
    render: !!render,
    source,
  };
  const res = await fetch(`${CLOUDFLARE_BR_BASE}/${accountId}/browser-rendering/crawl`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.[0]?.message || data?.message || res.statusText || "Cloudflare crawl start failed";
    throw new Error(`${res.status}: ${msg}`);
  }
  const jobId = data?.result;
  if (!jobId || typeof jobId !== "string") {
    throw new Error("Cloudflare did not return a crawl job id");
  }
  return jobId;
}

/**
 * Get crawl job status and optionally records.
 * @param {string} accountId
 * @param {string} apiToken
 * @param {string} jobId
 * @param {{ limit?: number; status?: string }} query
 * @returns {Promise<{ status: string; total?: number; finished?: number; records?: Array<{ url: string; status: string; markdown?: string; html?: string; metadata?: { title?: string; url?: string } }>; cursor?: number }>}
 */
export async function getCrawlResult(accountId, apiToken, jobId, query = {}) {
  const params = new URLSearchParams();
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.status != null) params.set("status", query.status);
  const qs = params.toString();
  const url = `${CLOUDFLARE_BR_BASE}/${accountId}/browser-rendering/crawl/${encodeURIComponent(jobId)}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.[0]?.message || data?.message || res.statusText || "Cloudflare crawl get failed";
    throw new Error(`${res.status}: ${msg}`);
  }
  return data?.result ?? {};
}

/**
 * Poll crawl job until terminal status or timeout.
 * @param {string} accountId
 * @param {string} apiToken
 * @param {string} jobId
 * @param {{ maxAttempts?: number; delayMs?: number }} options
 * @returns {Promise<{ status: string; total?: number; finished?: number; records?: Array<{ url: string; status: string; markdown?: string; metadata?: { title?: string } }> }>}
 */
export async function pollCrawlUntilComplete(accountId, apiToken, jobId, options = {}) {
  const { maxAttempts = 24, delayMs = 5000 } = options;
  const terminal = ["completed", "errored", "cancelled_by_user", "cancelled_due_to_limits", "cancelled_due_to_timeout"];
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getCrawlResult(accountId, apiToken, jobId, { limit: 1 });
    const status = result?.status ?? "unknown";
    if (terminal.includes(status)) {
      // Fetch full results (no limit) for completed jobs so we have records
      if (status === "completed") {
        const full = await getCrawlResult(accountId, apiToken, jobId, { status: "completed" });
        return full;
      }
      return result;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Crawl job did not complete within timeout");
}
