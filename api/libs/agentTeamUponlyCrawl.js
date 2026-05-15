/**
 * Crawl Up Only Fund public surfaces (Cloudflare Browser Rendering) for the dev internal agent team.
 * Injects static engineering context (no secrets) so the LLM can reason about the monorepo stack.
 */

import {
  getCloudflareCrawlConfig,
  startCrawl,
  pollCrawlUntilComplete,
} from "./cloudflareCrawl.js";
import {
  AGENT_TEAM_API_DISCOVERY_HOST,
  AGENT_TEAM_LLM_PAGE_MARKDOWN_MAX,
  AGENT_TEAM_LLM_SNAPSHOT_TOTAL_MAX,
} from "../config/internalPipelineAgents.js";
import { getUponlyFundCrawlBaseUrls } from "../config/uponlyFundDevTeamConfig.js";
import { looksLikeAuthWall } from "./agentTeamCrawl.js";

const DEFAULT_PAGE_MARKDOWN_MAX = AGENT_TEAM_LLM_PAGE_MARKDOWN_MAX;
const DEFAULT_SNAPSHOT_TOTAL_MAX = AGENT_TEAM_LLM_SNAPSHOT_TOTAL_MAX;

const UPONLY_STACK_CONTEXT = `# Up Only Fund — engineering context (INTERNAL — not shown on website)

**Product:** public fund + RISE terminal at **uponly.fund** (Vite/React app in monorepo \`uponly-fund/\`).

**Backend (Syra API):** read-only proxies and helpers such as \`/uponly-rise-markets\`, \`/uponly-rise-market/:address\` (OHLC, holders, tx, quote, borrow-quote), \`/uponly-rise-portfolio/:wallet\`, \`/uponly-rise-create\`, aggregate digest, terminal KPI trends (Mongo). These are server-side; crawled HTML will not show API keys.

**Goal for recommendations:** concrete engineering and product improvements (features, refactors, tests, observability, UX, i18n, performance, security hygiene). Ground claims in the crawl + OpenAPI excerpt only — do not invent live prices, TVL, or user counts.`;

/**
 * @param {string} s
 * @param {number} max
 * @returns {string}
 */
function truncateChars(s, max) {
  if (typeof s !== "string" || s.length <= max) return typeof s === "string" ? s : "";
  return `${s.slice(0, max)}…`;
}

/**
 * @param {string} apiBase
 * @param {number} pageMax
 * @returns {Promise<import("./agentTeamCrawl.js").CrawlSnapshotItem[]>}
 */
async function fetchOpenApiSnapshot(apiBase, pageMax) {
  const root = apiBase.replace(/\/+$/, "");
  const url = `${root}/openapi.json`;
  try {
    const signal =
      typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(45_000)
        : undefined;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, */*",
        "User-Agent": "SyraUponlyDevTeam/1.0",
      },
      signal,
    });
    const text = await res.text();
    let body = text;
    try {
      const parsed = JSON.parse(text);
      body = JSON.stringify(parsed, null, 0);
    } catch {
      /* keep raw */
    }
    /** Prefer paths mentioning uponly so the model sees the API surface without deep-crawling. */
    const filtered =
      typeof body === "string" && body.includes("uponly")
        ? body
        : body.slice(0, Math.min(body.length, pageMax));
    return [
      {
        url,
        title: "OpenAPI (public)",
        markdown: truncateChars(filtered, pageMax),
      },
    ];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [
      {
        url,
        title: "openapi-fetch-error",
        markdown: truncateChars(`Fetch failed: ${msg}`, pageMax),
      },
    ];
  }
}

/**
 * @param {import("./agentTeamCrawl.js").CrawlSnapshotItem[]} items
 * @returns {import("./agentTeamCrawl.js").CrawlSnapshotItem[]}
 */
function dedupeByUrl(items) {
  const seen = new Set();
  /** @type {import("./agentTeamCrawl.js").CrawlSnapshotItem[]} */
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
 * @param {import("./agentTeamCrawl.js").CrawlSnapshotItem[]} items
 * @param {number} totalMax
 * @returns {import("./agentTeamCrawl.js").CrawlSnapshotItem[]}
 */
function trimSnapshotTotal(items, totalMax) {
  /** @type {import("./agentTeamCrawl.js").CrawlSnapshotItem[]} */
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
 * @param {{
 *   depth?: number;
 *   perSiteLimit?: number;
 *   pageMarkdownMax?: number;
 *   snapshotTotalMax?: number;
 * }} [options]
 * @returns {Promise<{ snapshot: import("./agentTeamCrawl.js").CrawlSnapshotItem[]; generatedAt: string; baseUrls: string[] }>}
 */
export async function crawlUponlyFundSurfaces(options = {}) {
  const cfg = getCloudflareCrawlConfig();
  if (!cfg) {
    throw new Error(
      "Cloudflare crawl not configured: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN",
    );
  }

  const depth = Math.min(10, Math.max(1, Number(options.depth) || 2));
  const perSiteLimit = Math.min(500, Math.max(1, Number(options.perSiteLimit) || 28));
  const pageMax =
    typeof options.pageMarkdownMax === "number" && options.pageMarkdownMax > 0
      ? options.pageMarkdownMax
      : DEFAULT_PAGE_MARKDOWN_MAX;
  const totalMax =
    typeof options.snapshotTotalMax === "number" && options.snapshotTotalMax > 0
      ? options.snapshotTotalMax
      : DEFAULT_SNAPSHOT_TOTAL_MAX;

  const baseUrls = getUponlyFundCrawlBaseUrls();
  /** @type {import("./agentTeamCrawl.js").CrawlSnapshotItem[]} */
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
          `[uponly-dev-team-crawl] dropped ${droppedAuthWall} auth-wall pages from ${seed}`,
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

  snapshot.push({
    url: "https://uponly.fund/_meta/stack-context",
    title: "Stack context (synthetic)",
    markdown: UPONLY_STACK_CONTEXT,
  });
  const apiExtras = await fetchOpenApiSnapshot(AGENT_TEAM_API_DISCOVERY_HOST, pageMax);
  snapshot.push(...apiExtras);

  const deduped = dedupeByUrl(snapshot);
  const trimmed = trimSnapshotTotal(deduped, totalMax);

  return {
    snapshot: trimmed,
    generatedAt: new Date().toISOString(),
    baseUrls: [...baseUrls, AGENT_TEAM_API_DISCOVERY_HOST],
  };
}
