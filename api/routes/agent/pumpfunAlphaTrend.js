import express from "express";
import { callOpenRouter } from "../../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "./chat.js";

const PUMP_FUN_COIN_META_BASE = (process.env.PUMP_FUN_FRONTEND_API_BASE_V3 ||
  "https://frontend-api-v3.pump.fun"
).replace(/\/$/, "");

const DEXSCREENER_TOKEN_PROFILES_URL = "https://api.dexscreener.com/token-profiles/latest/v1";
const DEXSCREENER_TOKEN_BOOSTS_LATEST_URL = "https://api.dexscreener.com/token-boosts/latest/v1";
const DEXSCREENER_TOKEN_BOOSTS_TOP_URL = "https://api.dexscreener.com/token-boosts/top/v1";
const RELAXED_LOOKBACK_MS = Object.freeze({
  today: 14 * 24 * 60 * 60 * 1000,
  week: 45 * 24 * 60 * 60 * 1000,
  month: 120 * 24 * 60 * 60 * 1000,
});

/**
 * @param {unknown} v
 * @returns {v is string}
 */
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Rough base58 Solana pubkey validation (matches existing pump.fun mint validator style).
 * @param {unknown} s
 */
function isLikelySolanaPubkey(s) {
  if (!isNonEmptyString(s)) return false;
  const t = s.trim();
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

/**
 * Normalize unix timestamps to milliseconds.
 * pump.fun metadata mixes ms and seconds; treat >1e12 as ms, otherwise seconds.
 * @param {unknown} ts
 * @returns {number | null}
 */
function toMillis(ts) {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return null;
  if (ts > 1_000_000_000_000) return Math.floor(ts); // ms
  if (ts > 1_000_000_000) return Math.floor(ts * 1000); // seconds
  return null;
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<void>} fn
 */
async function mapLimit(items, limit, fn) {
  const out = [];
  let idx = 0;
  const worker = async () => {
    while (idx < items.length) {
      const current = idx;
      idx += 1;
      await fn(items[current]);
    }
  };
  const n = Math.max(1, Math.floor(limit));
  for (let i = 0; i < n; i++) out.push(worker());
  await Promise.all(out);
}

const PERIODS_MS = Object.freeze({
  today: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
});

/**
 * @param {string} period
 * @returns {number}
 */
function getPeriodMs(period) {
  if (period in PERIODS_MS) return PERIODS_MS[period];
  return PERIODS_MS.week;
}

/**
 * @param {string} period
 * @returns {number}
 */
function getRelaxedLookbackMs(period) {
  if (period in RELAXED_LOOKBACK_MS) return RELAXED_LOOKBACK_MS[period];
  return RELAXED_LOOKBACK_MS.week;
}

/**
 * @param {string} mint
 * @param {AbortSignal} signal
 */
async function fetchPumpfunCoinMeta(mint, signal) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  if (ctrl && typeof ctrl.abort === "function") {
    // Respect outer signal by aborting the local one.
    if (signal) {
      if (signal.aborted) ctrl.abort();
      else signal.addEventListener("abort", () => ctrl.abort(), { once: true });
    }
  }
  const upstreamSignal = ctrl?.signal ?? signal;
  const url = `${PUMP_FUN_COIN_META_BASE}/coins-v2/${encodeURIComponent(mint)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: upstreamSignal,
  });
  if (!res.ok) {
    throw new Error(`pump.fun meta HTTP ${res.status}`);
  }
  const raw = await res.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    throw new Error("pump.fun meta invalid_body");
  }
  return raw;
}

/**
 * @param {unknown} raw
 * @returns {{
 *  mint: string;
 *  symbol: string;
 *  name: string;
 *  program?: string;
 *  complete: boolean;
 *  marketCapUsd: number | null;
 *  athMarketCapUsd: number | null;
 *  athMarketCapTimestampMs: number | null;
 *  updatedAtMs: number | null;
 *  lastTradeTimestampMs: number | null;
 *  createdTimestampMs: number | null;
 *  isNsfw?: boolean;
 * }}
 */
function normalizePumpfunMeta(raw) {
  if (!raw || typeof raw !== "object") throw new Error("meta_raw_not_object");
  const o = /** @type {Record<string, unknown>} */ (raw);

  const mint = typeof o.mint === "string" ? o.mint : "";
  const symbol = typeof o.symbol === "string" ? o.symbol : "";
  const name = typeof o.name === "string" ? o.name : "";
  const program = typeof o.program === "string" ? o.program : undefined;
  const complete = o.complete === true;

  // pump.fun exposes both `market_cap` and `usd_market_cap`; UI/live page aligns with `usd_market_cap`.
  const marketCapUsd =
    typeof o.usd_market_cap === "number" && Number.isFinite(o.usd_market_cap)
      ? o.usd_market_cap
      : typeof o.market_cap === "number" && Number.isFinite(o.market_cap)
        ? o.market_cap
        : null;
  const athMarketCapUsd =
    typeof o.ath_market_cap === "number" && Number.isFinite(o.ath_market_cap) ? o.ath_market_cap : null;

  const athMarketCapTimestampMs = toMillis(o.ath_market_cap_timestamp);
  const updatedAtMs = toMillis(o.updated_at);
  const lastTradeTimestampMs = toMillis(o.last_trade_timestamp);
  const createdTimestampMs = toMillis(o.created_timestamp);

  if (!isLikelySolanaPubkey(mint)) throw new Error("meta_invalid_mint");
  if (!symbol.trim()) throw new Error("meta_missing_symbol");
  if (!name.trim()) throw new Error("meta_missing_name");

  return {
    mint,
    symbol,
    name,
    program,
    complete,
    marketCapUsd,
    athMarketCapUsd,
    athMarketCapTimestampMs,
    updatedAtMs,
    lastTradeTimestampMs,
    createdTimestampMs,
    isNsfw: o.nsfw === true,
  };
}

/**
 * @param {string} period
 * @returns {import('express').Router}
 */
export function createPumpfunAlphaTrendRouter() {
  const router = express.Router();

  router.get("/trend", async (req, res) => {
    try {
      const period = typeof req.query.period === "string" ? req.query.period.trim() : "week";
      const periodMs = getPeriodMs(period);
      const nowMs = Date.now();
      const startMs = nowMs - periodMs;

      // Candidate pool from multiple Dexscreener feeds; then hard-filter by pump.fun metadata.
      const [profilesRes, boostsLatestRes, boostsTopRes] = await Promise.all([
        fetch(DEXSCREENER_TOKEN_PROFILES_URL, { method: "GET" }).catch(() => null),
        fetch(DEXSCREENER_TOKEN_BOOSTS_LATEST_URL, { method: "GET" }).catch(() => null),
        fetch(DEXSCREENER_TOKEN_BOOSTS_TOP_URL, { method: "GET" }).catch(() => null),
      ]);
      const [profilesRaw, boostsLatestRaw, boostsTopRaw] = await Promise.all([
        profilesRes?.json().catch(() => null),
        boostsLatestRes?.json().catch(() => null),
        boostsTopRes?.json().catch(() => null),
      ]);

      const profileItems =
        profilesRaw && typeof profilesRaw === "object" && Array.isArray(profilesRaw.items)
          ? profilesRaw.items
          : Array.isArray(profilesRaw?.data)
            ? profilesRaw.data
            : [];
      const boostsLatestItems = Array.isArray(boostsLatestRaw) ? boostsLatestRaw : [];
      const boostsTopItems = Array.isArray(boostsTopRaw) ? boostsTopRaw : [];

      const candidates = [];
      const seen = new Set();
      const maybePushCandidate = (rawMint) => {
        const tokenAddress = typeof rawMint === "string" ? rawMint.trim() : "";
        if (!isLikelySolanaPubkey(tokenAddress)) return;
        if (seen.has(tokenAddress)) return;
        seen.add(tokenAddress);
        candidates.push(tokenAddress);
      };

      for (const it of profileItems) {
        maybePushCandidate(it?.tokenAddress);
        if (candidates.length >= 140) break;
      }
      for (const it of boostsLatestItems) {
        maybePushCandidate(it?.tokenAddress);
        if (candidates.length >= 140) break;
      }
      for (const it of boostsTopItems) {
        maybePushCandidate(it?.tokenAddress);
        if (candidates.length >= 140) break;
      }

      /** @type {Array<ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null }>} */
      const completeAll = [];

      await mapLimit(candidates, 5, async (mint) => {
        const ctrlLocalTimeout = new AbortController();
        const local = setTimeout(() => ctrlLocalTimeout.abort(), 8000);
        try {
          const raw = await fetchPumpfunCoinMeta(mint, ctrlLocalTimeout.signal);
          const meta = normalizePumpfunMeta(raw);
          if (!meta.complete) return;
          if (meta.program && meta.program !== "pump") return;
          const anchorTsMs = meta.createdTimestampMs ?? meta.athMarketCapTimestampMs ?? meta.lastTradeTimestampMs ?? meta.updatedAtMs;
          completeAll.push({ ...meta, anchorTsMs: anchorTsMs ?? null });
        } catch {
          // Ignore per-token errors; we only need enough sample to ground the trend.
        } finally {
          clearTimeout(local);
        }
      });

      const strictMatched = completeAll.filter((t) => {
        if (!t.createdTimestampMs) return false;
        return t.createdTimestampMs >= startMs && t.createdTimestampMs <= nowMs;
      });
      const relaxedStartMs = nowMs - getRelaxedLookbackMs(period);
      const relaxedMatched = completeAll.filter((t) => {
        if (!t.createdTimestampMs) return false;
        return t.createdTimestampMs >= relaxedStartMs && t.createdTimestampMs <= nowMs;
      });

      const selected = strictMatched.length > 0 ? strictMatched : relaxedMatched.length > 0 ? relaxedMatched : [];
      const usedRelaxedWindow = strictMatched.length === 0;

      selected.sort((a, b) => {
        const aa = a.marketCapUsd ?? a.athMarketCapUsd ?? 0;
        const bb = b.marketCapUsd ?? b.athMarketCapUsd ?? 0;
        return bb - aa;
      });

      const tokens = selected.slice(0, 12).map((t) => ({
        mint: t.mint,
        symbol: t.symbol,
        name: t.name,
        complete: t.complete,
        marketCapUsd: t.marketCapUsd,
        athMarketCapUsd: t.athMarketCapUsd,
        athMarketCapTimestampMs: t.athMarketCapTimestampMs,
        updatedAtMs: t.updatedAtMs,
        lastTradeTimestampMs: t.lastTradeTimestampMs,
        createdTimestampMs: t.createdTimestampMs,
        anchorTsMs: t.anchorTsMs,
      }));

      if (tokens.length === 0) {
        return res.json({
          success: true,
          data: {
            period,
            startMs,
            nowMs,
            candidatePool: candidates.length,
            matchedCount: 0,
            tokens: [],
            analysis: {
              trendTitle: "No new graduated pump.fun tokens found in current sample",
              metaSummary:
                "Syra couldn’t identify tokens that are both complete=true and newly created within this window from the current discovery sample. Try refresh again in a minute.",
              signals: [],
              watchlist: [],
              riskCaveats: [
                "Provider feeds may be incomplete; token discovery can miss some graduates.",
                "This is informational analysis, not investment advice.",
              ],
            },
          },
        });
      }

      const tokenBriefForLlm = tokens.map((t) => ({
        mint: t.mint,
        symbol: t.symbol,
        marketCapUsd: t.marketCapUsd,
        athMarketCapUsd: t.athMarketCapUsd,
        athMarketCapTimestampMs: t.athMarketCapTimestampMs,
        updatedAtMs: t.updatedAtMs,
        lastTradeTimestampMs: t.lastTradeTimestampMs,
      }));

      const SYSTEM_PROMPT = `You are Syra's Pump.fun trend analyst for graduated tokens.
You will receive ONLY structured JSON about a small set of pump.fun coins that are flagged as "complete" and whose ATH / updates happened within the requested time window.

Your job:
- Identify what trend/meta appears most often (narrative, category, behavior pattern).
- Explain why this pattern might be happening (grounded in the provided numbers and timestamps).
- Produce a watchlist subset of the input tokens with concrete, data-tied reasons.

CRITICAL:
- Output ONLY a single JSON object (no markdown, no extra keys).
- Be cautious: these are informational signals, not investment advice.
- Do not invent token-specific data not present in input.`;

      /** @type {Array<{role:'system'|'user',content:string}>} */
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Time window: ${period} (startMs=${startMs}, nowMs=${nowMs}).
Window mode: ${usedRelaxedWindow ? "relaxed fallback window used because strict match was empty" : "strict"}.

Input tokens (pump.fun complete=true; anchorTsMs falls inside the window):
${JSON.stringify({ period, tokens: tokenBriefForLlm }, null, 2)}

Return JSON:
{
  "trendTitle": string,
  "metaSummary": string,
  "signals": string[],
  "watchlist": Array<{ "mint": string, "symbol": string, "reason": string }>,
  "riskCaveats": string[]
}`,
        },
      ];

      /**
       * @param {string} responseText
       */
      const parseAndValidate = (responseText) => {
        /** @type {unknown} */
        const parsed = parseJsonObjectFromLlm(responseText);
        if (!parsed || typeof parsed !== "object") throw new Error("llm_bad_shape");
        const o = /** @type {Record<string, unknown>} */ (parsed);

        const trendTitle = typeof o.trendTitle === "string" ? o.trendTitle.trim() : "";
        const metaSummary = typeof o.metaSummary === "string" ? o.metaSummary.trim() : "";
        const signals = Array.isArray(o.signals) ? o.signals.map(String).slice(0, 8) : [];
        const riskCaveats = Array.isArray(o.riskCaveats) ? o.riskCaveats.map(String).slice(0, 8) : [];
        const watchlistRaw = Array.isArray(o.watchlist) ? o.watchlist : [];
        const watchlist = watchlistRaw
          .map((w) => {
            const r = w && typeof w === "object" ? w : null;
            const mint = r && typeof r.mint === "string" ? r.mint : "";
            const symbol = r && typeof r.symbol === "string" ? r.symbol : "";
            const reason = r && typeof r.reason === "string" ? r.reason : "";
            return mint && symbol && reason ? { mint, symbol, reason } : null;
          })
          .filter(Boolean)
          .slice(0, 8);

        if (!trendTitle || !metaSummary || !signals.length) throw new Error("llm_missing_fields");
        return { trendTitle, metaSummary, signals, watchlist, riskCaveats };
      };

      /** @type {ReturnType<typeof parseAndValidate>} */
      let analysis;
      let lastResponse = "";
      const llmOpts = { max_tokens: 900, temperature: 0.28 };

      try {
        const result = await callOpenRouter(withLlmIdentitySystemNote(messages, null), llmOpts);
        lastResponse = typeof result?.response === "string" ? result.response : "";
        analysis = parseAndValidate(lastResponse);
      } catch (e1) {
        // One retry with stricter instructions (common failure mode: missing fields / extra text around JSON).
        const retryMessages = [
          ...messages,
          {
            role: "assistant",
            content: lastResponse ? lastResponse.slice(0, 8000) : "",
          },
          {
            role: "user",
            content: `Your last response did not parse or did not match the schema.
Return ONLY valid JSON with exact keys: trendTitle (string), metaSummary (string), signals (string[] length>=1), watchlist (array of objects with mint/symbol/reason), riskCaveats (string[]). No markdown.`,
          },
        ];
        const result2 = await callOpenRouter(withLlmIdentitySystemNote(retryMessages, null), llmOpts);
        lastResponse = typeof result2?.response === "string" ? result2.response : "";
        analysis = parseAndValidate(lastResponse);
      }

      return res.json({
        success: true,
        data: {
          period,
          startMs,
          nowMs,
          candidatePool: candidates.length,
          strictMatchedCount: strictMatched.length,
          relaxedMatchedCount: relaxedMatched.length,
          usedRelaxedWindow,
          matchedCount: tokens.length,
          tokens,
          analysis,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "internal";
      return res.status(500).json({
        success: false,
        error: "pumpfun_alpha_trend_failed",
        message,
      });
    }
  });

  return router;
}

