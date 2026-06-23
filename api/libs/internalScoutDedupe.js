/**
 * Shared dedupe keys for internal hackathon & partnership scouts.
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeScoutLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * @param {string | null | undefined} url
 * @returns {string}
 */
export function linkHostKey(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const host = new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, "");
    return host;
  } catch {
    return "";
  }
}

/**
 * @param {{ title?: string; organizer?: string; applicationUrl?: string | null }} lead
 * @returns {string}
 */
export function hackathonDedupeKey(lead) {
  const title = normalizeScoutLabel(lead.title);
  if (!title) return "";
  const org = normalizeScoutLabel(lead.organizer);
  const host = linkHostKey(lead.applicationUrl);
  if (host) return `${title}|${host}`;
  return org ? `${title}|${org}` : title;
}

/**
 * @param {string | null | undefined} url
 * @returns {string}
 */
export function normalizeLumaUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "lu.ma" && host !== "luma.com") return "";
    const path = u.pathname.replace(/\/$/, "").toLowerCase();
    if (!path || path === "/") return "";
    return `https://${host}${path}`;
  } catch {
    return "";
  }
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function extractLumaUrls(text) {
  if (!text || typeof text !== "string") return [];
  const regex = /https?:\/\/(?:www\.)?(?:lu\.ma|luma\.com)\/[^\s<>"')\]]+/gi;
  const matches = text.match(regex) || [];
  const seen = new Set();
  /** @type {string[]} */
  const out = [];
  for (const raw of matches) {
    const normalized = normalizeLumaUrl(raw.replace(/[.,;:!?)]+$/, ""));
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}

/**
 * @param {{ title?: string; lumaUrl?: string | null; startAt?: Date | string | null; dateText?: string }} event
 * @returns {string}
 */
export function eventDedupeKey(event) {
  const luma = normalizeLumaUrl(event.lumaUrl);
  if (luma) return `luma:${luma}`;

  const title = normalizeScoutLabel(event.title);
  if (!title) return "";

  const datePart = event.startAt
    ? new Date(event.startAt).toISOString().slice(0, 10)
    : normalizeScoutLabel(event.dateText).slice(0, 40);
  return datePart ? `${title}|${datePart}` : title;
}

/**
 * @param {{ name?: string; link?: string | null }} target
 * @returns {string}
 */
export function partnershipDedupeKey(target) {
  const name = normalizeScoutLabel(target.name);
  if (!name) return "";
  const host = linkHostKey(target.link);
  return host ? `${name}|${host}` : name;
}

/**
 * @param {string} text
 * @returns {string}
 */
export function integrationDedupeKey(text) {
  const n = normalizeScoutLabel(text);
  if (!n) return "";
  return n.length > 140 ? n.slice(0, 140) : n;
}

/**
 * @param {string} tweetId
 * @param {Set<string>} tweetIds
 * @param {Set<string>} keys
 * @param {{ title?: string; organizer?: string; applicationUrl?: string | null }} [fields]
 * @returns {boolean}
 */
export function isKnownHackathon(tweetId, tweetIds, keys, fields) {
  if (tweetId && tweetIds.has(tweetId)) return true;
  if (fields) {
    const key = hackathonDedupeKey(fields);
    if (key && keys.has(key)) return true;
  }
  return false;
}

/**
 * @param {{ name?: string; link?: string | null }} target
 * @param {Set<string>} keys
 * @returns {boolean}
 */
export function isKnownPartnership(target, keys) {
  const key = partnershipDedupeKey(target);
  return Boolean(key && keys.has(key));
}

/**
 * @param {string} text
 * @param {Set<string>} keys
 * @returns {boolean}
 */
export function isKnownIntegration(text, keys) {
  const key = integrationDedupeKey(text);
  return Boolean(key && keys.has(key));
}
