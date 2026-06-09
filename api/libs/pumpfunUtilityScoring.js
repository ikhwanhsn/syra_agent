/**
 * Heuristic utility / tech project scoring for pump.fun tokens.
 */

const UTILITY_SIGNALS = [
  { re: /\b(ai|agent|agents|llm|gpt|mcp)\b/i, weight: 14 },
  { re: /\b(api|apis|sdk|infra|rpc|indexer|oracle)\b/i, weight: 12 },
  { re: /\b(defi|swap|bridge|vault|lend|stake|yield|amm|dex)\b/i, weight: 11 },
  { re: /\b(data|analytics|terminal|dashboard|hub|platform|saas)\b/i, weight: 10 },
  { re: /\b(tool|tools|bot|bots|automation|workflow|engine|stack)\b/i, weight: 10 },
  { re: /\b(protocol|network|layer|node|compute|gpu|cloud|dev)\b/i, weight: 9 },
  { re: /\b(app|software|service|utility|tech|product|studio|labs)\b/i, weight: 8 },
  { re: /\b(payment|payments|x402|wallet|identity|auth|security)\b/i, weight: 9 },
  { re: /\b(game|gaming|metaverse|vr|nft utility)\b/i, weight: 6 },
];

const MEME_PENALTY = [
  /\b(pepe|doge|wif|bonk|trump|elon|moon|100x|lfg|wojak|chad|meme|shit|pump\.fun only)\b/i,
  /\b(cat|frog|dog|baby|coin|inu)\b/i,
];

const PROJECT_TYPE_RULES = [
  { type: "ai-agent", re: /\b(ai|agent|llm|gpt|mcp|copilot)\b/i },
  { type: "api-infra", re: /\b(api|sdk|rpc|infra|indexer|oracle|data)\b/i },
  { type: "defi", re: /\b(defi|swap|amm|dex|lend|vault|yield|bridge)\b/i },
  { type: "dev-tool", re: /\b(tool|sdk|dev|code|github|automation|workflow)\b/i },
  { type: "payments", re: /\b(payment|x402|wallet|checkout|invoice)\b/i },
  { type: "consumer-app", re: /\b(app|platform|saas|game|social|marketplace)\b/i },
];

/**
 * @param {ReturnType<import("./pumpfunAlphaCore.js").normalizePumpfunMeta>} token
 */
export function inferProjectType(token) {
  const text = buildUtilityText(token);
  for (const rule of PROJECT_TYPE_RULES) {
    if (rule.re.test(text)) return rule.type;
  }
  return "general-utility";
}

/**
 * @param {ReturnType<import("./pumpfunAlphaCore.js").normalizePumpfunMeta>} token
 */
function buildUtilityText(token) {
  return [
    token.name,
    token.symbol,
    token.description ?? "",
    token.twitter ?? "",
    token.telegram ?? "",
    token.website ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * @param {ReturnType<import("./pumpfunAlphaCore.js").normalizePumpfunMeta>} token
 * @param {number} nowMs
 */
export function computeUtilityScore(token, nowMs) {
  if (token.isNsfw) return 0;

  const text = buildUtilityText(token);
  let score = 0;

  for (const { re, weight } of UTILITY_SIGNALS) {
    if (re.test(text)) score += weight;
  }

  for (const re of MEME_PENALTY) {
    if (re.test(text)) score -= 14;
  }

  if (token.website) score += 16;
  if (token.twitter) score += 10;
  if (token.telegram) score += 6;
  if (token.description && token.description.length >= 50) score += 14;
  else if (token.description && token.description.length >= 20) score += 6;

  const sym = token.symbol.trim();
  if (sym.length >= 4 && sym.length <= 10) score += 4;

  const mc = token.marketCapUsd;
  if (mc != null && mc >= 20_000 && mc <= 2_000_000) score += 8;
  else if (mc != null && mc >= 8_000) score += 3;

  if (token.complete) score += 6;

  const lastTrade = token.lastTradeTimestampMs;
  if (lastTrade != null && nowMs - lastTrade <= 2 * 60 * 60 * 1000) score += 8;
  else if (lastTrade != null && nowMs - lastTrade <= 6 * 60 * 60 * 1000) score += 3;
  else score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * @param {object[]} history
 */
export function buildLearnedUtilityProfile(history) {
  const rows = Array.isArray(history) ? history.filter((h) => h && typeof h.mint === "string") : [];
  if (!rows.length) {
    return {
      sampleSize: 0,
      topProjectTypes: [],
      topKeywords: [],
      withWebsiteRate: null,
      avgUtilityScore: null,
    };
  }

  /** @type {Map<string, number>} */
  const typeCounts = new Map();
  /** @type {Map<string, number>} */
  const kwCounts = new Map();
  let websiteCount = 0;
  let scoreSum = 0;

  for (const row of rows) {
    const pt = typeof row.projectType === "string" ? row.projectType : "general-utility";
    typeCounts.set(pt, (typeCounts.get(pt) ?? 0) + 1);
    const kws = Array.isArray(row.keywords) ? row.keywords : [];
    for (const kw of kws) {
      if (typeof kw === "string" && kw.trim()) kwCounts.set(kw, (kwCounts.get(kw) ?? 0) + 1);
    }
    if (row.website) websiteCount += 1;
    if (typeof row.utilityScore === "number") scoreSum += row.utilityScore;
  }

  return {
    sampleSize: rows.length,
    topProjectTypes: [...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({ type, count })),
    topKeywords: [...kwCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([keyword, count]) => ({ keyword, count })),
    withWebsiteRate: Math.round((websiteCount / rows.length) * 100) / 100,
    avgUtilityScore: Math.round((scoreSum / rows.length) * 10) / 10,
  };
}

/**
 * @param {ReturnType<import("./pumpfunAlphaCore.js").normalizePumpfunMeta>} token
 * @param {ReturnType<typeof buildLearnedUtilityProfile>} profile
 * @param {number} nowMs
 */
export function computeLearnedUtilityFitScore(token, profile, nowMs) {
  const base = computeUtilityScore(token, nowMs);
  if (!profile || profile.sampleSize < 2) return base;

  let score = base * 0.55;
  const pt = inferProjectType(token);
  for (const { type, count } of profile.topProjectTypes) {
    if (type === pt) score += Math.min(18, count * 4);
  }

  const text = buildUtilityText(token);
  for (const { keyword, count } of profile.topKeywords) {
    if (text.includes(keyword.toLowerCase())) score += Math.min(10, count * 2);
  }

  if (profile.withWebsiteRate != null && profile.withWebsiteRate >= 0.4 && token.website) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * @param {ReturnType<import("./pumpfunAlphaCore.js").normalizePumpfunMeta>} token
 */
export function utilityKeywords(token) {
  const text = buildUtilityText(token);
  const found = new Set();
  for (const { re } of UTILITY_SIGNALS) {
    const m = text.match(re);
    if (m?.[0]) found.add(m[0].toLowerCase());
  }
  return [...found].slice(0, 8);
}
