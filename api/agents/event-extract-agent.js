/**
 * OpenRouter extraction agent for tech/crypto/web3 events with lu.ma registration links.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";
import { WEB_MIN_RELEVANCE_SCORE } from "../config/eventScoutConfig.js";
import { eventDedupeKey, normalizeLumaUrl } from "../libs/internalScoutDedupe.js";
import { detectIndonesia, inferEventCategory, parseDate, str } from "../libs/events/eventUtils.js";

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   url: string;
 *   text: string;
 *   query: string;
 *   lumaUrls?: string[];
 *   source?: "web" | "x";
 * }} EventSearchHit
 */

/**
 * @typedef {import("../libs/events/eventUtils.js").EventRecord} EventRecord
 */

/**
 * @param {unknown} raw
 * @param {EventSearchHit[]} hits
 * @returns {EventRecord[]}
 */
function coerceExtractions(raw, hits) {
  const hitByUrl = new Map(hits.map((h) => [h.url, h]));
  const hitById = new Map(hits.map((h) => [h.id, h]));
  const root = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
  const list = Array.isArray(root.events)
    ? root.events
    : Array.isArray(root.leads)
      ? root.leads
      : [];

  /** @type {EventRecord[]} */
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (item);
    const sourceRef = str(x.sourceRef || x.source_ref || x.url || x.id);
    const hit = hitByUrl.get(sourceRef) || hitById.get(sourceRef) || hits.find((h) => sourceRef.includes(h.url));
    if (!hit) continue;

    const title = str(x.title);
    if (!title) continue;

    const score =
      typeof x.relevanceScore === "number"
        ? Math.max(0, Math.min(100, x.relevanceScore))
        : typeof x.relevance_score === "number"
          ? Math.max(0, Math.min(100, x.relevance_score))
          : 50;

    if (score < WEB_MIN_RELEVANCE_SCORE) continue;

    const lumaUrl =
      normalizeLumaUrl(str(x.lumaUrl || x.luma_url)) ||
      normalizeLumaUrl(str(x.registrationUrl || x.registration_url)) ||
      (hit.lumaUrls?.[0] ? normalizeLumaUrl(hit.lumaUrls[0]) : "") ||
      normalizeLumaUrl(hit.url);

    if (!lumaUrl) continue;

    const location = str(x.location).slice(0, 200);
    const organizer = str(x.organizer).slice(0, 200);
    const description = str(x.description).slice(0, 800) || hit.text.slice(0, 800);
    const blob = `${title} ${description} ${location} ${organizer} ${hit.text}`;

    const categoryRaw = str(x.category).toLowerCase();
    const category =
      categoryRaw === "crypto" || categoryRaw === "web3" || categoryRaw === "tech"
        ? /** @type {"tech" | "crypto" | "web3"} */ (categoryRaw)
        : inferEventCategory(blob);

    const themes = Array.isArray(x.themes)
      ? x.themes.map((t) => str(t)).filter(Boolean).slice(0, 8)
      : Array.isArray(x.tags)
        ? x.tags.map((t) => str(t)).filter(Boolean).slice(0, 8)
        : [];

    const startAt = parseDate(x.startAt || x.start_at);
    const endAt = parseDate(x.endAt || x.end_at);
    const dateText = str(x.dateText || x.date_text);

    const source = hit.source === "x" ? "x" : "web";

    const record = {
      source: /** @type {"web" | "x" | "luma"} */ (source),
      sourceId: hit.id,
      dedupeKey: "",
      title: title.slice(0, 300),
      organizer,
      description,
      category,
      lumaUrl,
      url: normalizeLumaUrl(str(x.url)) || lumaUrl,
      location,
      locationType: str(x.locationType || x.location_type) || (location.toLowerCase().includes("online") ? "online" : ""),
      isIndonesia: detectIndonesia(blob) || Boolean(x.isIndonesia || x.is_indonesia),
      isOnline: Boolean(x.isOnline || x.is_online) || /online|virtual/i.test(location),
      startAt,
      endAt,
      dateText,
      themes,
      thumbnailUrl: str(x.thumbnailUrl || x.thumbnail_url) || null,
      relevanceScore: score,
      relevanceReason: str(x.relevanceReason || x.relevance_reason).slice(0, 400),
    };

    record.dedupeKey = eventDedupeKey(record);
    out.push(record);
  }

  return out;
}

const SYSTEM = `You are **Event Scout**. Extract real tech, crypto, or web3 events that use Luma (lu.ma) for registration.

**Focus:** Technology meetups, crypto/web3 conferences, developer workshops, blockchain events, AI/startup gatherings — must have a lu.ma registration link.
**Skip:** Non-tech events, weddings, parties, generic social events, events without lu.ma links.

**Output JSON:** { "events": [ {
  sourceRef (exact url or id from input),
  title,
  organizer,
  description,
  location,
  lumaUrl (required — must be a lu.ma or luma.com event URL),
  url,
  category (tech|crypto|web3),
  themes (string[]),
  tags (string[]),
  startAt (ISO date or null),
  endAt (ISO date or null),
  dateText (human-readable or null),
  locationType (online|in_person|hybrid|unknown),
  relevanceScore (0-100 for tech/crypto/web3 event fit),
  relevanceReason,
  isIndonesia (boolean — true if event is in Indonesia or targets Indonesian audience),
  isOnline (boolean)
} ] }

**Rules:**
- Only extract events with a valid lu.ma registration URL present in the input or clearly referenced.
- Do NOT invent events not present in the search snippets.
- Skip duplicates matching **alreadyKnown** (same lu.ma URL or same title+date).
- Max 10 events per batch.
- Valid JSON only.`;

/**
 * @param {{ hits: EventSearchHit[]; knownEvents?: { title: string; lumaUrl?: string }[]; model?: string | null }} input
 * @returns {Promise<EventRecord[]>}
 */
export async function runEventExtractAgent(input) {
  const hits = input.hits.slice(0, 25);
  if (hits.length === 0) return [];

  const known = Array.isArray(input.knownEvents) ? input.knownEvents.slice(0, 60) : [];

  if (!process.env.OPENROUTER_API_KEY) {
    return hits
      .map((h) => {
        const lumaUrl = h.lumaUrls?.[0] ? normalizeLumaUrl(h.lumaUrls[0]) : normalizeLumaUrl(h.url);
        if (!lumaUrl) return null;
        const blob = `${h.title} ${h.text}`;
        const record = {
          source: /** @type {const} */ ("web"),
          sourceId: h.id,
          dedupeKey: "",
          title: (h.title || lumaUrl).slice(0, 200),
          organizer: "",
          description: h.text.slice(0, 600),
          category: inferEventCategory(blob),
          lumaUrl,
          url: lumaUrl,
          location: "",
          locationType: "",
          isIndonesia: detectIndonesia(blob),
          isOnline: /online|virtual/i.test(blob),
          startAt: null,
          endAt: null,
          dateText: "",
          themes: ["unparsed"],
          thumbnailUrl: null,
          relevanceScore: 35,
          relevanceReason: "OpenRouter not configured — raw hit saved for manual review.",
        };
        record.dedupeKey = eventDedupeKey(record);
        return record;
      })
      .filter((r) => r !== null);
  }

  const compact = hits.map((h) => ({
    id: h.id,
    url: h.url,
    title: h.title,
    snippet: h.text.slice(0, 600),
    query: h.query,
    lumaUrls: h.lumaUrls || [],
  }));

  const model = resolveInternalPipelineModel(input.model);
  const messages = withLlmIdentitySystemNote(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Extract tech/crypto/web3 events with lu.ma registration from these search results.\n\nAlready in database (skip duplicates):\n${JSON.stringify({ alreadyKnown: known })}\n\nSearch results:\n${JSON.stringify({ results: compact })}`,
      },
    ],
    model,
  );

  const result = await callOpenRouter(messages, {
    model,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.eventScout,
    temperature: 0.25,
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonObjectFromLlm(result.response);
  return coerceExtractions(parsed, hits);
}
