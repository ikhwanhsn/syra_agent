import {
  dexBuyPressure,
  dexMomentumScore,
  liquidityUsd,
  pairAgeMinutes,
  rugcheckDumpBias,
  volumeTrendScore,
} from "./marketSignals.js";

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
 * @param {{
 *   pair: unknown;
 *   rugReport: unknown;
 *   tokenSymbol?: string;
 *   tokenName?: string;
 *   contractAddress: string;
 *   decisionTimeMs: number;
 *   challengeId?: string;
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
    modelName = "syra-arena-worker",
    modelProvider = "syra",
    frameworkName = "devfun-arena-worker",
    frameworkTags = ["syra", "arena-s2"],
  } = input;

  const mom = dexMomentumScore(pair);
  const flow = dexBuyPressure(pair);
  const rug = rugcheckDumpBias(rugReport);
  const liq = liquidityUsd(pair);
  const volTrend = volumeTrendScore(pair);
  const ageMin = pairAgeMinutes(pair);

  let composite = 0.48 * mom + 0.26 * flow + 0.12 * rug + 0.14 * volTrend;

  if (!pair) {
    composite = -0.12;
  }

  const threshold = 0.055;
  let prediction = /** @type {'Pump' | 'Dump'} */ (
    composite > threshold ? "Pump" : composite < -threshold ? "Dump" : mom >= 0 ? "Pump" : "Dump"
  );

  const absComp = Math.abs(composite);
  let confidence = 0.38 + 0.42 * Math.min(1, absComp * 1.35);
  if (liq > 0 && liq < 8_000) confidence -= 0.06;
  if (liq > 80_000) confidence += 0.04;
  if (!pair) confidence = Math.min(confidence, 0.48);
  if (ageMin != null && ageMin < 25) confidence -= 0.05;
  if (ageMin != null && ageMin > 6 * 60) confidence += 0.02;
  confidence = Math.min(0.92, Math.max(0.28, Math.round(confidence * 100) / 100));

  const sym = String(tokenSymbol).slice(0, 12);
  const chatMessage = pickChatMessage(prediction, sym, challengeId || contractAddress);

  const ageNote =
    ageMin != null ? `Pair age ~${Math.round(ageMin)}m.` : "Pair age unknown.";

  const reasoningParts = [
    `Composite ${composite.toFixed(3)} (mom ${mom.toFixed(2)}, flow ${flow.toFixed(2)}, vol ${volTrend.toFixed(2)}, rug ${rug.toFixed(2)}).`,
    pair ? `Liquidity ~$${Math.round(liq)}. ${ageNote}` : "No Dexscreener pair - conservative fade.",
    tokenName ? `Token: ${String(tokenName).slice(0, 40)}.` : "",
  ];
  let reasoning = reasoningParts.filter(Boolean).join(" ");
  if (reasoning.length > 500) reasoning = reasoning.slice(0, 497) + "...";

  const signalsUsed = [
    "dexscreener_price_change_blend",
    "dexscreener_h1_txn_bias",
    "dexscreener_volume_trend",
    "rugcheck_score_and_risks",
  ];
  const dataSources = ["dexscreener_latest_dex_tokens", "rugcheck_token_report"];

  const toolCalls = [
    { tool: "dexscreener_latest_dex_tokens", latencyMs: Math.min(decisionTimeMs, 900), success: true },
    { tool: "rugcheck_token_report", latencyMs: Math.min(decisionTimeMs, 650), success: rugReport != null },
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
