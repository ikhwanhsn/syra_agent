/**
 * Shared pump.fun alpha discovery, scoring, and classification.
 */

const PUMP_FUN_COIN_META_BASE = (process.env.PUMP_FUN_FRONTEND_API_BASE_V3 ||
  "https://frontend-api-v3.pump.fun"
).replace(/\/$/, "");

const DEXSCREENER_TOKEN_PROFILES_URL = "https://api.dexscreener.com/token-profiles/latest/v1";
const DEXSCREENER_TOKEN_BOOSTS_LATEST_URL = "https://api.dexscreener.com/token-boosts/latest/v1";
const DEXSCREENER_TOKEN_BOOSTS_TOP_URL = "https://api.dexscreener.com/token-boosts/top/v1";

export const RELAXED_LOOKBACK_MS = Object.freeze({
  today: 14 * 24 * 60 * 60 * 1000,
  week: 45 * 24 * 60 * 60 * 1000,
  month: 120 * 24 * 60 * 60 * 1000,
});

export const PERIODS_MS = Object.freeze({
  today: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
});

const NARRATIVE_STOP_WORDS = new Set([
  "the",
  "and",
  "coin",
  "token",
  "sol",
  "pump",
  "fun",
  "meme",
  "official",
  "real",
  "new",
  "v2",
  "v3",
]);

/**
 * @param {unknown} v
 * @returns {v is string}
 */
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * @param {unknown} s
 */
function isLikelySolanaPubkey(s) {
  if (!isNonEmptyString(s)) return false;
  const t = s.trim();
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

/**
 * @param {unknown} ts
 * @returns {number | null}
 */
function toMillis(ts) {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return null;
  if (ts > 1_000_000_000_000) return Math.floor(ts);
  if (ts > 1_000_000_000) return Math.floor(ts * 1000);
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

/**
 * @param {string} period
 */
export function getPeriodMs(period) {
  if (period in PERIODS_MS) return PERIODS_MS[period];
  return PERIODS_MS.week;
}

/**
 * @param {string} period
 */
export function getRelaxedLookbackMs(period) {
  if (period in RELAXED_LOOKBACK_MS) return RELAXED_LOOKBACK_MS[period];
  return RELAXED_LOOKBACK_MS.week;
}

/**
 * @param {string} symbol
 * @param {string} name
 * @returns {Set<string>}
 */
export function narrativeKeywords(symbol, name) {
  const raw = `${symbol ?? ""} ${name ?? ""}`.toLowerCase();
  const parts = raw
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !NARRATIVE_STOP_WORDS.has(w));
  return new Set(parts);
}

/**
 * @param {Set<string>} a
 * @param {Set<string>} b
 */
export function keywordOverlapScore(a, b) {
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const w of a) {
    if (b.has(w)) overlap += 1;
  }
  if (overlap > 0) return Math.min(40, overlap * 14);
  for (const wa of a) {
    for (const wb of b) {
      if (wa.length >= 4 && wb.length >= 4 && (wa.includes(wb) || wb.includes(wa))) {
        return 18;
      }
    }
  }
  return 0;
}

/**
 * @param {ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null }} token
 * @param {number} nowMs
 */
export function computePumpScore(token, nowMs) {
  let score = 0;
  const mc = token.marketCapUsd;
  const ath = token.athMarketCapUsd;
  const lastTrade = token.lastTradeTimestampMs;
  const athTs = token.athMarketCapTimestampMs;

  if (lastTrade != null) {
    const tradeAge = nowMs - lastTrade;
    if (tradeAge <= 10 * 60 * 1000) score += 32;
    else if (tradeAge <= 25 * 60 * 1000) score += 24;
    else if (tradeAge <= 60 * 60 * 1000) score += 14;
    else if (tradeAge <= 2 * 60 * 60 * 1000) score += 6;
    else score -= 18;
  } else {
    score -= 25;
  }

  if (mc != null && ath != null && ath > 0) {
    const athRatio = mc / ath;
    if (athRatio >= 0.94 && athRatio <= 1.08) score += 26;
    else if (athRatio >= 0.82 && athRatio <= 1.2) score += 14;
    else if (athRatio < 0.65) score -= 8;
  }

  if (athTs != null && nowMs - athTs <= 3 * 60 * 60 * 1000) score += 18;
  else if (athTs != null && nowMs - athTs <= 8 * 60 * 60 * 1000) score += 8;

  if (mc != null) {
    if (mc >= 40_000 && mc <= 1_500_000) score += 12;
    else if (mc >= 15_000 && mc <= 3_000_000) score += 6;
    else if (mc < 8_000) score -= 10;
  }

  if (token.complete) score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * @param {ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null }} candidate
 * @param {ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null; pumpScore?: number }} alpha
 * @param {number} nowMs
 */
export function computeBetaAlignmentScore(candidate, alpha, nowMs) {
  if (candidate.mint === alpha.mint) return 0;

  let score = keywordOverlapScore(
    narrativeKeywords(candidate.symbol, candidate.name),
    narrativeKeywords(alpha.symbol, alpha.name),
  );

  const cMc = candidate.marketCapUsd;
  const aMc = alpha.marketCapUsd;
  if (cMc != null && aMc != null && aMc > 0) {
    const mcRatio = cMc / aMc;
    if (mcRatio >= 0.08 && mcRatio <= 0.55) score += 22;
    else if (mcRatio <= 0.75) score += 10;
    else if (mcRatio >= 0.9) score -= 12;
  }

  const cCreated = candidate.createdTimestampMs ?? candidate.anchorTsMs;
  const aCreated = alpha.createdTimestampMs ?? alpha.anchorTsMs;
  if (cCreated != null && aCreated != null) {
    const launchDelta = Math.abs(cCreated - aCreated);
    if (launchDelta <= 6 * 60 * 60 * 1000) score += 16;
    else if (launchDelta <= 24 * 60 * 60 * 1000) score += 8;
  }

  const lastTrade = candidate.lastTradeTimestampMs;
  if (lastTrade != null && nowMs - lastTrade <= 90 * 60 * 1000) score += 12;
  else if (lastTrade != null && nowMs - lastTrade <= 3 * 60 * 60 * 1000) score += 5;
  else score -= 10;

  if (cMc != null && cMc >= 8_000 && cMc <= 180_000) score += 10;

  const ath = candidate.athMarketCapUsd;
  if (ath != null && cMc != null && ath > cMc * 1.15) score += 6;

  if (candidate.complete === alpha.complete) score += 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * @param {Array<ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null }>} pool
 * @param {number} nowMs
 * @param {number} [maxAlpha]
 * @param {number} [maxBetaPerAlpha]
 */
export function classifyAlphaBetaPlays(pool, nowMs, maxAlpha = 5, maxBetaPerAlpha = 3) {
  const scored = pool
    .map((t) => ({ ...t, pumpScore: computePumpScore(t, nowMs) }))
    .filter((t) => t.pumpScore >= 48)
    .sort((a, b) => b.pumpScore - a.pumpScore || (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0));

  const alphaTokens = scored.slice(0, maxAlpha);
  const alphaMints = new Set(alphaTokens.map((t) => t.mint));
  const betaTokens = [];

  for (const alpha of alphaTokens) {
    const candidates = pool
      .filter((t) => !alphaMints.has(t.mint))
      .map((t) => ({
        ...t,
        pumpScore: computePumpScore(t, nowMs),
        alignmentScore: computeBetaAlignmentScore(t, alpha, nowMs),
        alignedToAlphaMint: alpha.mint,
        alignedToAlphaSymbol: alpha.symbol,
      }))
      .filter((t) => t.alignmentScore >= 38 && t.pumpScore < alpha.pumpScore)
      .sort((a, b) => b.alignmentScore - a.alignmentScore || b.pumpScore - a.pumpScore)
      .slice(0, maxBetaPerAlpha);

    for (const b of candidates) {
      if (betaTokens.some((x) => x.mint === b.mint)) continue;
      betaTokens.push(b);
    }
  }

  betaTokens.sort((a, b) => b.alignmentScore - a.alignmentScore);
  return { alphaTokens, betaTokens };
}

/**
 * @param {ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null; pumpScore?: number }} token
 */
export function alphaReason(token) {
  const parts = [];
  if (token.pumpScore != null) parts.push(`pump score ${token.pumpScore}`);
  if (token.marketCapUsd != null) parts.push(`MC ${Math.round(token.marketCapUsd / 1000)}k`);
  if (token.athMarketCapUsd != null && token.marketCapUsd != null) {
    const pct = Math.round((token.marketCapUsd / token.athMarketCapUsd) * 100);
    parts.push(`${pct}% of ATH`);
  }
  return `Running hard — ${parts.join(", ")}`;
}

/**
 * @param {ReturnType<typeof normalizePumpfunMeta> & { alignmentScore?: number; alignedToAlphaSymbol?: string }} token
 */
export function betaReason(token) {
  const sym = token.alignedToAlphaSymbol ?? "alpha";
  return `Beta play aligned to ${sym} — alignment ${token.alignmentScore ?? 0}, narrative overlap + earlier MC band`;
}

/**
 * @param {ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null }} t
 */
export function toPublicToken(t) {
  return {
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
    pumpScore: typeof t.pumpScore === "number" ? t.pumpScore : null,
    alignmentScore: typeof t.alignmentScore === "number" ? t.alignmentScore : null,
    alignedToAlphaMint: typeof t.alignedToAlphaMint === "string" ? t.alignedToAlphaMint : null,
    playRole: t.playRole ?? null,
  };
}

/**
 * @param {string} mint
 * @param {AbortSignal} [signal]
 */
async function fetchPumpfunCoinMeta(mint, signal) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  if (ctrl && typeof ctrl.abort === "function") {
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
  if (!res.ok) throw new Error(`pump.fun meta HTTP ${res.status}`);
  const raw = await res.json().catch(() => null);
  if (!raw || typeof raw !== "object") throw new Error("pump.fun meta invalid_body");
  return raw;
}

/**
 * @param {unknown} raw
 */
export function normalizePumpfunMeta(raw) {
  if (!raw || typeof raw !== "object") throw new Error("meta_raw_not_object");
  const o = /** @type {Record<string, unknown>} */ (raw);

  const mint = typeof o.mint === "string" ? o.mint : "";
  const symbol = typeof o.symbol === "string" ? o.symbol : "";
  const name = typeof o.name === "string" ? o.name : "";
  const program = typeof o.program === "string" ? o.program : undefined;
  const complete = o.complete === true;

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
  const description = typeof o.description === "string" ? o.description.trim().slice(0, 800) : "";
  const twitter = typeof o.twitter === "string" ? o.twitter.trim().slice(0, 120) : "";
  const telegram = typeof o.telegram === "string" ? o.telegram.trim().slice(0, 120) : "";
  const website = typeof o.website === "string" ? o.website.trim().slice(0, 200) : "";

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
    description: description || null,
    twitter: twitter || null,
    telegram: telegram || null,
    website: website || null,
  };
}

/**
 * @param {object} [opts]
 * @param {number} [opts.candidateCap]
 */
export async function fetchPumpfunDiscoveryPool(opts = {}) {
  const candidateCap = Math.min(200, Math.max(40, opts.candidateCap ?? 140));
  const nowMs = Date.now();

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
    if (candidates.length >= candidateCap) break;
  }
  for (const it of boostsLatestItems) {
    maybePushCandidate(it?.tokenAddress);
    if (candidates.length >= candidateCap) break;
  }
  for (const it of boostsTopItems) {
    maybePushCandidate(it?.tokenAddress);
    if (candidates.length >= candidateCap) break;
  }

  /** @type {Array<ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null }>} */
  const pumpMetas = [];

  await mapLimit(candidates, 5, async (mint) => {
    const ctrlLocalTimeout = new AbortController();
    const local = setTimeout(() => ctrlLocalTimeout.abort(), 8000);
    try {
      const raw = await fetchPumpfunCoinMeta(mint, ctrlLocalTimeout.signal);
      const meta = normalizePumpfunMeta(raw);
      if (meta.program && meta.program !== "pump") return;
      const anchorTsMs =
        meta.createdTimestampMs ??
        meta.athMarketCapTimestampMs ??
        meta.lastTradeTimestampMs ??
        meta.updatedAtMs;
      pumpMetas.push({ ...meta, anchorTsMs: anchorTsMs ?? null });
    } catch {
      /* per-token */
    } finally {
      clearTimeout(local);
    }
  });

  return { candidatePool: candidates.length, pumpMetas, nowMs };
}

/**
 * @param {object[]} history
 */
export function buildLearnedAlphaProfile(history) {
  const rows = Array.isArray(history) ? history.filter((h) => h && typeof h.mint === "string") : [];
  if (rows.length === 0) {
    return {
      sampleSize: 0,
      topKeywords: [],
      mcBandUsd: { min: null, max: null, median: null },
      completeRate: null,
      avgPumpScoreAtFlag: null,
      prefersComplete: null,
    };
  }

  /** @type {Map<string, number>} */
  const kwCounts = new Map();
  const mcValues = [];
  let completeCount = 0;
  const pumpScores = [];

  for (const row of rows) {
    const kws = Array.isArray(row.keywords) ? row.keywords : [];
    for (const kw of kws) {
      if (typeof kw !== "string" || !kw.trim()) continue;
      kwCounts.set(kw, (kwCounts.get(kw) ?? 0) + 1);
    }
    if (typeof row.marketCapUsd === "number" && Number.isFinite(row.marketCapUsd)) {
      mcValues.push(row.marketCapUsd);
    }
    if (row.complete === true) completeCount += 1;
    if (typeof row.pumpScore === "number" && Number.isFinite(row.pumpScore)) {
      pumpScores.push(row.pumpScore);
    }
  }

  mcValues.sort((a, b) => a - b);
  const median =
    mcValues.length > 0 ? mcValues[Math.floor(mcValues.length / 2)] : null;

  const topKeywords = [...kwCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([keyword, count]) => ({ keyword, count }));

  const avgPumpScoreAtFlag =
    pumpScores.length > 0
      ? Math.round((pumpScores.reduce((a, b) => a + b, 0) / pumpScores.length) * 10) / 10
      : null;

  const completeRate =
    rows.length > 0 ? Math.round((completeCount / rows.length) * 100) / 100 : null;

  return {
    sampleSize: rows.length,
    topKeywords,
    mcBandUsd: {
      min: mcValues.length ? mcValues[0] : null,
      max: mcValues.length ? mcValues[mcValues.length - 1] : null,
      median,
    },
    completeRate,
    avgPumpScoreAtFlag,
    prefersComplete: completeRate != null && completeRate >= 0.5,
  };
}

/**
 * @param {ReturnType<typeof normalizePumpfunMeta> & { anchorTsMs: number | null }} token
 * @param {ReturnType<typeof buildLearnedAlphaProfile>} profile
 * @param {number} nowMs
 */
export function computeLearnedAlphaFitScore(token, profile, nowMs) {
  if (!profile || profile.sampleSize < 3) {
    return Math.round(computePumpScore(token, nowMs) * 0.85);
  }

  let score = computePumpScore(token, nowMs) * 0.45;
  const kws = narrativeKeywords(token.symbol, token.name);

  for (const { keyword, count } of profile.topKeywords) {
    if (kws.has(keyword)) score += Math.min(12, count * 3);
    else {
      for (const w of kws) {
        if (w.length >= 4 && keyword.length >= 4 && (w.includes(keyword) || keyword.includes(w))) {
          score += 6;
          break;
        }
      }
    }
  }

  const mc = token.marketCapUsd;
  const { min, max, median } = profile.mcBandUsd;
  if (mc != null && median != null && min != null && max != null) {
    const lo = Math.max(8_000, min * 0.35);
    const hi = Math.max(lo + 10_000, max * 2.5);
    if (mc >= lo && mc <= hi) score += 18;
    else if (mc >= lo * 0.6 && mc <= hi * 1.4) score += 8;
    else score -= 6;
  }

  if (profile.prefersComplete != null) {
    if (token.complete === profile.prefersComplete) score += 8;
    else score -= 4;
  }

  const lastTrade = token.lastTradeTimestampMs;
  if (lastTrade != null && nowMs - lastTrade <= 45 * 60 * 1000) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}
