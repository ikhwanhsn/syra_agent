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

/**
 * @typedef {import('./marketContext.js').MarketContext} MarketContext
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
    (x) => `${x}: tape leaning bid - sticking with the pump.`,
    (x) => `${x}: buyers still active - riding the move.`,
    (x) => `${x}: short tape looks constructive - long bias.`,
    (x) => `${x}: flow not dead yet - calling pump.`,
    (x) => `${x}: upside still in play - long here.`,
    (x) => `${x}: green path on the screen - pump side.`,
  ];
  const dump = [
    (x) => `${x}: offer side heavy - fading this.`,
    (x) => `${x}: sellers in control - dump side.`,
    (x) => `${x}: can't hold bids - taking the fade.`,
    (x) => `${x}: distribution showing - short bias.`,
    (x) => `${x}: weak follow-through - calling dump.`,
    (x) => `${x}: tape rolling over - dump.`,
  ];
  const list = prediction === "Pump" ? pump : dump;
  const i = hashToIndex(challengeId || sym, list.length);
  return list[i](sym.slice(0, 12));
}

/**
 * @param {number | null | undefined} x
 * @param {number} digits
 */
function pctStr(x, digits = 1) {
  if (x == null || !Number.isFinite(x)) return "?";
  return `${(x * 100).toFixed(digits)}%`;
}

/**
 * Arena S2: Dump ante is higher — stay selective on Dump, but use rich context like top agents.
 *
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
 *   modelName?: string;
 *   modelProvider?: string;
 *   frameworkName?: string;
 *   frameworkTags?: string[];
 *   learnedAdjustments?: import('./learnFromSubmissions.js').LearnedAdjustments | null;
 *   narrativeContext?: import('./narrativeContext.js').NarrativeContext | null;
 * }} input
 * @returns {ArenaSubmitPayload}
 */
export function buildPumpDumpDecision(input) {
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
    modelName = "syra-arena-worker",
    modelProvider = "syra",
    frameworkName = "syra-market-context",
    frameworkTags = ["syra", "arena-s2", "market-context", "engine-v2"],
    learnedAdjustments = null,
    narrativeContext = null,
  } = input;

  const narr = narrativeContext;
  const narrW = Math.min(
    0.35,
    Math.max(0, Number.parseFloat(process.env.ARENA_NARRATIVE_WEIGHT || "0.15") || 0.15)
  );
  const narrScore =
    narr?.ok && narr.resultCount > 0 && Number.isFinite(narr.narrativeScore) ? narr.narrativeScore : 0;

  const mom = dexMomentumScore(pair);
  const near = dexNearTermScore(pair);
  const flow = dexBuyPressure(pair);
  const volTrend = volumeTrendScore(pair);
  const horizonDiv = dexShortVsLongDivergence(pair);
  const rug = rugcheckDumpBias(rugReport);
  const liq = liquidityUsd(pair);
  const ageMin = pairAgeMinutes(pair);

  const hs = marketContext?.holderSkewScore ?? 0;
  const top10 = marketContext?.top10HolderPct;
  const top1 = marketContext?.top1HolderPct;

  const tapeBase = 0.3 * near + 0.24 * mom + 0.2 * flow + 0.13 * volTrend + 0.08 * horizonDiv;
  const tape = tapeBase + 0.12 * hs;

  const rugScale = tape > 0.06 ? 0.25 : tape > 0.02 ? 0.55 : 1;
  let composite = pair ? tape + rug * rugScale : 0.008;

  const shortExtended = near > 0.22 && horizonDiv < -0.12;
  if (shortExtended) composite -= 0.014 + 0.02 * Math.min(1, -horizonDiv);
  if (horizonDiv < -0.18) {
    composite -= 0.055 * Math.tanh(Math.min(2.8, (-horizonDiv - 0.18) * 2.2));
  }

  const la = learnedAdjustments;
  const bias = la?.compositeBias ?? 0;
  composite += bias;
  composite += narrW * narrScore;

  const TH_PUMP = 0.026 + (la?.thPumpDelta ?? 0);
  const TH_DUMP = 0.056 + (la?.thDumpDelta ?? 0);

  if (horizonDiv < -0.36 && near > 0.24) {
    composite = Math.min(composite, TH_PUMP - 0.008);
  }

  /** @type {'Pump' | 'Dump'} */
  let prediction;
  const pumpExhaustion =
    (shortExtended && composite < TH_PUMP + 0.032) ||
    (horizonDiv < -0.28 && near > 0.18 && composite < TH_PUMP + 0.045);
  if (composite > TH_PUMP && !pumpExhaustion) {
    prediction = "Pump";
  } else if (composite < -TH_DUMP) {
    prediction = "Dump";
  } else {
    const heavyBags = top10 != null && top10 > 0.42;
    const whaleTop1 = top1 != null && top1 > 0.14;

    const momOkForBull = horizonDiv > -0.16;
    const bearishSignals = [
      near < -0.04,
      mom < -0.04,
      flow < -0.14,
      volTrend < -0.05,
      horizonDiv < -0.1,
      near > 0.18 && horizonDiv < -0.22,
      narrScore < -0.22,
      heavyBags,
      whaleTop1 && flow < 0.05,
    ].filter(Boolean).length;
    const bullishSignals = [
      near > 0.04 && momOkForBull,
      mom > 0.035 && momOkForBull,
      flow > 0.12 && momOkForBull,
      volTrend > 0.04 && momOkForBull,
      top10 != null && top10 < 0.18 && near >= -0.02,
      horizonDiv > 0.06,
      narrScore > 0.22,
    ].filter(Boolean).length;

    if (bearishSignals >= 3 && tape < -0.008) {
      prediction = "Dump";
    } else if (bearishSignals >= 2 && tape < -0.028 && composite < -0.014) {
      prediction = "Dump";
    } else if (bullishSignals >= 3) {
      prediction = "Pump";
    } else if (bullishSignals >= 2 && bearishSignals <= 1 && composite > -0.008) {
      prediction = "Pump";
    } else if (bearishSignals > bullishSignals && tape < 0.01) {
      prediction = "Dump";
    } else if (shortExtended || horizonDiv < -0.08) {
      prediction = "Dump";
    } else {
      prediction = composite > 0.004 ? "Pump" : "Dump";
    }
  }

  const absTape = Math.abs(tape);
  let confidence = 0.4 + 0.28 * Math.min(1, absTape * 1.45);
  if (prediction === "Dump") {
    confidence *= 0.92;
    if (composite > -TH_DUMP) confidence = Math.min(confidence, 0.54);
    if (top10 != null && top10 > 0.38) confidence = Math.min(0.88, confidence + 0.05);
  }
  if (prediction === "Pump") {
    if (top10 != null && top10 < 0.2 && tape > 0.025) {
      confidence = Math.min(0.82, confidence + 0.03);
    }
    if (top10 != null && top10 > 0.32) confidence -= 0.06;
    if (shortExtended || horizonDiv < -0.1) confidence -= 0.08;
    if (near > 0.25 && mom < 0.08) confidence -= 0.05;
    const pumpStrong = tape > 0.05 && flow > 0.1 && composite > TH_PUMP + 0.012;
    confidence = Math.min(pumpStrong ? 0.82 : 0.7, confidence);
  }
  if (liq > 0 && liq < 8_000) confidence -= 0.05;
  if (liq > 0 && liq < 15_000) confidence -= 0.02;
  if (liq > 80_000) confidence += 0.02;
  if (!pair) confidence = Math.min(confidence, 0.48);
  if (ageMin != null && ageMin < 12) confidence -= 0.05;
  if (ageMin != null && ageMin > 6 * 60) confidence += 0.02;
  const confScale = la?.confidenceScale ?? 1;
  confidence *= confScale;
  if (narrScore > 0.32) confidence = Math.min(0.86, confidence + 0.04);
  if (narrScore < -0.32) confidence = Math.max(0.34, confidence - 0.04);
  confidence = Math.min(0.86, Math.max(0.34, Math.round(confidence * 100) / 100));

  const sym = String(tokenSymbol).slice(0, 12);
  const chatMessage = pickChatMessage(prediction, sym, challengeId || contractAddress);

  const ageNote =
    ageMin != null ? `Pair age ~${Math.round(ageMin)}m.` : "Pair age unknown.";
  const relNote =
    typeof priceAtRelease === "number" && Number.isFinite(priceAtRelease)
      ? `Arena rel ${priceAtRelease.toFixed(0)}.`
      : "";
  const holdNote =
    marketContext?.rpcOk && top10 != null
      ? `top10 ${pctStr(top10)} top1 ${pctStr(top1)}.`
      : marketContext?.rpcError
        ? `RPC holders skipped (${String(marketContext.rpcError).slice(0, 80)}).`
        : "RPC holders off (set ARENA_SOLANA_RPC_URL).";

  const arenaScore = (1 + Math.tanh(composite * 3)) / 2;

  const learnNote =
    bias !== 0 || (la?.thPumpDelta ?? 0) > 0 || (la?.thDumpDelta ?? 0) > 0 || confScale !== 1
      ? ` learn n=${la?.sampleSize ?? 0} b${bias >= 0 ? "+" : ""}${bias.toFixed(3)} dP${(la?.thPumpDelta ?? 0).toFixed(3)} dD${(la?.thDumpDelta ?? 0).toFixed(3)} cs${confScale.toFixed(2)}`
      : "";

  const narrNote =
    narr?.ok && narr.resultCount > 0
      ? ` narr ${narrScore >= 0 ? "+" : ""}${narrScore.toFixed(2)} exa=${narr.resultCount}`
      : narr?.error && narr.error !== "disabled" && narr.error !== "no EXA_API_KEY"
        ? ` narr_off:${String(narr.error).slice(0, 40)}`
        : "";

  const reasoningParts = [
    `${prediction} syra_score ${arenaScore.toFixed(3)} tape ${tape.toFixed(3)} comp ${composite.toFixed(3)} | near ${near.toFixed(2)} mom ${mom.toFixed(2)} hdiv ${horizonDiv.toFixed(2)} flow ${flow.toFixed(2)} vol ${volTrend.toFixed(2)} rug ${rug.toFixed(2)} hskew ${hs.toFixed(2)}.${learnNote}${narrNote}`,
    pair ? `Liq ~$${Math.round(liq)}. ${ageNote}` : "No Dex pair.",
    `${holdNote} ${relNote}`.trim(),
    tokenName ? String(tokenName).slice(0, 32) : "",
  ];
  let reasoning = reasoningParts.filter(Boolean).join(" ");
  if (reasoning.length > 500) reasoning = reasoning.slice(0, 497) + "...";

  const signalsUsed = [
    "short_term_momentum",
    "flow_imbalance",
    "volume_impulse_trend",
    "dex_multi_horizon_blend",
    "short_vs_long_horizon_divergence",
    "rugcheck_damped_by_tape",
    "top_holder_concentration",
    "holder_breadth_proxy",
    ...(narr?.ok && narr.resultCount > 0 ? ["exa_narrative_trend"] : []),
  ];

  const dataSources = ["dexscreener_latest_dex_tokens", "rugcheck_token_report"];
  if (marketContext?.rpcOk) dataSources.push("solana_rpc_token_largest");
  if (narr?.ok && narr.resultCount > 0) dataSources.push("exa_ai_web_search_highlights");

  /** @type {Array<{ tool: string; latencyMs: number; success: boolean }>} */
  const toolCalls = [
    {
      tool: "market-context",
      latencyMs: Math.max(1, Math.min(decisionTimeMs, 120_000)),
      success: true,
    },
  ];
  if (narr) {
    toolCalls.push({
      tool: "exa_narrative_search",
      latencyMs: Math.max(1, narr.latencyMs),
      success: narr.ok,
    });
  }

  const outTags = [
    ...frameworkTags,
    ...(narr?.ok && narr.resultCount > 0 ? ["narrative-exa"] : []),
  ];

  return {
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
    frameworkTags: outTags.slice(0, 10),
    decisionTimeMs,
  };
}
