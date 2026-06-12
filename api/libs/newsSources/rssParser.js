/**
 * Fetch and parse RSS/Atom feeds into normalized RawArticle objects.
 */

import { XMLParser } from "fast-xml-parser";
import { INTERNAL_NEWS_RSS_TIMEOUT_MS } from "../../config/internalNewsConfig.js";
import { fetchWithRetry } from "../../utils/resilientFetch.js";

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   description: string;
 *   url: string;
 *   source: string;
 *   sourceId: string;
 *   publishedAt: string;
 *   tickers: string[];
 * }} RawArticle
 */

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: true,
  /** Some feeds embed heavy HTML in content:encoded */
  htmlEntities: true,
  stopNodes: ["*.content:encoded", "*.description"],
});

/**
 * @param {unknown} v
 * @returns {unknown[]}
 */
function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * @param {unknown} node
 * @returns {string}
 */
function textContent(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object" && node !== null) {
    const o = /** @type {Record<string, unknown>} */ (node);
    if (typeof o["#text"] === "string") return o["#text"];
    if (typeof o._ === "string") return o._;
  }
  return "";
}

/**
 * @param {string} raw
 * @returns {string}
 */
function decodeHtmlEntities(raw) {
  return String(raw || "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * @param {string} raw
 * @returns {string}
 */
function stripHtml(raw) {
  let text = decodeHtmlEntities(raw);
  // Some feeds double-encode entities (e.g. &amp;lt;p&amp;gt;).
  text = decodeHtmlEntities(text);
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} dateStr
 * @returns {string}
 */
function normalizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/**
 * @param {string} title
 * @param {string} description
 * @returns {string[]}
 */
function extractTickersFromText(title, description) {
  const text = `${title} ${description}`.toUpperCase();
  const found = new Set();
  const dollar = /\$([A-Z]{2,10})\b/g;
  let m;
  while ((m = dollar.exec(text)) !== null) {
    found.add(m[1]);
  }
  const known = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC", "LINK", "UNI", "ATOM", "LTC", "NEAR", "APT", "ARB", "OP", "SUI", "PEPE", "WIF"];
  for (const t of known) {
    if (new RegExp(`\\b${t}\\b`).test(text)) found.add(t);
  }
  return [...found].slice(0, 12);
}

/**
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<string>}
 */
async function fetchFeedXml(url, timeoutMs = INTERNAL_NEWS_RSS_TIMEOUT_MS) {
  const signal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(timeoutMs)
      : undefined;
  const res = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      "User-Agent": "SyraInternalNewsAgent/1.0",
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(`RSS fetch failed ${res.status} for ${url}`);
  }
  return res.text();
}

/**
 * @param {unknown} parsed
 * @param {{ sourceId: string; sourceName: string }} meta
 * @returns {RawArticle[]}
 */
function parseRssOrAtom(parsed, meta) {
  const out = /** @type {RawArticle[]} */ ([]);

  const channel = parsed?.rss?.channel ?? parsed?.feed;
  if (!channel) return out;

  const items = asArray(channel.item ?? channel.entry);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== "object") continue;
    const it = /** @type {Record<string, unknown>} */ (item);

    const title = stripHtml(textContent(it.title) || "Untitled");
    const link =
      typeof it.link === "string"
        ? it.link
        : typeof it.link === "object" && it.link !== null
          ? textContent((/** @type {Record<string, unknown>} */ (it.link))["@_href"]) ||
            textContent(it.link)
          : typeof it.guid === "string"
            ? it.guid
            : typeof it.id === "string"
              ? it.id
              : "";

    const description = stripHtml(
      textContent(it.description) ||
        textContent(it.summary) ||
        textContent(it["content:encoded"]) ||
        textContent(it.content) ||
        "",
    );

    const pubDate =
      textContent(it.pubDate) ||
      textContent(it.published) ||
      textContent(it.updated) ||
      textContent(it["dc:date"]) ||
      "";

    const url = String(link || "").trim();
    if (!url || !title) continue;

    const publishedAt = normalizeDate(pubDate);
    const id = `${meta.sourceId}:${url}`;

    out.push({
      id,
      title,
      description: description.slice(0, 2000),
      url,
      source: meta.sourceName,
      sourceId: meta.sourceId,
      publishedAt,
      tickers: extractTickersFromText(title, description),
    });
  }

  return out;
}

/**
 * @param {{ id: string; name: string; url: string }} source
 * @param {number} [timeoutMs]
 * @returns {Promise<RawArticle[]>}
 */
export async function fetchRssSource(source, timeoutMs = INTERNAL_NEWS_RSS_TIMEOUT_MS) {
  const xml = await fetchFeedXml(source.url, timeoutMs);
  const parsed = xmlParser.parse(xml);
  return parseRssOrAtom(parsed, { sourceId: source.id, sourceName: source.name });
}

/**
 * @param {string} url
 * @param {{ sourceId: string; sourceName: string }} meta
 * @param {number} [timeoutMs]
 * @returns {Promise<RawArticle[]>}
 */
export async function fetchRssUrl(url, meta, timeoutMs = INTERNAL_NEWS_RSS_TIMEOUT_MS) {
  const xml = await fetchFeedXml(url, timeoutMs);
  const parsed = xmlParser.parse(xml);
  return parseRssOrAtom(parsed, meta);
}
