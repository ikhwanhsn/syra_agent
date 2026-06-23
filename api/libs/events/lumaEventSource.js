/**
 * Luma event page source — fetch and parse lu.ma / luma.com event pages.
 */

import { fetchWithRetry } from "../../utils/resilientFetch.js";
import { LUMA_MAX_PAGES_PER_RUN } from "../../config/eventScoutConfig.js";
import { eventDedupeKey, normalizeLumaUrl } from "../internalScoutDedupe.js";
import { detectIndonesia, inferEventCategory, parseDate, str } from "./eventUtils.js";

/** @typedef {import("./eventUtils.js").EventRecord} EventRecord */

/**
 * @param {string} html
 * @param {string} field
 * @returns {string}
 */
function extractMetaContent(html, field) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${field}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${field}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${field}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

/**
 * @param {string} html
 * @returns {Record<string, unknown> | null}
 */
function extractNextData(html) {
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m?.[1]) return null;
  try {
    const parsed = JSON.parse(m[1]);
    return parsed && typeof parsed === "object" ? /** @type {Record<string, unknown>} */ (parsed) : null;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} node
 * @returns {Record<string, unknown> | null}
 */
function findEventNode(node) {
  if (!node || typeof node !== "object") return null;
  const obj = /** @type {Record<string, unknown>} */ (node);

  if (obj.event && typeof obj.event === "object") {
    return /** @type {Record<string, unknown>} */ (obj.event);
  }
  if (typeof obj.name === "string" && (obj.start_at || obj.startAt || obj.geo_address_info)) {
    return obj;
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findEventNode(item);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = findEventNode(value);
      if (found) return found;
    }
  }
  return null;
}

/**
 * @param {Record<string, unknown>} eventNode
 * @param {string} lumaUrl
 * @param {string} html
 * @returns {Partial<EventRecord>}
 */
function mapEventNode(eventNode, lumaUrl, html) {
  const title =
    str(eventNode.name) ||
    str(eventNode.title) ||
    extractMetaContent(html, "og:title") ||
    "Untitled event";

  const description =
    str(eventNode.description) ||
    str(eventNode.description_md) ||
    extractMetaContent(html, "og:description");

  const geo =
    eventNode.geo_address_info && typeof eventNode.geo_address_info === "object"
      ? /** @type {Record<string, unknown>} */ (eventNode.geo_address_info)
      : {};

  const location =
    str(geo.full_address) ||
    str(geo.address) ||
    str(geo.city) ||
    str(eventNode.location) ||
    "";

  const host =
    eventNode.host && typeof eventNode.host === "object"
      ? /** @type {Record<string, unknown>} */ (eventNode.host)
      : null;
  const organizer = str(host?.name) || str(eventNode.host_name) || "";

  const startRaw = eventNode.start_at || eventNode.startAt || eventNode.start_time;
  const endRaw = eventNode.end_at || eventNode.endAt || eventNode.end_time;
  const startAt = parseDate(startRaw);
  const endAt = parseDate(endRaw);

  const isOnline =
    Boolean(eventNode.meeting_url) ||
    /online|virtual|zoom/i.test(location) ||
    /online|virtual/i.test(description);

  const blob = `${title} ${description} ${location} ${organizer}`;
  const category = inferEventCategory(blob);
  const thumbnailUrl =
    str(eventNode.cover_url) ||
    str(eventNode.image_url) ||
    extractMetaContent(html, "og:image") ||
    null;

  const dateText = startAt
    ? startAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : str(eventNode.date_formatted);

  const partial = {
    source: /** @type {const} */ ("luma"),
    sourceId: lumaUrl,
    title: title.slice(0, 300),
    organizer: organizer.slice(0, 200),
    description: description.slice(0, 800),
    category,
    lumaUrl,
    url: lumaUrl,
    location: location.slice(0, 200),
    locationType: isOnline ? "online" : location ? "in_person" : "",
    isIndonesia: detectIndonesia(blob),
    isOnline,
    startAt,
    endAt,
    dateText,
    themes: [],
    thumbnailUrl,
    relevanceScore: 70,
    relevanceReason: "Parsed from Luma event page.",
  };

  return {
    ...partial,
    dedupeKey: eventDedupeKey({ title: partial.title, lumaUrl, startAt, dateText: partial.dateText }),
  };
}

/**
 * @param {string} lumaUrl
 * @returns {Promise<EventRecord | null>}
 */
export async function parseLumaEventPage(lumaUrl) {
  const normalized = normalizeLumaUrl(lumaUrl);
  if (!normalized) return null;

  try {
    const res = await fetchWithRetry(normalized, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "SyraEventScout/1.0 (+https://s3labs.fun)",
      },
    }, { retries: 2, retryDelayMs: 1000 });

    if (!res.ok) return null;
    const html = await res.text();
    const nextData = extractNextData(html);
    const eventNode = nextData ? findEventNode(nextData) : null;

    if (eventNode) {
      const mapped = mapEventNode(eventNode, normalized, html);
      if (!mapped.title || !mapped.lumaUrl) return null;
      return /** @type {EventRecord} */ ({
        source: "luma",
        sourceId: normalized,
        dedupeKey: mapped.dedupeKey || eventDedupeKey({ title: mapped.title, lumaUrl: normalized }),
        title: mapped.title,
        organizer: mapped.organizer || "",
        description: mapped.description || "",
        category: mapped.category || "tech",
        lumaUrl: normalized,
        url: normalized,
        location: mapped.location || "",
        locationType: mapped.locationType || "",
        isIndonesia: Boolean(mapped.isIndonesia),
        isOnline: Boolean(mapped.isOnline),
        startAt: mapped.startAt || null,
        endAt: mapped.endAt || null,
        dateText: mapped.dateText || "",
        themes: mapped.themes || [],
        thumbnailUrl: mapped.thumbnailUrl || null,
        relevanceScore: mapped.relevanceScore ?? 70,
        relevanceReason: mapped.relevanceReason || "Parsed from Luma event page.",
      });
    }

    const title = extractMetaContent(html, "og:title");
    if (!title) return null;
    const description = extractMetaContent(html, "og:description");
    const thumbnailUrl = extractMetaContent(html, "og:image") || null;
    const blob = `${title} ${description}`;

    return {
      source: "luma",
      sourceId: normalized,
      dedupeKey: eventDedupeKey({ title, lumaUrl: normalized }),
      title: title.slice(0, 300),
      organizer: "",
      description: description.slice(0, 800),
      category: inferEventCategory(blob),
      lumaUrl: normalized,
      url: normalized,
      location: "",
      locationType: "",
      isIndonesia: detectIndonesia(blob),
      isOnline: /online|virtual/i.test(blob),
      startAt: null,
      endAt: null,
      dateText: "",
      themes: [],
      thumbnailUrl,
      relevanceScore: 55,
      relevanceReason: "Parsed from Luma OG metadata.",
    };
  } catch (e) {
    console.warn(
      `[event-scout] Luma parse failed (${normalized}):`,
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

/**
 * @param {{ urls?: string[] }} [opts]
 * @returns {Promise<{ records: EventRecord[]; meta: { urlsRequested: number; parsed: number; failed: number } }>}
 */
export async function fetchLumaEvents(opts = {}) {
  const rawUrls = Array.isArray(opts.urls) ? opts.urls : [];
  const unique = [...new Set(rawUrls.map(normalizeLumaUrl).filter(Boolean))].slice(0, LUMA_MAX_PAGES_PER_RUN);

  /** @type {EventRecord[]} */
  const records = [];
  let failed = 0;

  for (const url of unique) {
    const record = await parseLumaEventPage(url);
    if (record) {
      records.push(record);
    } else {
      failed += 1;
    }
  }

  return {
    records,
    meta: {
      urlsRequested: unique.length,
      parsed: records.length,
      failed,
    },
  };
}
