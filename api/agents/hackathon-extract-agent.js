/**
 * OpenRouter extraction agent for hackathons discovered via web search.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";
import { WEB_MIN_RELEVANCE_SCORE } from "../config/hackathonScoutConfig.js";
import { detectIndonesia } from "../libs/hackathon/devpostSource.js";
import { hackathonDedupeKey } from "../libs/internalScoutDedupe.js";

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   url: string;
 *   text: string;
 *   query: string;
 * }} WebSearchHit
 */

/**
 * @typedef {import("./devpostSource.js").HackathonRecord} HackathonRecord
 */

/**
 * @param {unknown} v
 * @returns {string}
 */
function str(v) {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/**
 * @param {unknown} raw
 * @param {WebSearchHit[]} hits
 * @returns {HackathonRecord[]}
 */
function coerceExtractions(raw, hits) {
  const hitByUrl = new Map(hits.map((h) => [h.url, h]));
  const hitById = new Map(hits.map((h) => [h.id, h]));
  const root = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
  const list = Array.isArray(root.hackathons)
    ? root.hackathons
    : Array.isArray(root.leads)
      ? root.leads
      : [];

  /** @type {HackathonRecord[]} */
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

    const isTech = x.isTechnology !== false && x.is_technology !== false;
    if (!isTech) continue;

    const url = str(x.url || x.applicationUrl) || hit.url;
    const organizer = str(x.organizer).slice(0, 200);
    const location = str(x.location).slice(0, 200);
    const locationBlob = `${location} ${organizer} ${title}`;
    const tags = Array.isArray(x.tags) ? x.tags.map((t) => str(t)).filter(Boolean).slice(0, 8) : [];
    const themes = Array.isArray(x.themes)
      ? x.themes.map((t) => str(t)).filter(Boolean).slice(0, 8)
      : tags;

    const record = {
      source: /** @type {const} */ ("web"),
      sourceId: hit.id,
      dedupeKey: "",
      title: title.slice(0, 300),
      organizer,
      description: str(x.description).slice(0, 800) || hit.text.slice(0, 800),
      url,
      applicationUrl: str(x.applicationUrl || x.url) || url,
      location,
      locationType: location.toLowerCase().includes("online") ? "online" : "",
      isIndonesia: detectIndonesia(locationBlob) || Boolean(x.isIndonesia),
      themes,
      prizePool: str(x.prizePool || x.prize_pool) || null,
      prizeAmountUsd: null,
      submissionDates: str(x.submissionDates || x.submission_dates) || null,
      deadline: str(x.deadline) || null,
      openState: str(x.openState || x.open_state) || "unknown",
      registrationsCount: null,
      thumbnailUrl: null,
      relevanceScore: score,
      relevanceReason: str(x.relevanceReason || x.relevance_reason).slice(0, 400),
    };

    record.dedupeKey = `web:${hackathonDedupeKey(record) || hit.id}`;
    out.push(record);
  }

  return out;
}

const SYSTEM = `You are **Hackathon Scout**. Extract real technology hackathon announcements from web search results.

**Focus:** Technology hackathons only — software, AI, blockchain, web, mobile, IoT, cybersecurity, data, startups, developer events.
**Skip:** Non-tech events, pure gaming tournaments without a build component, job fairs, conferences without a hackathon/build track.

**Output JSON:** { "hackathons": [ {
  sourceRef (exact url or id from input),
  title,
  organizer,
  description,
  location,
  url,
  applicationUrl,
  themes (string[]),
  tags (string[]),
  deadline (human-readable or ISO or null),
  submissionDates (string or null),
  prizePool (string or null),
  openState (open|upcoming|closed|unknown),
  relevanceScore (0-100 for technology hackathon fit),
  relevanceReason,
  isTechnology (boolean),
  isIndonesia (boolean — true if event is in Indonesia or targets Indonesian developers)
} ] }

**Rules:**
- Only extract events clearly described as hackathons, build weeks, or coding competitions.
- Do NOT invent events not present in the search snippets.
- Skip duplicates matching **alreadyKnown** (same title+organizer or same URL host).
- Max 8 hackathons per batch.
- Valid JSON only.`;

/**
 * @param {{ hits: WebSearchHit[]; knownHackathons?: { title: string; organizer?: string }[]; model?: string | null }} input
 * @returns {Promise<HackathonRecord[]>}
 */
export async function runHackathonExtractAgent(input) {
  const hits = input.hits.slice(0, 20);
  if (hits.length === 0) return [];

  const known = Array.isArray(input.knownHackathons) ? input.knownHackathons.slice(0, 60) : [];

  if (!process.env.OPENROUTER_API_KEY) {
    return hits.slice(0, 3).map((h) => ({
      source: /** @type {const} */ ("web"),
      sourceId: h.id,
      dedupeKey: `web:${hackathonDedupeKey({ title: h.title, organizer: "", applicationUrl: h.url }) || h.id}`,
      title: (h.title || h.url).slice(0, 200),
      organizer: "",
      description: h.text.slice(0, 600),
      url: h.url,
      applicationUrl: h.url,
      location: "",
      locationType: "",
      isIndonesia: detectIndonesia(`${h.title} ${h.text}`),
      themes: ["unparsed"],
      prizePool: null,
      prizeAmountUsd: null,
      submissionDates: null,
      deadline: null,
      openState: "unknown",
      registrationsCount: null,
      thumbnailUrl: null,
      relevanceScore: 35,
      relevanceReason: "OpenRouter not configured — raw web hit saved for manual review.",
    }));
  }

  const compact = hits.map((h) => ({
    id: h.id,
    url: h.url,
    title: h.title,
    snippet: h.text.slice(0, 600),
    query: h.query,
  }));

  const model = resolveInternalPipelineModel(input.model);
  const messages = withLlmIdentitySystemNote(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Extract technology hackathons from these web search results.\n\nAlready in database (skip duplicates):\n${JSON.stringify({ alreadyKnown: known })}\n\nSearch results:\n${JSON.stringify({ results: compact })}`,
      },
    ],
    model,
  );

  const result = await callOpenRouter(messages, {
    model,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.hackathonScout,
    temperature: 0.25,
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonObjectFromLlm(result.response);
  return coerceExtractions(parsed, hits);
}
