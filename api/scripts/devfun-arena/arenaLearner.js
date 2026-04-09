/**
 * Online logistic learner: predicts probability market resolves "up" (weightedReturn > 0)
 * from arena feature vectors. Weights updated from settled challenges + stored features.
 */

import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(__dirname, "../../../.arena-learner-state.json");

/** @typedef {import('./arenaFeatureLog.js').ArenaFeatureVector} ArenaFeatureVector */

/**
 * @typedef {{
 *   version: number;
 *   bias: number;
 *   wTrendBoost: number;
 *   wTrendProfile: number;
 *   wMeta: number;
 *   wTape: number;
 *   wRug: number;
 *   wNarr: number;
 *   wFlow: number;
 *   wHorizonDiv: number;
 *   updates: number;
 * }} LearnerWeights
 */

export const FEATURE_KEYS = [
  "trendBoost",
  "trendProfile",
  "meta",
  "tape",
  "rug",
  "narr",
  "flow",
  "horizonDiv",
];

/**
 * @returns {LearnerWeights}
 */
export function defaultLearnerWeights() {
  return {
    version: 1,
    bias: 0.02,
    wTrendBoost: 0.55,
    wTrendProfile: 0.35,
    wMeta: 0.42,
    wTape: 0.18,
    wRug: -0.38,
    wNarr: 0.22,
    wFlow: 0.12,
    wHorizonDiv: 0.15,
    updates: 0,
  };
}

export function resolveLearnerStatePath() {
  return process.env.ARENA_LEARNER_STATE_PATH?.trim() || DEFAULT_PATH;
}

/**
 * @returns {Promise<LearnerWeights>}
 */
export async function loadLearnerState() {
  const p = resolveLearnerStatePath();
  try {
    const raw = await readFile(p, "utf8");
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return defaultLearnerWeights();
    const d = defaultLearnerWeights();
    for (const k of Object.keys(d)) {
      if (k === "version" || k === "updates") continue;
      const v = o[k];
      if (typeof v === "number" && Number.isFinite(v)) /** @type {Record<string, number>} */ (d)[k] = v;
    }
    if (typeof o.updates === "number") d.updates = o.updates;
    return d;
  } catch {
    return defaultLearnerWeights();
  }
}

/**
 * @param {LearnerWeights} w
 */
export async function saveLearnerState(w) {
  const p = resolveLearnerStatePath();
  await writeFile(p, `${JSON.stringify(w, null, 0)}\n`, "utf8");
}

/**
 * @param {ArenaFeatureVector} f
 * @param {LearnerWeights} w
 * @returns {number} logit before sigmoid
 */
export function marketUpLogit(f, w) {
  return (
    w.bias +
    w.wTrendBoost * f.trendBoost +
    w.wTrendProfile * f.trendProfile +
    w.wMeta * f.meta +
    w.wTape * f.tape +
    w.wRug * f.rug +
    w.wNarr * f.narr +
    w.wFlow * f.flow +
    w.wHorizonDiv * f.horizonDiv
  );
}

/**
 * @param {number} z
 */
function sigmoid(z) {
  if (z > 35) return 1;
  if (z < -35) return 0;
  return 1 / (1 + Math.exp(-z));
}

/**
 * P(resolved price up); used to tilt Pump vs Dump.
 * @param {ArenaFeatureVector} f
 * @param {LearnerWeights} w
 */
export function marketUpProbability(f, w) {
  return sigmoid(marketUpLogit(f, w));
}

/**
 * @param {LearnerWeights} w
 * @param {ArenaFeatureVector} f
 * @param {number} yUp 1 if weightedReturn > eps else 0
 * @param {number} lr
 */
export function sgdStepMarketDirection(w, f, yUp, lr) {
  const z = marketUpLogit(f, w);
  const p = sigmoid(z);
  const err = p - yUp;
  w.bias -= lr * err;
  w.wTrendBoost -= lr * err * f.trendBoost;
  w.wTrendProfile -= lr * err * f.trendProfile;
  w.wMeta -= lr * err * f.meta;
  w.wTape -= lr * err * f.tape;
  w.wRug -= lr * err * f.rug;
  w.wNarr -= lr * err * f.narr;
  w.wFlow -= lr * err * f.flow;
  w.wHorizonDiv -= lr * err * f.horizonDiv;
  w.updates += 1;
  clampWeights(w);
}

/**
 * @param {LearnerWeights} w
 */
function clampWeights(w) {
  const cap = 1.25;
  for (const key of Object.keys(w)) {
    if (key === "version" || key === "updates") continue;
    const v = /** @type {Record<string, number>} */ (w)[key];
    if (typeof v === "number") {
      /** @type {Record<string, number>} */ (w)[key] = Math.max(-cap, Math.min(cap, v));
    }
  }
}

const WR_EPS = 8e-7;

/**
 * @param {unknown} wrRaw
 */
function weightedReturnUp(wrRaw) {
  const wr = typeof wrRaw === "number" ? wrRaw : Number(wrRaw);
  if (!Number.isFinite(wr)) return null;
  return wr > WR_EPS ? 1 : 0;
}

/**
 * @param {unknown[]} submissionRows from Arena API
 * @param {import('./arenaFeatureLog.js').FeatureLogFile} log
 * @param {LearnerWeights} w
 * @param {number} maxSteps
 */
export function trainLearnerFromSubmissions(submissionRows, log, w, maxSteps = 80) {
  const lrBase =
    Math.min(0.14, Math.max(0.02, Number.parseFloat(process.env.ARENA_LEARNER_LR || "0.06") || 0.06));
  let steps = 0;
  for (const row of submissionRows) {
    if (steps >= maxSteps) break;
    const rec = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
    const ch = rec.challenge && typeof rec.challenge === "object" ? /** @type {Record<string, unknown>} */ (rec.challenge) : null;
    const st = String(ch?.status ?? "").toLowerCase();
    if (!ch || !["closed", "settled", "resolved"].includes(st)) continue;
    const cid = typeof ch.id === "string" ? ch.id : "";
    if (!cid) continue;
    const f = log.byId[cid]?.f;
    if (!f) continue;
    const res = ch.result && typeof ch.result === "object" ? /** @type {Record<string, unknown>} */ (ch.result) : null;
    const y = weightedReturnUp(res?.weightedReturn);
    if (y === null) continue;
    const lr = lrBase / (1 + w.updates * 0.001);
    sgdStepMarketDirection(w, f, y, lr);
    steps += 1;
  }
}
