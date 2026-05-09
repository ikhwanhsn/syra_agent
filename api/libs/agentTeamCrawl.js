/**
 * Agent team: crawl Syra public surfaces via Cloudflare Browser Rendering crawl API,
 * plus direct JSON fetches for API discovery docs on api.syraa.fun.
 */

import {
  getCloudflareCrawlConfig,
  startCrawl,
  pollCrawlUntilComplete,
} from "./cloudflareCrawl.js";
import {
  AGENT_TEAM_API_DISCOVERY_HOST,
  AGENT_TEAM_CRAWL_BASE_URLS,
  AGENT_TEAM_CRAWL_DEPTH,
  AGENT_TEAM_CRAWL_PER_SITE_LIMIT,
} from "../config/internalPipelineAgents.js";

/** Per-page markdown cap before LLM (characters). */
const DEFAULT_PAGE_MARKDOWN_MAX = 8192;

/** Total snapshot string budget (sum of markdown lengths, characters). */
const DEFAULT_SNAPSHOT_TOTAL_MAX = 200_000;

/** Public API discovery endpoints. These are the only api.syraa.fun paths exposed to the crawler. */
const API_DISCOVERY_PATHS = Object.freeze(["/openapi.json", "/.well-known/x402"]);

/**
 * Substrings that identify an auth-wall / "you need a key" response body — usually rendered
 * when the headless crawler hits a protected endpoint. Matching records are dropped from the
 * snapshot to prevent the LLM from hallucinating a "site-wide 401" recommendation.
 */
const AUTH_WALL_MARKERS = Object.freeze([
  "missing api key or bearer token",
  "invalid api key or bearer token",
  "401 unauthorized",
  "http 401",
  "status code 401",
  "authentication required",
  "vercel authentication",
  "this deployment is protected",
  "deployment is password protected",
  "sign in to vercel",
  "x-payment header",
  '"x402version"',
]);

/**
 * Static description of the API surface's auth model. Injected into the snapshot as a
 * synthetic page so the LLM grounds its understanding of api.syraa.fun on facts instead of
 * inferring from rendered error pages.
 */
const API_AUTH_CONTEXT_MARKDOWN = `# Syra API host — auth model (INTERNAL CONTEXT — api.syraa.fun ONLY)

**Scope:** This section describes **only** the JSON/HTTP API at https://api.syraa.fun. It does **not**
describe the marketing site (syraa.fun), docs (docs.syraa.fun), web agent (agent.syraa.fun), or
playground (playground.syraa.fun). Those apps are static/SPA deployments that normal browsers reach
without site-wide login; do **not** infer that they return API-style Unauthorized responses just
because this paragraph discusses API security.

The API is intentionally protected and is NOT deep-crawled here. Most routes use either:

- **API key / Bearer token** (non-paid routes): trusted browser apps receive keys via server-side
  injection; anonymous programmatic clients get **Unauthorized** without a key — expected for the
  API host only.
- **x402 micropayments** (paid routes): unpaid requests get **Payment Required** with offer metadata
  — expected for the API host only.

Public discovery (no key) on the API host: GET /openapi.json and GET /.well-known/x402.

Never label landing/docs/agent/playground as "returning 401" based solely on this API-auth summary.`;

/** @returns {CrawlSnapshotItem} */
function buildApiAuthContextItem() {
  return {
    url: `${AGENT_TEAM_API_DISCOVERY_HOST.replace(/\/+$/, "")}/_meta/auth-model`,
    title: "API auth model (crawler context)",
    markdown: API_AUTH_CONTEXT_MARKDOWN,
  };
}

/**
 * Detects rendered auth-wall / 401 / 402 content. Used to drop noise records before the LLM
 * sees them so a single protected page can never cascade into a false "site-wide 401" finding.
 * @param {string} markdown
 * @returns {boolean}
 */
export function looksLikeAuthWall(markdown) {
  if (typeof markdown !== "string" || !markdown) return false;
  const sample = markdown.slice(0, 2000).toLowerCase();
  return AUTH_WALL_MARKERS.some((marker) => sample.includes(marker));
}

/**
 * @typedef {{ url: string; title: string; markdown: string }} CrawlSnapshotItem
 */

/**
 * @param {string} s
 * @param {number} max
 * @returns {string}
 */
function truncateChars(s, max) {
  if (typeof s !== "string" || s.length <= max) return typeof s === "string" ? s : "";
  return `${s.slice(0, max)}…`;
}

/** @returns {string[]} */
export function getAgentTeamBaseUrls() {
  return [...AGENT_TEAM_CRAWL_BASE_URLS];
}

/**
 * Fetch Syra API discovery JSON endpoints as pseudo-pages. Replaces deep-crawling api.syraa.fun
 * (which would hit auth-protected endpoints and return 401/402 to the headless crawler).
 *
 * @param {string} apiBase
 * @param {number} pageMax
 * @returns {Promise<CrawlSnapshotItem[]>}
 */
async function fetchApiJsonSnapshots(apiBase, pageMax) {
  const root = apiBase.replace(/\/+$/, "");
  /** @type {CrawlSnapshotItem[]} */
  const out = [];

  for (const path of API_DISCOVERY_PATHS) {
    const url = `${root}${path}`;
    try {
      const signal =
        typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(45_000)
          : undefined;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json, */*",
          "User-Agent": "SyraAgentTeam/1.0",
        },
        signal,
      });
      const text = await res.text();
      const title = path === "/openapi.json" ? "OpenAPI" : "x402 discovery";
      let body = text;
      try {
        const parsed = JSON.parse(text);
        body = JSON.stringify(parsed, null, 0);
      } catch {
        /* keep raw */
      }
      out.push({
        url,
        title,
        markdown: truncateChars(body, pageMax),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      out.push({
        url,
        title: "fetch-error",
        markdown: truncateChars(`Fetch failed: ${msg}`, pageMax),
      });
    }
  }
  return out;
}

/**
 * Deduplicate by URL (first wins).
 * @param {CrawlSnapshotItem[]} items
 * @returns {CrawlSnapshotItem[]}
 */
function dedupeByUrl(items) {
  const seen = new Set();
  /** @type {CrawlSnapshotItem[]} */
  const out = [];
  for (const it of items) {
    const u = String(it.url || "").trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(it);
  }
  return out;
}

/**
 * Trim total markdown size across items (drops trailing items if over budget).
 * @param {CrawlSnapshotItem[]} items
 * @param {number} totalMax
 * @returns {CrawlSnapshotItem[]}
 */
function trimSnapshotTotal(items, totalMax) {
  /** @type {CrawlSnapshotItem[]} */
  const out = [];
  let used = 0;
  for (const it of items) {
    const md = typeof it.markdown === "string" ? it.markdown : "";
    const next = used + md.length;
    if (next > totalMax) {
      const room = totalMax - used;
      if (room > 200) {
        out.push({
          ...it,
          markdown: truncateChars(md, room),
        });
      }
      break;
    }
    out.push(it);
    used = next;
  }
  return out;
}

/**
 * Crawl all configured Syra surfaces (one Cloudflare job per base URL) and return a bounded snapshot for LLMs.
 *
 * @param {{
 *   depth?: number;
 *   perSiteLimit?: number;
 *   pageMarkdownMax?: number;
 *   snapshotTotalMax?: number;
 * }} [options]
 * @returns {Promise<{ snapshot: CrawlSnapshotItem[]; generatedAt: string; baseUrls: string[] }>}
 */
export async function crawlSyraSurfaces(options = {}) {
  const cfg = getCloudflareCrawlConfig();
  if (!cfg) {
    throw new Error(
      "Cloudflare crawl not configured: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN",
    );
  }

  const depth = Math.min(
    10,
    Math.max(1, Number(options.depth ?? AGENT_TEAM_CRAWL_DEPTH) || AGENT_TEAM_CRAWL_DEPTH),
  );
  const perSiteLimit = Math.min(
    500,
    Math.max(
      1,
      Number(options.perSiteLimit ?? AGENT_TEAM_CRAWL_PER_SITE_LIMIT) ||
        AGENT_TEAM_CRAWL_PER_SITE_LIMIT,
    ),
  );
  const pageMax =
    typeof options.pageMarkdownMax === "number" && options.pageMarkdownMax > 0
      ? options.pageMarkdownMax
      : DEFAULT_PAGE_MARKDOWN_MAX;
  const totalMax =
    typeof options.snapshotTotalMax === "number" && options.snapshotTotalMax > 0
      ? options.snapshotTotalMax
      : DEFAULT_SNAPSHOT_TOTAL_MAX;

  const baseUrls = getAgentTeamBaseUrls();
  /** @type {CrawlSnapshotItem[]} */
  const snapshot = [];

  for (const base of baseUrls) {
    const seed = base.startsWith("http") ? base : `https://${base}`;
    try {
      const jobId = await startCrawl(cfg.accountId, cfg.apiToken, {
        url: seed,
        limit: perSiteLimit,
        depth,
        formats: ["markdown"],
        render: true,
        source: "all",
      });
      const result = await pollCrawlUntilComplete(cfg.accountId, cfg.apiToken, jobId, {
        maxAttempts: 40,
        delayMs: 5000,
      });
      const records = Array.isArray(result.records) ? result.records : [];
      let droppedAuthWall = 0;
      for (const rec of records) {
        const status = String(rec?.status || "");
        if (status !== "completed") continue;
        const md = typeof rec.markdown === "string" ? rec.markdown : "";
        if (!md.trim()) continue;
        // Defensive: skip pages that look like auth walls / 401 / 402 renders so a single
        // protected page can never poison the LLM into reporting a "site-wide 401" bug.
        if (looksLikeAuthWall(md)) {
          droppedAuthWall += 1;
          continue;
        }
        const url = typeof rec.url === "string" ? rec.url : rec?.metadata?.url || seed;
        const title =
          (rec.metadata && typeof rec.metadata.title === "string" && rec.metadata.title) ||
          url;
        snapshot.push({
          url: String(url),
          title: String(title),
          markdown: truncateChars(md, pageMax),
        });
      }
      if (droppedAuthWall > 0) {
        console.info(
          `[agent-team-crawl] dropped ${droppedAuthWall} auth-wall pages from ${seed}`,
        );
      }
      if (records.length === 0 && result.status && result.status !== "completed") {
        snapshot.push({
          url: seed,
          title: "crawl-status",
          markdown: truncateChars(`Crawl finished with status: ${result.status}`, pageMax),
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      snapshot.push({
        url: seed,
        title: "crawl-error",
        markdown: truncateChars(`Crawl failed: ${msg}`, pageMax),
      });
    }
  }

  // API surface: never deep-crawl (it's behind API key / x402 auth and would 401 to the
  // headless crawler). Always inject the static auth-model context page plus the public
  // discovery JSON snapshots.
  snapshot.push(buildApiAuthContextItem());
  const apiExtras = await fetchApiJsonSnapshots(AGENT_TEAM_API_DISCOVERY_HOST, pageMax);
  snapshot.push(...apiExtras);

  const deduped = dedupeByUrl(snapshot);
  const trimmed = trimSnapshotTotal(deduped, totalMax);

  return {
    snapshot: trimmed,
    generatedAt: new Date().toISOString(),
    baseUrls: [...baseUrls, AGENT_TEAM_API_DISCOVERY_HOST],
  };
}
