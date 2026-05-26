/**
 * Syra Partnership Scout — on-chain/registry AI & utility projects → collaboration ideas for Syra.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";

/**
 * @typedef {import("../libs/onchainPartnershipSignals.js").PartnershipCandidate} PartnershipCandidate
 */

/**
 * @typedef {{
 *   name: string;
 *   projectType: string;
 *   utility: string;
 *   whyFitForSyra: string;
 *   collaborationIdea: string;
 *   onchainSignals: string[];
 *   priority: 'high' | 'medium' | 'low';
 *   link?: string | null;
 * }} PartnershipTarget
 */

/**
 * @typedef {{
 *   ecosystemSummary: string;
 *   onchainThemes: string[];
 *   partnershipTargets: PartnershipTarget[];
 *   quickIntegrations: string[];
 *   risksOrCaveats: string[];
 *   generatedAt: string;
 *   sourceStats: Record<string, number>;
 * }} SyraPartnershipScoutOutput
 */

const PRIORITIES = new Set(["high", "medium", "low"]);

/**
 * @param {unknown} v
 * @param {string} fallback
 * @returns {string}
 */
function str(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/**
 * @param {unknown} v
 * @returns {'high' | 'medium' | 'low'}
 */
function priority(v) {
  const p = str(v, "medium").toLowerCase();
  return PRIORITIES.has(p) ? /** @type {'high' | 'medium' | 'low'} */ (p) : "medium";
}

/**
 * @param {unknown} raw
 * @returns {PartnershipTarget[]}
 */
function coerceTargets(raw) {
  if (!Array.isArray(raw)) return [];
  /** @type {PartnershipTarget[]} */
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (item);
    const name = str(x.name);
    if (!name) continue;
    const signals = Array.isArray(x.onchainSignals)
      ? x.onchainSignals.map((s) => str(s)).filter(Boolean).slice(0, 6)
      : [];
    out.push({
      name,
      projectType: str(x.projectType, "utility"),
      utility: str(x.utility, ""),
      whyFitForSyra: str(x.whyFitForSyra, ""),
      collaborationIdea: str(x.collaborationIdea, ""),
      onchainSignals: signals,
      priority: priority(x.priority),
      link: x.link != null ? str(x.link) : null,
    });
  }
  return out.slice(0, 10);
}

/**
 * @param {unknown} obj
 * @param {Record<string, number>} stats
 * @returns {SyraPartnershipScoutOutput}
 */
function coerceOutput(obj, stats) {
  const root = obj && typeof obj === "object" ? /** @type {Record<string, unknown>} */ (obj) : {};
  const onchainThemes = Array.isArray(root.onchainThemes)
    ? root.onchainThemes.map((t) => str(t)).filter(Boolean).slice(0, 10)
    : [];
  const quickIntegrations = Array.isArray(root.quickIntegrations)
    ? root.quickIntegrations.map((t) => str(t)).filter(Boolean).slice(0, 8)
    : [];
  const risksOrCaveats = Array.isArray(root.risksOrCaveats)
    ? root.risksOrCaveats.map((t) => str(t)).filter(Boolean).slice(0, 8)
    : [];

  return {
    ecosystemSummary: str(root.ecosystemSummary, "No summary produced."),
    onchainThemes,
    partnershipTargets: coerceTargets(root.partnershipTargets),
    quickIntegrations,
    risksOrCaveats,
    generatedAt: new Date().toISOString(),
    sourceStats: stats,
  };
}

const SYSTEM = `You are **Syra Partnership Scout**, an internal BD analyst for Syra.

**Syra** is a Solana AI trading & research agent with x402-paid APIs (news, sentiment, signals), Telegram bot, agent chat, LP/trading experiments, and ERC-8004 registry presence. Syra wants **collaborations and partnerships** that add real utility — not hype-only memecoins.

**Input:** Curated candidates from on-chain/registry feeds (8004 agents, 8004scan, Jupiter trending, x402 pay.sh providers, curated X x402 ecosystem scores). Each candidate has name, source, category, utility text, and signals.

**Output JSON keys:**
1. **ecosystemSummary** — 2–4 sentences: what AI/utility projects are trending on-chain / in agent registries now.
2. **onchainThemes** — 5–8 short strings (e.g. "x402 skill marketplaces", "8004 reputation leaders").
3. **partnershipTargets** — 5–8 best picks for Syra to reach out to. Each object:
   - name, projectType (agent|api|token-utility|infra|data), utility (what they do)
   - whyFitForSyra (specific synergy with Syra's stack)
   - collaborationIdea (concrete: co-marketing, x402 route, agent tool, LP, signal share, 8004 cross-listing, etc.)
   - onchainSignals (array of strings from input — do not invent metrics)
   - priority (high|medium|low)
   - link (optional, from input)
4. **quickIntegrations** — 3–5 smaller integration ideas Syra could ship without a full partnership (wire their API as agent tool, list in docs, etc.).
5. **risksOrCaveats** — scams, thin utility, data gaps, regulatory noise.

**Rules:**
- Only recommend projects grounded in the candidate list. Prefer AI agents, x402, trading data, and real utility over pure meme tokens.
- Do NOT recommend partnering with direct Syra clones; prefer complementary stacks.
- Do NOT output projects listed in **alreadyKnown** (same name or same link host) — they are already saved in Syra's database.
- Valid JSON only, no markdown.`;

/**
 * @param {{
 *   candidates: PartnershipCandidate[];
 *   ecosystemNotes: string[];
 *   sourceStats: Record<string, number>;
 *   knownProjects?: { name: string; projectType?: string }[];
 *   model?: string | null;
 * }} input
 * @returns {Promise<SyraPartnershipScoutOutput>}
 */
export async function runSyraPartnershipScoutAgent(input) {
  const stats = { ...input.sourceStats, candidates: input.candidates.length };
  const known = Array.isArray(input.knownProjects) ? input.knownProjects.slice(0, 80) : [];

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      ecosystemSummary: "OpenRouter API key not configured; partnership scout skipped LLM analysis.",
      onchainThemes: input.candidates.slice(0, 5).map((c) => `${c.name} (${c.source})`),
      partnershipTargets: [],
      quickIntegrations: [],
      risksOrCaveats: ["Set OPENROUTER_API_KEY to enable full analysis."],
      generatedAt: new Date().toISOString(),
      sourceStats: stats,
    };
  }

  const compactCandidates = input.candidates.map((c) => ({
    name: c.name,
    source: c.source,
    category: c.category,
    utility: c.utility,
    signals: c.signals,
    score: c.score ?? undefined,
    link: c.link ?? undefined,
    handle: c.handle ?? undefined,
  }));

  const model = resolveInternalPipelineModel(input.model);
  const messages = withLlmIdentitySystemNote(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Analyze these on-chain/registry candidates for Syra partnerships.\n\nAlready in Syra database (skip duplicates):\n${JSON.stringify({ alreadyKnown: known })}\n\nNotes: ${JSON.stringify(input.ecosystemNotes)}\n\nCandidates:\n${JSON.stringify(compactCandidates).slice(0, 95_000)}`,
      },
    ],
    model,
  );

  const result = await callOpenRouter(messages, {
    model,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
    temperature: 0.35,
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonObjectFromLlm(result.response);
  return coerceOutput(parsed, stats);
}
