/**
 * Single client for cryptonews-api.com. All API calls go through this file for easy maintenance.
 * Token: CRYPTO_NEWS_API_TOKEN
 * Base: https://cryptonews-api.com/api/v1
 */

const BASE_URL = "https://cryptonews-api.com/api/v1";

function getToken() {
  return process.env.CRYPTO_NEWS_API_TOKEN || "";
}

/**
 * Build full URL for cryptonews-api.com with token and optional params.
 * @param {string} pathname - e.g. '', '/category', '/stat', '/events', '/sundown-digest', '/trending-headlines'
 * @param {Record<string, string | number>} params - query params (page=1 and token are added automatically)
 * @returns {string}
 */
export function buildUrl(pathname, params = {}) {
  const search = new URLSearchParams({
    page: 1,
    token: getToken(),
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ),
  });
  const path = pathname.replace(/^\//, "") || "";
  const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  return path ? `${base}/${path}?${search}` : `${base}?${search}`;
}

/**
 * Fetch from cryptonews-api.com and return full JSON response.
 * @param {string} pathname
 * @param {Record<string, string | number>} [params]
 * @returns {Promise<{ data?: unknown }>}
 */
export async function fetchCryptoNewsApi(pathname, params = {}) {
  const url = buildUrl(pathname, params);
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// --- News (category & tickers) ---

export async function fetchNewsCategoryGeneral(items = 100) {
  const data = await fetchCryptoNewsApi("/category", {
    section: "general",
    items,
  });
  return data.data || [];
}

export async function fetchNewsCategoryAllTickers(items = 100) {
  const data = await fetchCryptoNewsApi("/category", {
    section: "alltickers",
    items,
  });
  return data.data || [];
}

export async function fetchNewsTickers(ticker, items = 100) {
  const data = await fetchCryptoNewsApi("", { tickers: ticker, items });
  return data.data || [];
}

export async function fetchNewsTickersOnly(ticker, items = 100) {
  const data = await fetchCryptoNewsApi("", {
    "tickers-only": ticker,
    items,
  });
  return data.data || [];
}

// --- Sentiment (stat) ---

export async function fetchSentimentGeneral(date = "last30days") {
  const data = await fetchCryptoNewsApi("/stat", {
    section: "general",
    date,
  });
  return data.data || [];
}

export async function fetchSentimentAllTickers(date = "last30days") {
  const data = await fetchCryptoNewsApi("/stat", {
    section: "alltickers",
    date,
  });
  return data.data || [];
}

export async function fetchSentimentTicker(ticker, date = "last30days") {
  const data = await fetchCryptoNewsApi("/stat", {
    tickers: ticker,
    date,
  });
  return data.data || [];
}

// --- Events ---

export async function fetchEventsGeneral() {
  const data = await fetchCryptoNewsApi("/events");
  return data.data || [];
}

export async function fetchEventsTicker(ticker) {
  const data = await fetchCryptoNewsApi("/events", { tickers: ticker });
  return data.data || [];
}

// --- Sundown digest ---

export async function fetchSundownDigest() {
  const data = await fetchCryptoNewsApi("/sundown-digest");
  return data.data || [];
}

// --- Trending headlines ---

export async function fetchTrendingHeadlinesGeneral() {
  const data = await fetchCryptoNewsApi("/trending-headlines");
  return data.data || [];
}

export async function fetchTrendingHeadlinesTicker(ticker) {
  const data = await fetchCryptoNewsApi("/trending-headlines", {
    ticker,
  });
  return data.data || [];
}

