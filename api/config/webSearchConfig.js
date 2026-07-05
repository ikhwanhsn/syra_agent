/**
 * Free web search (DuckDuckGo HTML + Bing HTML fallback) — no API keys required.
 */

export const WEB_SEARCH_DDG_URL = "https://html.duckduckgo.com/html/";
export const WEB_SEARCH_BING_URL = "https://www.bing.com/search";

export const WEB_SEARCH_USER_AGENTS = Object.freeze([
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]);

export const WEB_SEARCH_TIMEOUT_MS = Math.max(
  5000,
  Number.parseInt(process.env.WEB_SEARCH_TIMEOUT_MS || "15000", 10) || 15000,
);

export const WEB_SEARCH_DEFAULT_NUM_RESULTS = Math.min(
  15,
  Math.max(3, Number.parseInt(process.env.WEB_SEARCH_NUM_RESULTS || "10", 10) || 10),
);

export const WEB_SEARCH_DDG_ENABLED =
  String(process.env.WEB_SEARCH_DDG_ENABLED ?? "true").trim().toLowerCase() !== "false";

export const WEB_SEARCH_BING_ENABLED =
  String(process.env.WEB_SEARCH_BING_ENABLED ?? "true").trim().toLowerCase() !== "false";

export const WEB_SEARCH_FETCH_RETRIES = Math.min(
  5,
  Math.max(0, Number.parseInt(process.env.WEB_SEARCH_FETCH_RETRIES || "2", 10) || 2),
);

export const WEB_SEARCH_MAX_SNIPPET_CHARS = Math.min(
  4000,
  Math.max(200, Number.parseInt(process.env.WEB_SEARCH_MAX_SNIPPET_CHARS || "4000", 10) || 4000),
);
