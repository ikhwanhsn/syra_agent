/**
 * Free multi-engine web search — DuckDuckGo HTML primary, Bing HTML fallback.
 * No API keys; scrapes public search result pages.
 */

import * as cheerio from "cheerio";
import { fetchWithRetry } from "../../utils/resilientFetch.js";
import {
  WEB_SEARCH_BING_ENABLED,
  WEB_SEARCH_BING_URL,
  WEB_SEARCH_DDG_ENABLED,
  WEB_SEARCH_DDG_URL,
  WEB_SEARCH_DEFAULT_NUM_RESULTS,
  WEB_SEARCH_FETCH_RETRIES,
  WEB_SEARCH_MAX_SNIPPET_CHARS,
  WEB_SEARCH_TIMEOUT_MS,
  WEB_SEARCH_USER_AGENTS,
} from "../../config/webSearchConfig.js";

/**
 * @typedef {{
 *   id: string;
 *   url: string;
 *   title: string;
 *   text: string;
 * }} WebSearchResult
 */

/**
 * @typedef {{
 *   results: WebSearchResult[];
 *   engine: "duckduckgo" | "bing" | "none";
 *   autopromptString: null;
 * }} WebSearchResponse
 */

let userAgentIndex = 0;

function pickUserAgent() {
  const agents = WEB_SEARCH_USER_AGENTS;
  if (agents.length === 0) {
    return "SyraWebSearch/1.0 (+https://s3labs.xyz)";
  }
  const agent = agents[userAgentIndex % agents.length];
  userAgentIndex += 1;
  return agent;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isValidHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * DuckDuckGo redirect URLs: //duckduckgo.com/l/?uddg=...
 * @param {string} href
 * @returns {string}
 */
function resolveDuckDuckGoHref(href) {
  const raw = String(href || "").trim();
  if (!raw) return "";
  try {
    const absolute = raw.startsWith("//") ? `https:${raw}` : raw;
    const parsed = new URL(absolute, "https://duckduckgo.com");
    if (parsed.hostname.includes("duckduckgo.com") && parsed.pathname.startsWith("/l/")) {
      const uddg = parsed.searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    }
    return parsed.href;
  } catch {
    return raw;
  }
}

/**
 * @param {string} text
 * @returns {string}
 */
function normalizeSnippet(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, WEB_SEARCH_MAX_SNIPPET_CHARS);
}

/**
 * @param {WebSearchResult[]} results
 * @param {number} limit
 * @returns {WebSearchResult[]}
 */
function dedupeResults(results, limit) {
  /** @type {Map<string, WebSearchResult>} */
  const map = new Map();
  for (const r of results) {
    const url = String(r.url || "").trim();
    if (!url || map.has(url)) continue;
    map.set(url, r);
    if (map.size >= limit) break;
  }
  return [...map.values()];
}

/**
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<WebSearchResult[]>}
 */
async function searchDuckDuckGo(query, limit) {
  const body = new URLSearchParams({ q: query, b: "", kl: "wt-wt" });
  const res = await fetchWithRetry(
    WEB_SEARCH_DDG_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": pickUserAgent(),
      },
      body: body.toString(),
      signal: AbortSignal.timeout(WEB_SEARCH_TIMEOUT_MS),
    },
    { retries: WEB_SEARCH_FETCH_RETRIES, retryDelayMs: 1200 },
  );

  if (!res.ok) {
    throw new Error(`DuckDuckGo HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  /** @type {WebSearchResult[]} */
  const results = [];

  $(".result").each((_i, el) => {
    if (results.length >= limit) return false;
    const $el = $(el);
    const titleEl = $el.find(".result__a").first();
    const href = resolveDuckDuckGoHref(titleEl.attr("href") || "");
    const title = normalizeSnippet(titleEl.text());
    const snippet = normalizeSnippet($el.find(".result__snippet").text());
    if (!href || !title || !isValidHttpUrl(href)) return;
    results.push({
      id: href,
      url: href,
      title,
      text: snippet || title,
    });
  });

  return results;
}

/**
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<WebSearchResult[]>}
 */
async function searchBing(query, limit) {
  const url = `${WEB_SEARCH_BING_URL}?${new URLSearchParams({ q: query, count: String(limit) })}`;
  const res = await fetchWithRetry(
    url,
    {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": pickUserAgent(),
      },
      signal: AbortSignal.timeout(WEB_SEARCH_TIMEOUT_MS),
    },
    { retries: WEB_SEARCH_FETCH_RETRIES, retryDelayMs: 1200 },
  );

  if (!res.ok) {
    throw new Error(`Bing HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  /** @type {WebSearchResult[]} */
  const results = [];

  $("li.b_algo").each((_i, el) => {
    if (results.length >= limit) return false;
    const $el = $(el);
    const titleEl = $el.find("h2 a").first();
    const href = String(titleEl.attr("href") || "").trim();
    const title = normalizeSnippet(titleEl.text());
    const snippet = normalizeSnippet($el.find(".b_caption p, .b_lineclamp2, .b_algoSlug").first().text());
    if (!href || !title || !isValidHttpUrl(href)) return;
    results.push({
      id: href,
      url: href,
      title,
      text: snippet || title,
    });
  });

  return results;
}

/**
 * @param {string} query
 * @param {{ numResults?: number }} [opts]
 * @returns {Promise<WebSearchResponse>}
 */
export async function searchWeb(query, opts = {}) {
  const q = String(query || "").trim();
  if (!q) {
    return { results: [], engine: "none", autopromptString: null };
  }

  const limit = Math.min(
    15,
    Math.max(1, Number(opts.numResults) || WEB_SEARCH_DEFAULT_NUM_RESULTS),
  );

  if (WEB_SEARCH_DDG_ENABLED) {
    try {
      const ddgResults = dedupeResults(await searchDuckDuckGo(q, limit), limit);
      if (ddgResults.length > 0) {
        return { results: ddgResults, engine: "duckduckgo", autopromptString: null };
      }
      console.warn(`[web-search] DuckDuckGo returned 0 results for: ${q.slice(0, 80)}`);
    } catch (e) {
      console.warn(
        `[web-search] DuckDuckGo failed (${q.slice(0, 60)}):`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  if (WEB_SEARCH_BING_ENABLED) {
    try {
      const bingResults = dedupeResults(await searchBing(q, limit), limit);
      if (bingResults.length > 0) {
        return { results: bingResults, engine: "bing", autopromptString: null };
      }
      console.warn(`[web-search] Bing returned 0 results for: ${q.slice(0, 80)}`);
    } catch (e) {
      console.warn(
        `[web-search] Bing failed (${q.slice(0, 60)}):`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return { results: [], engine: "none", autopromptString: null };
}
