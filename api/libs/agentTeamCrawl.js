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
  AGENT_TEAM_CRAWL_BASE_URLS,
  AGENT_TEAM_CRAWL_DEPTH,
  AGENT_TEAM_CRAWL_PER_SITE_LIMIT,
} from "../config/internalPipelineAgents.js";

/** Per-page markdown cap before LLM (characters). */
const DEFAULT_PAGE_MARKDOWN_MAX = 8192;

/** Total snapshot string budget (sum of markdown lengths, characters). */
const DEFAULT_SNAPSHOT_TOTAL_MAX = 200_000;

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
 * @param {string} baseUrl
 * @returns {boolean}
 */
function isApiSyraHost(baseUrl) {
  try {
    const h = new URL(baseUrl).hostname.toLowerCase();
    return h === "api.syraa.fun" || h.endsWith(".api.syraa.fun");
  } catch {
    return false;
  }
}

/**
 * Append API JSON endpoints as pseudo-pages when api.syraa.fun is in the crawl list.
 * @param {string} apiBase
 * @param {number} pageMax
 * @returns {Promise<CrawlSnapshotItem[]>}
 */
async function fetchApiJsonSnapshots(apiBase, pageMax) {
  const root = apiBase.replace(/\/+$/, "");
  const paths = ["/openapi.json", "/.well-known/x402"];
  /** @type {CrawlSnapshotItem[]} */
  const out = [];

  for (const path of paths) {
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
      for (const rec of records) {
        const status = String(rec?.status || "");
        if (status !== "completed") continue;
        const md = typeof rec.markdown === "string" ? rec.markdown : "";
        if (!md.trim()) continue;
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

  const apiBase = baseUrls.find((u) => {
    try {
      return isApiSyraHost(u.startsWith("http") ? u : `https://${u}`);
    } catch {
      return false;
    }
  });
  if (apiBase) {
    const root = apiBase.startsWith("http") ? apiBase : `https://${apiBase}`;
    const extras = await fetchApiJsonSnapshots(root, pageMax);
    snapshot.push(...extras);
  }

  const deduped = dedupeByUrl(snapshot);
  const trimmed = trimSnapshotTotal(deduped, totalMax);

  return {
    snapshot: trimmed,
    generatedAt: new Date().toISOString(),
    baseUrls,
  };
}
