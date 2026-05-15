/**
 * Up Only Fund — 13 specialist slots (2–14) in one OpenRouter JSON pass.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
  resolveInternalPipelineModel,
} from "../config/internalPipelineAgents.js";
import { getUponlyFundDevTeamRole } from "../config/uponlyFundDevTeamConfig.js";

/**
 * @typedef {{ slot: number; bullets: string[] }} UponlySpecialistEntry
 * @typedef {{ generatedAt: string; specialists: UponlySpecialistEntry[] }} UponlyDevSpecialistsOutput
 */

const SYSTEM_PROMPT = `You are the Up Only Fund **development intelligence** panel: **13** specialist voices bundled as one JSON response (internal slots **2 through 14** of a 15-slot team; slot 1 is crawl metadata; slot 15 is HR elsewhere).

**Inputs:** crawled markdown from **uponly.fund** routes, a synthetic stack note, and a truncated **public OpenAPI** JSON string from the Syra API host (may include \`/uponly-rise-*\` routes).

**Output:** return **only** valid JSON (no markdown code fences, no commentary). Shape:
{
  "generatedAt": "<ISO-8601 UTC>",
  "specialists": [
    { "slot": 2, "bullets": ["...", "..."] },
    { "slot": 3, "bullets": ["..."] },
    ...
    { "slot": 14, "bullets": ["..."] }
  ]
}

**Rules**
- \`specialists\` must have **exactly 13** objects, **sorted by slot** ascending (2,3,…,14). Each \`slot\` must match that position.
- Each \`bullets\` array: **3 to 5** lines; prefer **≤160 chars** per line.
- Every line = **actionable** engineering or product work (features, refactors, tests, telemetry, UX states, API hardening). Name files/routes **only** when the input explicitly mentions them; otherwise say “dashboard”, “RISE proxy layer”, “terminal page”, etc.
- If evidence is thin, give **best-effort** suggestions and prefix with **verify:** instead of inventing metrics, prices, TVL, user counts, or live chain data.
- **Slot themes (stay on-brief):**
  - 2: product/platform value & information architecture.
  - 3: data integrity, misleading stats, edge cases, resilience.
  - 4: monorepo/API boundaries between \`uponly-fund\` SPA and Syra \`api\` RISE proxies.
  - 5: dashboard UX, loading/error/empty states, accessibility.
  - 6: OHLC, lists, holders, quotes, borrow flows, chart correctness.
  - 7: performance (bundle, code-splitting, images, caching, memoization).
  - 8: security (secrets, CORS, rate limits, validation, SSRF).
  - 9: observability (structured logs, metrics, alerts, runbooks).
  - 10: QA, TypeScript strictness, CI gates, contract tests for API adapters.
  - 11: i18n coverage, DYOR / NFA copy consistency.
  - 12: wallet connect, deep links, trade CTAs, mobile friction.
  - 13: allocator transparency (exports, provenance, audit-friendly views).
  - 14: **prioritized backlog** — each bullet starts with **[now]**, **[next]**, or **[later]** and names one shippable slice.`;

/**
 * @param {string} text
 * @returns {unknown}
 */
function tryParseJsonObject(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) return null;
  const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const inner = fence ? fence[1].trim() : raw;
  try {
    return JSON.parse(inner);
  } catch {
    const start = inner.indexOf("{");
    const end = inner.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(inner.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * @param {unknown} parsed
 * @returns {UponlyDevSpecialistsOutput}
 */
function normalizeSpecialistsOutput(parsed) {
  const now = new Date().toISOString();
  /** @type {UponlySpecialistEntry[]} */
  const out = [];
  for (let slot = 2; slot <= 14; slot += 1) {
    const meta = getUponlyFundDevTeamRole(slot);
    const title = meta?.title || `Slot ${slot}`;
    let bullets = [];
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.specialists)) {
      const hit = parsed.specialists.find(
        (x) => x && typeof x === "object" && Number(x.slot) === slot,
      );
      if (hit && Array.isArray(hit.bullets)) {
        bullets = hit.bullets
          .filter((b) => typeof b === "string" && b.trim())
          .map((b) => b.trim())
          .slice(0, 5);
      }
    }
    if (bullets.length === 0) {
      bullets = [
        `verify: Review ${title} against latest crawl — model returned no bullets for this slot.`,
      ];
    }
    out.push({ slot, bullets });
  }
  const generatedAt =
    parsed &&
    typeof parsed === "object" &&
    typeof parsed.generatedAt === "string" &&
    parsed.generatedAt.trim()
      ? parsed.generatedAt.trim()
      : now;
  return { generatedAt, specialists: out };
}

/**
 * @param {import("../libs/agentTeamCrawl.js").CrawlSnapshotItem[]} snapshot
 * @param {string | null} [model]
 * @returns {Promise<UponlyDevSpecialistsOutput>}
 */
export async function runUponlyFundDevSpecialistsAgent({ snapshot, model }) {
  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    throw new Error("runUponlyFundDevSpecialistsAgent: snapshot is required");
  }
  const modelId = resolveInternalPipelineModel(model);
  const parts = snapshot.map((p) => {
    const url = typeof p.url === "string" ? p.url : "";
    const md = typeof p.markdown === "string" ? p.markdown : "";
    return `## ${url}\n${md}`;
  });
  const blob = parts.join("\n\n---\n\n").slice(0, 118_000);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Crawl + API context (truncated):\n\n${blob}\n\nReturn JSON only.`,
    },
  ];

  const { response } = await callOpenRouter(withLlmIdentitySystemNote(messages, modelId), {
    model: modelId,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.uponlyFundDevSpecialists,
    temperature: 0.28,
  });

  const parsed = tryParseJsonObject(response);
  return normalizeSpecialistsOutput(parsed);
}
