import {
  dexBuyPressure,
  dexMomentumScore,
  dexNearTermScore,
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
  } = input;

  const mom = dexMomentumScore(pair);
  const near = dexNearTermScore(pair);
  const flow = dexBuyPressure(pair);
  const volTrend = volumeTrendScore(pair);
  const rug = rugcheckDumpBias(rugReport);
  const liq = liquidityUsd(pair);
  const ageMin = pairAgeMinutes(pair);

  const hs = marketContext?.holderSkewScore ?? 0;
  const top10 = marketContext?.top10HolderPct;
  const top1 = marketContext?.top1HolderPct;

  const tapeBase = 0.32 * near + 0.26 * mom + 0.2 * flow + 0.14 * volTrend;
  const tape = tapeBase + 0.12 * hs;

  const rugScale = tape > 0.06 ? 0.25 : tape > 0.02 ? 0.55 : 1;
  let composite = pair ? tape + rug * rugScale : 0.012;

  const TH_PUMP = 0.016;
  const TH_DUMP = 0.052;

  /** @type {'Pump' | 'Dump'} */
  let prediction;
  if (composite > TH_PUMP) {
    prediction = "Pump";
  } else if (composite < -TH_DUMP) {
    prediction = "Dump";
  } else {
    const heavyBags = top10 != null && top10 > 0.42;
    const whaleTop1 = top1 != null && top1 > 0.14;

    const bearishSignals = [
      near < -0.04,
      mom < -0.04,
      flow < -0.14,
      volTrend < -0.05,
      heavyBags,
      whaleTop1 && flow < 0.05,
    ].filter(Boolean).length;
    const bullishSignals = [
      near > 0.03,
      mom > 0.025,
      flow > 0.1,
      volTrend > 0.03,
      top10 != null && top10 < 0.18 && near >= -0.02,
    ].filter(Boolean).length;

    if (bearishSignals >= 3 && tape < -0.012) {
      prediction = "Dump";
    } else if (bearishSignals >= 2 && tape < -0.032 && composite < -0.018) {
      prediction = "Dump";
    } else if (bullishSignals >= 2) {
      prediction = "Pump";
    } else {
      prediction = "Pump";
    }
  }

  const absTape = Math.abs(tape);
  let confidence = 0.42 + 0.36 * Math.min(1, absTape * 1.55);
  if (prediction === "Dump") {
    confidence *= 0.92;
    if (composite > -TH_DUMP) confidence = Math.min(confidence, 0.54);
    if (top10 != null && top10 > 0.38) confidence = Math.min(0.9, confidence + 0.06);
  }
  if (prediction === "Pump" && top10 != null && top10 < 0.2 && tape > 0.02) {
    confidence = Math.min(0.86, confidence + 0.03);
  }
  if (liq > 0 && liq < 8_000) confidence -= 0.04;
  if (liq > 80_000) confidence += 0.03;
  if (!pair) confidence = Math.min(confidence, 0.5);
  if (ageMin != null && ageMin < 12) confidence -= 0.04;
  if (ageMin != null && ageMin > 6 * 60) confidence += 0.02;
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

  const reasoningParts = [
    `${prediction} syra_score ${arenaScore.toFixed(3)} tape ${tape.toFixed(3)} comp ${composite.toFixed(3)} | near ${near.toFixed(2)} mom ${mom.toFixed(2)} flow ${flow.toFixed(2)} vol ${volTrend.toFixed(2)} rug ${rug.toFixed(2)} hskew ${hs.toFixed(2)}.`,
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
    "rugcheck_damped_by_tape",
    "top_holder_concentration",
    "holder_breadth_proxy",
  ];

  const dataSources = ["dexscreener_latest_dex_tokens", "rugcheck_token_report"];
  if (marketContext?.rpcOk) dataSources.push("solana_rpc_token_largest");

  const toolCalls = [
    {
      tool: "market-context",
      latencyMs: Math.max(1, Math.min(decisionTimeMs, 120_000)),
      success: true,
    },
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
    frameworkTags: frameworkTags.slice(0, 10),
    decisionTimeMs,
  };
}
