/**
 * Devpost JSON API source — global + Indonesia technology hackathons.
 */

import {
  DEVPOST_API_BASE,
  DEVPOST_GLOBAL_PAGES,
  DEVPOST_INDONESIA_PAGES,
  DEVPOST_TECH_THEME_NAMES,
  INDONESIA_KEYWORDS,
} from "../../config/hackathonScoutConfig.js";

/**
 * @typedef {{
 *   source: "devpost";
 *   sourceId: string;
 *   dedupeKey: string;
 *   title: string;
 *   organizer: string;
 *   description: string;
 *   url: string | null;
 *   applicationUrl: string | null;
 *   location: string;
 *   locationType: string;
 *   isIndonesia: boolean;
 *   themes: string[];
 *   prizePool: string | null;
 *   prizeAmountUsd: number | null;
 *   submissionDates: string | null;
 *   deadline: string | null;
 *   openState: string;
 *   registrationsCount: number | null;
 *   thumbnailUrl: string | null;
 *   relevanceScore: number;
 *   relevanceReason: string;
 * }} HackathonRecord
 */

/**
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/**
 * @param {string} html
 * @returns {number | null}
 */
function parsePrizeUsd(html) {
  const text = stripHtml(html);
  const match = text.match(/[\d,]+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number.parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function detectIndonesia(text) {
  const lower = String(text || "").toLowerCase();
  return INDONESIA_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * @param {{ name?: string }[]} themes
 * @returns {boolean}
 */
function isTechThemed(themes) {
  if (!Array.isArray(themes) || themes.length === 0) return true;
  const names = themes.map((t) => String(t?.name || "").toLowerCase());
  return names.some((n) => DEVPOST_TECH_THEME_NAMES.some((tech) => n.includes(tech) || tech.includes(n)));
}

/**
 * @param {Record<string, unknown>} item
 * @param {{ forceIndonesia?: boolean }} [opts]
 * @returns {HackathonRecord | null}
 */
export function normalizeDevpostItem(item, opts = {}) {
  if (!item || typeof item !== "object") return null;
  const id = String(item.id ?? "");
  const title = String(item.title ?? "").trim();
  if (!id || !title) return null;

  const themes = Array.isArray(item.themes)
    ? item.themes.map((t) => String(t?.name || "").trim()).filter(Boolean)
    : [];

  if (!isTechThemed(Array.isArray(item.themes) ? item.themes : [])) {
    return null;
  }

  const displayed = item.displayed_location && typeof item.displayed_location === "object"
    ? /** @type {{ location?: string; icon?: string }} */ (item.displayed_location)
    : {};
  const location = String(displayed.location || "").trim();
  const locationType = String(displayed.icon || "").trim() || (location.toLowerCase() === "online" ? "online" : "in_person");

  const organizer = String(item.organization_name || "").trim();
  const url = String(item.url || "").trim() || null;
  const submissionDates = String(item.submission_period_dates || "").trim() || null;
  const deadline = String(item.time_left_to_submission || "").trim() || null;
  const openState = String(item.open_state || "").trim();
  const prizeHtml = String(item.prize_amount || "");
  const prizePool = stripHtml(prizeHtml) || null;
  const prizeAmountUsd = parsePrizeUsd(prizeHtml);

  const thumb = String(item.thumbnail_url || "").trim();
  const thumbnailUrl = thumb ? (thumb.startsWith("//") ? `https:${thumb}` : thumb) : null;

  const registrationsCount =
    typeof item.registrations_count === "number" ? item.registrations_count : null;

  const locationBlob = `${location} ${organizer} ${title}`;
  const isIndonesia = opts.forceIndonesia === true || detectIndonesia(locationBlob);

  return {
    source: "devpost",
    sourceId: id,
    dedupeKey: `devpost:${id}`,
    title: title.slice(0, 300),
    organizer: organizer.slice(0, 200),
    description: "",
    url,
    applicationUrl: url,
    location: location.slice(0, 200),
    locationType,
    isIndonesia,
    themes,
    prizePool,
    prizeAmountUsd,
    submissionDates,
    deadline,
    openState,
    registrationsCount,
    thumbnailUrl,
    relevanceScore: 70,
    relevanceReason: "Listed on Devpost with technology themes.",
  };
}

/**
 * @param {string} queryString
 * @returns {Promise<Record<string, unknown>[]>}
 */
async function fetchDevpostPage(queryString) {
  const url = `${DEVPOST_API_BASE}?${queryString}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SyraHackathonScout/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`Devpost API HTTP ${res.status}`);
  }
  const body = await res.json();
  return Array.isArray(body?.hackathons) ? body.hackathons : [];
}

/**
 * @param {string} baseParams
 * @param {number} pages
 * @returns {Promise<Record<string, unknown>[]>}
 */
async function fetchDevpostPages(baseParams, pages) {
  /** @type {Record<string, unknown>[]} */
  const all = [];
  const seenIds = new Set();

  for (let page = 1; page <= pages; page += 1) {
    const params = page === 1 ? baseParams : `${baseParams}&page=${page}`;
    try {
      const items = await fetchDevpostPage(params);
      for (const item of items) {
        const id = String(item?.id ?? "");
        if (!id || seenIds.has(id)) continue;
        seenIds.add(id);
        all.push(item);
      }
      if (items.length < 9) break;
    } catch (e) {
      console.warn(`[hackathon-scout] Devpost page ${page} failed:`, e instanceof Error ? e.message : e);
      break;
    }
  }

  return all;
}

/**
 * @returns {Promise<{ records: HackathonRecord[]; meta: { globalFetched: number; indonesiaFetched: number } }>}
 */
export async function fetchDevpostHackathons() {
  const globalParams =
    "status[]=upcoming&status[]=open&order_by=recently-added&challenge_type[]=online&challenge_type[]=in-person";
  const indonesiaParams =
    "search=indonesia&status[]=upcoming&status[]=open&order_by=recently-added";

  const [globalRaw, indonesiaRaw] = await Promise.all([
    fetchDevpostPages(globalParams, DEVPOST_GLOBAL_PAGES),
    fetchDevpostPages(indonesiaParams, DEVPOST_INDONESIA_PAGES),
  ]);

  /** @type {HackathonRecord[]} */
  const records = [];
  const seenKeys = new Set();

  for (const item of globalRaw) {
    const rec = normalizeDevpostItem(item);
    if (!rec || seenKeys.has(rec.dedupeKey)) continue;
    seenKeys.add(rec.dedupeKey);
    records.push(rec);
  }

  for (const item of indonesiaRaw) {
    const rec = normalizeDevpostItem(item, { forceIndonesia: true });
    if (!rec) continue;
    if (seenKeys.has(rec.dedupeKey)) {
      const existing = records.find((r) => r.dedupeKey === rec.dedupeKey);
      if (existing) existing.isIndonesia = true;
      continue;
    }
    seenKeys.add(rec.dedupeKey);
    records.push(rec);
  }

  return {
    records,
    meta: { globalFetched: globalRaw.length, indonesiaFetched: indonesiaRaw.length },
  };
}
