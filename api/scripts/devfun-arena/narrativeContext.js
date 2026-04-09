import Exa from "exa-js";

/**
 * Web + social context for pump.fun launches (Exa). Blended into arena composite when configured.
 *
 * Env:
 *   EXA_API_KEY — required for narrative fetch (same as api/routes/exa-search.js)
 *   ARENA_DISABLE_NARRATIVE=1 — skip calls (technical-only decisions)
 *   ARENA_NARRATIVE_TIMEOUT_MS — default 12000
 *
 * @typedef {{
 *   narrativeScore: number;
 *   resultCount: number;
 *   query: string;
 *   digest: string;
 *   ok: boolean;
 *   error: string | null;
 *   latencyMs: number;
 * }} NarrativeContext
 */

/** @type {readonly string[]} */
const BULLISH = [
  "moon",
  "mooning",
  "pumping",
  "pump",
  "viral",
  "trending",
  "breaking",
  "listing",
  "partnership",
  "accumulation",
  "bullish",
  "send it",
  "hype",
  "narrative",
  "ai agent",
  "mindshare",
  "ct ",
  "crypto twitter",
  "volume",
  "whale",
  "ath",
  "gem",
];

/** @type {readonly string[]} */
const BEARISH = [
  "rug",
  "rugged",
  "scam",
  "honeypot",
  "exploit",
  "hacked",
  "dev sold",
  "dump",
  "warning",
  "fake",
  "removed",
  "liquidity pulled",
  "pull",
  "honeyp",
  "drain",
  "malicious",
  "avoid",
];

/**
 * @param {string} raw
 * @param {number} maxLen
 */
function sanitizeQueryPart(raw, maxLen) {
  const s = String(raw || "")
    .replace(/[^\p{L}\p{N}\s$#.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
  return s;
}

/**
 * @param {string} corpus
 */
export function scoreNarrativeCorpus(corpus) {
  const t = corpus.toLowerCase();
  if (t.length < 12) return 0;

  let bull = 0;
  let bear = 0;
  for (const w of BULLISH) {
    if (t.includes(w)) bull += 1;
  }
  for (const w of BEARISH) {
    if (t.includes(w)) bear += 1;
  }

  const raw = (bull - bear) / (bull + bear + 4);
  return Math.max(-1, Math.min(1, Math.tanh(raw * 2.8)));
}

/**
 * @param {string} reason
 * @returns {NarrativeContext}
 */
export function emptyNarrative(reason) {
  return {
    narrativeScore: 0,
    resultCount: 0,
    query: "",
    digest: "",
    ok: false,
    error: reason,
    latencyMs: 0,
  };
}

/**
 * @param {{
 *   tokenName?: string;
 *   tokenSymbol?: string;
 *   mint?: string;
 * }} input
 * @returns {Promise<NarrativeContext>}
 */
export async function fetchNarrativeForToken(input) {
  if (process.env.ARENA_DISABLE_NARRATIVE === "1") {
    return emptyNarrative("disabled");
  }
  const key = (process.env.EXA_API_KEY || "").trim();
  if (!key) {
    return emptyNarrative("no EXA_API_KEY");
  }

  const name = sanitizeQueryPart(input.tokenName ?? "", 48);
  const sym = sanitizeQueryPart(input.tokenSymbol ?? "", 20).replace(/^\$+/, "");
  const mintShort = typeof input.mint === "string" ? input.mint.trim().slice(0, 12) : "";

  const parts = [];
  if (sym) parts.push(`$${sym}`);
  if (name && name.toLowerCase() !== sym.toLowerCase()) parts.push(name);
  if (parts.length === 0 && mintShort) parts.push(mintShort);

  const query =
    parts.length > 0
      ? `${parts.join(" ")} pump.fun solana token news twitter past day`
      : `solana pump.fun meme token ${mintShort} sentiment`;

  const timeoutMs = Math.min(
    45_000,
    Math.max(4000, Number.parseInt(process.env.ARENA_NARRATIVE_TIMEOUT_MS || "12000", 10) || 12_000)
  );

  const t0 = Date.now();
  try {
    const exa = new Exa(key);
    const searchPromise = exa.search(query, {
      numResults: 8,
      type: "auto",
      contents: {
        highlights: {
          maxCharacters: 2200,
        },
      },
    });

    const result = await Promise.race([
      searchPromise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("narrative_timeout")), timeoutMs);
      }),
    ]);

    const rows = Array.isArray(result?.results) ? result.results : [];
    /** @type {string[]} */
    const chunks = [];
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const r = /** @type {Record<string, unknown>} */ (row);
      const title = typeof r.title === "string" ? r.title : "";
      if (title) chunks.push(title);
      const hi = r.highlights;
      if (Array.isArray(hi)) {
        for (const h of hi) {
          if (typeof h === "string") chunks.push(h);
        }
      } else if (typeof hi === "string") {
        chunks.push(hi);
      }
      const text = r.text;
      if (typeof text === "string") chunks.push(text.slice(0, 600));
    }

    const corpus = chunks.join(" ").slice(0, 12_000);
    const narrativeScore = scoreNarrativeCorpus(corpus);
    const digest = corpus.replace(/\s+/g, " ").trim().slice(0, 160);

    return {
      narrativeScore,
      resultCount: rows.length,
      query,
      digest,
      ok: rows.length > 0,
      error: rows.length === 0 ? "no_results" : null,
      latencyMs: Date.now() - t0,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      narrativeScore: 0,
      resultCount: 0,
      query,
      digest: "",
      ok: false,
      error: msg.slice(0, 120),
      latencyMs: Date.now() - t0,
    };
  }
}
