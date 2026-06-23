/**
 * Shared helpers for Event Scout sources.
 */

import { INDONESIA_KEYWORDS, EVENT_RELEVANCE_KEYWORDS } from "../../config/eventScoutConfig.js";

/**
 * @param {string} text
 * @returns {boolean}
 */
export function detectIndonesia(text) {
  const lower = String(text || "").toLowerCase();
  return INDONESIA_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * @param {string} text
 * @returns {"tech" | "crypto" | "web3"}
 */
export function inferEventCategory(text) {
  const lower = String(text || "").toLowerCase();
  if (/\b(web3|blockchain|defi|nft|dao|solana|ethereum|bitcoin|crypto)\b/.test(lower)) {
    return /\b(web3|defi|nft|dao|solana)\b/.test(lower) ? "web3" : "crypto";
  }
  return "tech";
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function looksEventRelevant(text) {
  const lower = String(text || "").toLowerCase();
  return EVENT_RELEVANCE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * @typedef {{
 *   source: "exa" | "x" | "luma" | "manual";
 *   sourceId: string;
 *   dedupeKey: string;
 *   title: string;
 *   organizer: string;
 *   description: string;
 *   category: "tech" | "crypto" | "web3";
 *   lumaUrl: string;
 *   url: string | null;
 *   location: string;
 *   locationType: string;
 *   isIndonesia: boolean;
 *   isOnline: boolean;
 *   startAt: Date | null;
 *   endAt: Date | null;
 *   dateText: string;
 *   themes: string[];
 *   thumbnailUrl: string | null;
 *   relevanceScore: number;
 *   relevanceReason: string;
 * }} EventRecord
 */

/**
 * @param {unknown} v
 * @returns {string}
 */
export function str(v) {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/**
 * @param {unknown} v
 * @returns {Date | null}
 */
export function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}
