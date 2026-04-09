import {
  dexBuyPressure,
  dexMomentumScore,
  dexNearTermScore,
  dexShortVsLongDivergence,
  liquidityUsd,
  pairAgeMinutes,
  rugcheckDumpBias,
  volumeTrendScore,
} from "./marketSignals.js";
import { computeMetaTrendScore, mintTrendingStatus, tokenizeTarget } from "./metaSimilarity.js";
import { marketUpProbability } from "./arenaLearner.js";

/**
 * @typedef {import('./marketContext.js').MarketContext} MarketContext
 * @typedef {import('./learnFromSubmissions.js').LearnedAdjustments} LearnedAdjustments
 * @typedef {import('./narrativeContext.js').NarrativeContext} NarrativeContext
 * @typedef {import('./trendingFeeds.js').TrendingSnapshot} TrendingSnapshot
 * @typedef {import('./arenaLearner.js').LearnerWeights} LearnerWeights
 * @typedef {import('./arenaFeatureLog.js').ArenaFeatureVector} ArenaFeatureVector
 */

/**
 * @typedef {{
 *   prediction: 'Pump' | 'Dump';
 *   confidence: number;
 *   reasoning: string;
 *   chatMessage: string;
 *   signalsUsed: string[];
 *   dataSources: string[];
 *   toolCalls: Array<{ tool: string; latencyMs: number; success: boolean }>;
 *   modelName: string;
 *   modelProvider: string;
 *   frameworkName: string;
 *   frameworkTags: string[];
 *   decisionTimeMs: number;
 * }} ArenaSubmitPayload
 */

/** @param {string} s */
function hashToIndex(s, mod) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

/**
 * @param {'Pump' | 'Dump'} prediction
 * @param {string} sym
 * @param {string} challengeId
 */
function pickChatMessage(prediction, sym, challengeId) {
  const pump = [
    (x) => `${x}: hot meta + trend screen — leaning pump.`,
    (x) => `${x}: aligns with live Dex trends — long bias.`,
    (x) => `${x}: narrative cluster still active — pump side.`,
    (x) => `${x}: learner + trending agree up — riding it.`,
  ];
  const dump = [
    (x) => `${x}: weak vs trend basket — fading.`,
    (x) => `${x}: meta mismatch + risk — dump.`,
    (x) => `${x}: not seeing the CT cluster — short.`,
    (x) => `${x}: model tilts fade here — dump.`,
  ];
  const list = prediction === "Pump" ? pump : dump;
  const i = hashToIndex(challengeId || sym, list.length);
  return list[i](sym.slice(0, 12));
}

/**
 * @param {number | null | undefined} x
 */
function pctStr(x, digits = 1) {
  if (x == null || !Number.isFinite(x)) return "?";
  return `${(x * 100).toFixed(digits)}%`;
}

/**
 * @param {{
 *   pair: unknown;
 *   rugReport: unknown;
 *   tokenSymbol?: string;
 *   tokenName?: string;
 *   contractAddress: string;
 *   decisionTimeMs: number;
 *   challengeId?: string;
 *   marketContext?: MarketContext | null;
 *   priceAtRelease?: number | null;
 *   narrativeContext?: NarrativeContext | null;
 *   learnedAdjustments?: LearnedAdjustments | null;
 *   trendingSnapshot: TrendingSnapshot;
 *   learnerWeights: LearnerWeights;
 *   modelName?: string;
 *   modelProvider?: string;
 *   frameworkName?: string;
 *   frameworkTags?: string[];
 * }} input
 * @returns {{ payload: ArenaSubmitPayload; features: ArenaFeatureVector }}
 */
export function buildArenaV2Decision(input) {
  const {
    pair,
    rugReport,
    tokenSymbol = "?",
    tokenName = "",
    contractAddress,
    decisionTimeMs,
    challengeId = "",
    marketContext = null,
    priceAtRelease = null,
    narrativeContext = null,
    learnedAdjustments = null,
    trendingSnapshot,
    learnerWeights,
    modelName = "syra-arena-v3",
    modelProvider = "syra",
    frameworkName = "syra-trending-meta-learner",
    frameworkTags = ["syra", "arena-s2", "arena-v3", "dexscreener-trending", "meta-cluster", "online-learner"],
  } = input;

  const mint = String(contractAddress).trim();
  const sym = String(tokenSymbol).replace(/\s+/g, "").slice(0, 14);
  const name = String(tokenName).trim();

  const mom = dexMomentumScore(pair);
  const near = dexNearTermScore(pair);
  const flow = dexBuyPressure(pair);
  const volTrend = volumeTrendScore(pair);
  const horizonDiv = dexShortVsLongDivergence(pair);
  const rug = rugcheckDumpBias(rugReport);
  const liq = liquidityUsd(pair);
  const ageMin = pairAgeMinutes(pair);

  const tapeBase = 0.28 * near + 0.22 * mom + 0.2 * flow + 0.14 * volTrend + 0.08 * horizonDiv;
  const hs = marketContext?.holderSkewScore ?? 0;
  const tape = tapeBase + 0.1 * hs;

  const narr = narrativeContext?.ok && narrativeContext.resultCount > 0 ? narrativeContext.narrativeScore : 0;

  const meta = computeMetaTrendScore(name, sym, trendingSnapshot);
  const mt = mintTrendingStatus(mint, trendingSnapshot);
  const trendBoost = mt.inBoost ? 1 : 0;
  const trendProfile = mt.inProfile && !mt.inBoost ? 1 : 0;

  /** @type {ArenaFeatureVector} */
  const f = {
    trendBoost,
    trendProfile,
    meta,
    tape: Math.max(-1, Math.min(1, tape * 1.35)),
    rug: Math.max(-1, Math.min(1, rug * 4.5)),
    narr: Math.max(-1, Math.min(1, narr)),
    flow: Math.max(-1, Math.min(1, flow)),
    horizonDiv: Math.max(-1, Math.min(1, horizonDiv)),
    directionScore: 0,
  };

  const pUp = marketUpProbability(f, learnerWeights);

  const trendSlot = mt.inBoost ? 0.92 : mt.inProfile ? 0.58 : mt.inAny ? 0.42 : 0;
  const metaSlot = meta * 0.38;
  const learnSlot = (pUp - 0.5) * 1.15;
  const techSlot = tape * 0.14;
  const riskSlot = rug * 0.2;
  const narrSlot = narr * 0.1;

  const la = learnedAdjustments;
  const histBias = (la?.compositeBias ?? 0) * 0.55;

  let directionScore =
    trendSlot + metaSlot + learnSlot + techSlot + riskSlot + narrSlot + histBias;

  if (horizonDiv < -0.32 && near > 0.2) directionScore -= 0.12;
  if (tokenizeTarget(name + sym).length >= 2 && meta < -0.05 && !mt.inAny) directionScore -= 0.08;

  f.directionScore = Math.max(-1, Math.min(1, directionScore));

  const DUMP_EDGE = 0.055;
  const PUMP_EDGE = 0.035;

  /** @type {'Pump' | 'Dump'} */
  let prediction;
  if (directionScore >= PUMP_EDGE) prediction = "Pump";
  else if (directionScore <= -DUMP_EDGE) prediction = "Dump";
  else prediction = pUp >= 0.5 ? "Pump" : "Dump";

  const top10 = marketContext?.top10HolderPct;
  const top1 = marketContext?.top1HolderPct;

  let confidence = 0.38 + 0.42 * Math.min(1, Math.abs(directionScore) * 1.15);
  if (prediction === "Dump") confidence *= 0.9;
  if (mt.inBoost) confidence = Math.min(0.84, confidence + 0.06);
  if (meta > 0.35) confidence = Math.min(0.84, confidence + 0.04);
  if (top10 != null && top10 > 0.4) confidence -= 0.05;
  if (liq > 0 && liq < 12_000) confidence -= 0.04;
  if (!pair) confidence = Math.min(confidence, 0.52);
  if (ageMin != null && ageMin < 8) confidence -= 0.03;
  const confScale = la?.confidenceScale ?? 1;
  confidence *= confScale;
  confidence = Math.min(0.84, Math.max(0.34, Math.round(confidence * 100) / 100));

  const chatMessage = pickChatMessage(prediction, sym || "?", challengeId || mint);

  const holdNote =
    marketContext?.rpcOk && top10 != null
      ? `top10 ${pctStr(top10)} top1 ${pctStr(top1)}.`
      : "holders n/a.";

  const trendNote = `v3 tr_b${trendBoost} tr_p${trendProfile} meta${meta.toFixed(2)} pUp${pUp.toFixed(2)} d${directionScore.toFixed(2)} snap${trendingSnapshot.solMintsAll.size}`;
  const learnNote =
    (la?.compositeBias ?? 0) !== 0 || (la?.thPumpDelta ?? 0) > 0
      ? ` hist${(la?.compositeBias ?? 0).toFixed(2)}`
      : "";
  const narrNote = narr ? ` n${narr.toFixed(2)}` : "";

  const reasoningParts = [
    `${prediction} ${trendNote}${narrNote}${learnNote}. Liq ~$${Math.round(liq)}. ${holdNote}`,
    name ? name.slice(0, 36) : "",
  ];
  let reasoning = reasoningParts.filter(Boolean).join(" ");
  if (reasoning.length > 500) reasoning = reasoning.slice(0, 497) + "...";

  const signalsUsed = [
    "dexscreener_token_boosts_solana",
    "dexscreener_token_profiles_solana",
    "meta_term_overlap_trending_corpus",
    "online_logistic_market_direction",
    "dex_tape_microstructure",
    "rugcheck_risk_damp",
    "optional_exa_narrative",
  ];

  const dataSources = [
    "dexscreener_token_boosts_latest_v1",
    "dexscreener_token_profiles_latest_v1",
    "dexscreener_latest_dex_tokens",
    "rugcheck_token_report",
  ];
  if (narrativeContext?.ok) dataSources.push("exa_ai_web_search_highlights");
  if (trendingSnapshot.dextoolsOk) dataSources.push("dextools_trending_optional");
  if (marketContext?.rpcOk) dataSources.push("solana_rpc_token_largest");

  const toolCalls = [
    {
      tool: "dexscreener-trending-snapshot",
      latencyMs: Math.max(1, Math.min(decisionTimeMs, 120_000)),
      success: !trendingSnapshot.error,
    },
    {
      tool: "market-context",
      latencyMs: Math.max(1, Math.min(decisionTimeMs, 120_000)),
      success: true,
    },
  ];
  if (narrativeContext) {
    toolCalls.push({
      tool: "exa_narrative_search",
      latencyMs: Math.max(1, narrativeContext.latencyMs),
      success: narrativeContext.ok,
    });
  }

  const payload = {
    prediction,
    confidence,
    reasoning,
    chatMessage: chatMessage.slice(0, 500),
    signalsUsed,
    dataSources,
    toolCalls,
    modelName,
    modelProvider,
    frameworkName,
    frameworkTags: frameworkTags.slice(0, 10),
    decisionTimeMs,
  };

  return { payload, features: f };
}
