/**
 * Sent-URL history per S3Labs agent (avoid duplicate Telegram posts).
 */

import { normalizeArticleUrl, normalizeTitleKey } from "./s3labsScoring.js";
import { S3LABS_SENT_HISTORY_HOURS } from "../../config/s3labsAgentsConfig.js";

/**
 * @typedef {{ url: string; sentAt: string; title?: string; titleKey?: string }} SentRecord
 */

/**
 * @param {unknown} payload
 * @returns {Set<string>}
 */
export function loadRecentSentUrls(payload) {
  const cutoff = Date.now() - S3LABS_SENT_HISTORY_HOURS * 60 * 60 * 1000;
  /** @type {Set<string>} */
  const urls = new Set();

  const history = Array.isArray(payload?.sentHistory) ? payload.sentHistory : [];
  for (const entry of history) {
    if (!entry || typeof entry !== "object") continue;
    const x = /** @type {SentRecord} */ (entry);
    const sentAt = new Date(x.sentAt).getTime();
    if (Number.isNaN(sentAt) || sentAt < cutoff) continue;
    const key = normalizeArticleUrl(x.url);
    if (key) urls.add(key);
  }

  const lastPick = payload?.pick;
  if (lastPick?.url) {
    const key = normalizeArticleUrl(lastPick.url);
    if (key) urls.add(key);
  }

  return urls;
}

/**
 * @param {unknown} payload
 * @returns {Set<string>}
 */
export function loadRecentSentTitleKeys(payload) {
  const cutoff = Date.now() - S3LABS_SENT_HISTORY_HOURS * 60 * 60 * 1000;
  /** @type {Set<string>} */
  const keys = new Set();

  const history = Array.isArray(payload?.sentHistory) ? payload.sentHistory : [];
  for (const entry of history) {
    if (!entry || typeof entry !== "object") continue;
    const x = /** @type {SentRecord} */ (entry);
    const sentAt = new Date(x.sentAt).getTime();
    if (Number.isNaN(sentAt) || sentAt < cutoff) continue;
    const tk = x.titleKey || normalizeTitleKey(x.title || "");
    if (tk) keys.add(tk);
  }

  if (payload?.pick?.title) {
    const tk = normalizeTitleKey(payload.pick.title);
    if (tk) keys.add(tk);
  }

  return keys;
}

/**
 * @param {unknown} payload
 * @param {{ url: string; title?: string }} pick
 * @returns {SentRecord[]}
 */
export function appendSentHistory(payload, pick) {
  const prev = Array.isArray(payload?.sentHistory) ? payload.sentHistory : [];
  const now = new Date().toISOString();
  const titleKey = normalizeTitleKey(pick.title || "");
  const next = [
    { url: pick.url, title: pick.title, titleKey, sentAt: now },
    ...prev.filter((e) => normalizeArticleUrl(e?.url) !== normalizeArticleUrl(pick.url)),
  ];
  const cutoff = Date.now() - S3LABS_SENT_HISTORY_HOURS * 60 * 60 * 1000;
  return next.filter((e) => new Date(e.sentAt).getTime() >= cutoff).slice(0, 50);
}
