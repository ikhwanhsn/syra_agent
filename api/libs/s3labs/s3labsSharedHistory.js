/**
 * Cross-agent shared history — no URL/title repost across News, Developer, Event.
 */

import DashboardResearch from "../../models/DashboardResearch.js";
import {
  S3LABS_AGENT_DEFINITIONS,
  S3LABS_SHARED_HISTORY_DB_ID,
  S3LABS_SENT_HISTORY_HOURS,
} from "../../config/s3labsAgentsConfig.js";
import { normalizeArticleUrl, normalizeTitleKey } from "./s3labsScoring.js";
import { loadRecentSentUrls } from "./s3labsSentHistory.js";

/**
 * @typedef {import("../../config/s3labsAgentsConfig.js").S3labsAgentKind} S3labsAgentKind
 */

/**
 * @typedef {{
 *   url: string;
 *   titleKey: string;
 *   title?: string;
 *   agentKind: S3labsAgentKind;
 *   agentId: string;
 *   agentTag: string;
 *   sentAt: string;
 * }} SharedSentEntry
 */

/**
 * @typedef {{ urls: Set<string>; titleKeys: Set<string> }} ContentExcludes
 */

const MAX_SHARED_ENTRIES = 200;

/**
 * @param {{ url?: string; title?: string }} item
 * @returns {{ url: string; titleKey: string }}
 */
export function contentKeysFromItem(item) {
  return {
    url: normalizeArticleUrl(item.url || ""),
    titleKey: normalizeTitleKey(item.title || ""),
  };
}

/**
 * @param {unknown} entries
 * @returns {ContentExcludes}
 */
export function buildExcludesFromEntries(entries) {
  const cutoff = Date.now() - S3LABS_SENT_HISTORY_HOURS * 60 * 60 * 1000;
  /** @type {Set<string>} */
  const urls = new Set();
  /** @type {Set<string>} */
  const titleKeys = new Set();

  if (!Array.isArray(entries)) return { urls, titleKeys };

  for (const raw of entries) {
    if (!raw || typeof raw !== "object") continue;
    const e = /** @type {SharedSentEntry} */ (raw);
    const sentAt = new Date(e.sentAt).getTime();
    if (Number.isNaN(sentAt) || sentAt < cutoff) continue;

    const { url, titleKey } = contentKeysFromItem(e);
    if (url) urls.add(url);
    if (titleKey) titleKeys.add(titleKey);
  }

  return { urls, titleKeys };
}

/**
 * @param {ContentExcludes} a
 * @param {ContentExcludes} b
 * @returns {ContentExcludes}
 */
export function mergeExcludes(a, b) {
  return {
    urls: new Set([...a.urls, ...b.urls]),
    titleKeys: new Set([...a.titleKeys, ...b.titleKeys]),
  };
}

/**
 * @param {{ url?: string; title?: string }} item
 * @param {ContentExcludes} excludes
 * @returns {boolean}
 */
export function isContentExcluded(item, excludes) {
  const { url, titleKey } = contentKeysFromItem(item);
  if (url && excludes.urls.has(url)) return true;
  if (titleKey && excludes.titleKeys.has(titleKey)) return true;
  return false;
}

/**
 * Load excludes from shared Mongo doc.
 * @returns {Promise<ContentExcludes>}
 */
export async function fetchSharedExcludes() {
  try {
    const doc = await DashboardResearch.findOne({ id: S3LABS_SHARED_HISTORY_DB_ID }).lean();
    return buildExcludesFromEntries(doc?.payload?.entries);
  } catch {
    return { urls: new Set(), titleKeys: new Set() };
  }
}

/**
 * Merge shared history + every agent's local payload (fallback if shared doc empty).
 * @returns {Promise<ContentExcludes>}
 */
export async function fetchGlobalExcludes() {
  let merged = await fetchSharedExcludes();

  const results = await Promise.allSettled(
    S3LABS_AGENT_DEFINITIONS.map(async (def) => {
      const doc = await DashboardResearch.findOne({ id: def.dbId }).lean();
      return doc?.payload ?? null;
    }),
  );

  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const payload = r.value;
    const urls = loadRecentSentUrls(payload);
    const local = { urls, titleKeys: new Set() };

    const history = Array.isArray(payload.sentHistory) ? payload.sentHistory : [];
    for (const entry of history) {
      if (entry?.title) {
        const tk = normalizeTitleKey(entry.title);
        if (tk) local.titleKeys.add(tk);
      }
    }
    if (payload.pick?.title) {
      const tk = normalizeTitleKey(payload.pick.title);
      if (tk) local.titleKeys.add(tk);
    }

    merged = mergeExcludes(merged, local);
  }

  return merged;
}

/**
 * @param {S3labsAgentKind} kind
 * @param {{ url: string; title: string }} pick
 * @returns {Promise<void>}
 */
export async function recordSharedSent(kind, pick) {
  const def = S3LABS_AGENT_DEFINITIONS.find((a) => a.kind === kind);
  if (!def || !pick?.url) return;

  const { url, titleKey } = contentKeysFromItem(pick);
  if (!url) return;

  const entry = /** @type {SharedSentEntry} */ ({
    url,
    titleKey,
    title: pick.title?.slice(0, 200),
    agentKind: kind,
    agentId: def.agentId,
    agentTag: def.agentTag,
    sentAt: new Date().toISOString(),
  });

  try {
    const doc = await DashboardResearch.findOne({ id: S3LABS_SHARED_HISTORY_DB_ID }).lean();
    const prev = Array.isArray(doc?.payload?.entries) ? doc.payload.entries : [];
    const cutoff = Date.now() - S3LABS_SENT_HISTORY_HOURS * 60 * 60 * 1000;

    const next = [
      entry,
      ...prev.filter((e) => {
        if (!e || typeof e !== "object") return false;
        const x = /** @type {SharedSentEntry} */ (e);
        if (normalizeArticleUrl(x.url) === url) return false;
        if (titleKey && x.titleKey === titleKey) return false;
        return new Date(x.sentAt).getTime() >= cutoff;
      }),
    ].slice(0, MAX_SHARED_ENTRIES);

    await DashboardResearch.findOneAndUpdate(
      { id: S3LABS_SHARED_HISTORY_DB_ID },
      {
        id: S3LABS_SHARED_HISTORY_DB_ID,
        payload: { entries: next, updatedAt: new Date().toISOString() },
        savedAt: new Date(),
      },
      { upsert: true, new: true },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[s3labs-shared-history] persist failed:", msg);
  }
}
