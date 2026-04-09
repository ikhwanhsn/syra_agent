import { listSubmissions } from "./arenaApi.js";

/**
 * @typedef {{
 *   thPumpDelta: number;
 *   thDumpDelta: number;
 *   compositeBias: number;
 *   confidenceScale: number;
 *   sampleSize: number;
 *   directionalPump: { n: number; wins: number };
 *   directionalDump: { n: number; wins: number };
 *   meanScorePump: number | null;
 *   meanScoreDump: number | null;
 * }} LearnedAdjustments
 */

const WR_EPS = 8e-7;

/**
 * @param {string | undefined} pred
 * @param {unknown} wrRaw
 * @returns {boolean | null} null = skip (neutral move or missing data)
 */
function directionalWin(pred, wrRaw) {
  if (pred !== "Pump" && pred !== "Dump") return null;
  const wr = typeof wrRaw === "number" ? wrRaw : Number(wrRaw);
  if (!Number.isFinite(wr)) return null;
  if (Math.abs(wr) < WR_EPS) return null;
  if (pred === "Pump") return wr > WR_EPS;
  return wr < -WR_EPS;
}

/**
 * @param {string} apiKey
 * @param {string} competitionId
 * @param {number} maxRows
 */
export async function fetchSubmissionHistory(apiKey, competitionId, maxRows) {
  const cap = Math.min(500, Math.max(20, Math.floor(maxRows)));
  /** @type {unknown[]} */
  const rows = [];
  for (let off = 0; rows.length < cap; off += 100) {
    const body = await listSubmissions(apiKey, 100, competitionId, off);
    const chunk = body?.data;
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    for (const r of chunk) rows.push(r);
    if (chunk.length < 100) break;
  }
  return rows.slice(0, cap);
}

/**
 * Derive bounded threshold/bias adjustments from settled Pump/Dump submissions.
 * Uses directional match vs `challenge.result.weightedReturn` and mean scores by side.
 *
 * @param {unknown[]} rows
 * @returns {LearnedAdjustments}
 */
export function computeLearnedAdjustments(rows) {
  /** @type {LearnedAdjustments} */
  const empty = {
    thPumpDelta: 0,
    thDumpDelta: 0,
    compositeBias: 0,
    confidenceScale: 1,
    sampleSize: 0,
    directionalPump: { n: 0, wins: 0 },
    directionalDump: { n: 0, wins: 0 },
    meanScorePump: null,
    meanScoreDump: null,
  };

  if (!Array.isArray(rows) || rows.length === 0) return empty;

  let pumpN = 0;
  let pumpW = 0;
  let dumpN = 0;
  let dumpW = 0;
  let scorePumpSum = 0;
  let scorePumpC = 0;
  let scoreDumpSum = 0;
  let scoreDumpC = 0;
  let dumpHeavyLosses = 0;
  let pumpHeavyLosses = 0;
  let pumpHighConfWrong = 0;
  /** Confidence buckets for calibration: high = >= 0.58 */
  let highN = 0;
  let highW = 0;
  let lowN = 0;
  let lowW = 0;

  for (const row of rows) {
    const rec = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
    const ch = rec.challenge && typeof rec.challenge === "object" ? /** @type {Record<string, unknown>} */ (rec.challenge) : null;
    const st = String(ch?.status ?? "").toLowerCase();
    if (!ch || !["closed", "settled", "resolved"].includes(st)) continue;

    const res = ch.result && typeof ch.result === "object" ? /** @type {Record<string, unknown>} */ (ch.result) : null;
    const wr = res?.weightedReturn;
    const data = rec.data && typeof rec.data === "object" ? /** @type {Record<string, unknown>} */ (rec.data) : null;
    const pred = typeof data?.prediction === "string" ? data.prediction : "";
    const dw = directionalWin(pred, wr);
    if (dw === null) continue;

    const sc = typeof rec.score === "number" ? rec.score : Number(rec.score);
    const confRaw = typeof data?.confidence === "number" ? data.confidence : Number(data?.confidence);
    const conf = Number.isFinite(confRaw) ? confRaw : null;

    if (pred === "Pump") {
      pumpN += 1;
      if (dw) pumpW += 1;
      if (conf != null && conf >= 0.68 && dw === false) pumpHighConfWrong += 1;
      if (Number.isFinite(sc)) {
        scorePumpSum += sc;
        scorePumpC += 1;
        if (sc < -8) pumpHeavyLosses += 1;
      }
    } else if (pred === "Dump") {
      dumpN += 1;
      if (dw) dumpW += 1;
      if (Number.isFinite(sc)) {
        scoreDumpSum += sc;
        scoreDumpC += 1;
        if (sc < -8) dumpHeavyLosses += 1;
      }
    } else continue;

    if (conf != null) {
      if (conf >= 0.58) {
        highN += 1;
        if (dw) highW += 1;
      } else {
        lowN += 1;
        if (dw) lowW += 1;
      }
    }
  }

  const sampleSize = pumpN + dumpN;
  const meanP = scorePumpC > 0 ? scorePumpSum / scorePumpC : null;
  const meanD = scoreDumpC > 0 ? scoreDumpSum / scoreDumpC : null;

  if (sampleSize < 4) {
    return {
      ...empty,
      sampleSize,
      directionalPump: { n: pumpN, wins: pumpW },
      directionalDump: { n: dumpN, wins: dumpW },
      meanScorePump: meanP,
      meanScoreDump: meanD,
    };
  }

  const wrPump = pumpN > 0 ? pumpW / pumpN : 0;
  const wrDump = dumpN > 0 ? dumpW / dumpN : 0;
  const gap = wrDump - wrPump;

  let thPumpDelta = 0;
  let thDumpDelta = 0;
  let compositeBias = 0;

  if (pumpN === 0 && dumpN >= 4 && dumpHeavyLosses >= 2) {
    const und = Math.min(0.14, 0.04 + dumpHeavyLosses * 0.022);
    thDumpDelta = Math.min(0.026, 0.01 + und);
    compositeBias = Math.min(0.02, 0.008 + und * 0.35);
  } else if (dumpN === 0 && pumpN >= 4 && pumpHeavyLosses >= 2) {
    const und = Math.min(0.14, 0.04 + pumpHeavyLosses * 0.022);
    thPumpDelta = Math.min(0.026, 0.01 + und);
    compositeBias = -Math.min(0.02, 0.008 + und * 0.35);
  } else if (pumpN >= 4 && pumpHeavyLosses >= 2 && dumpN >= 1) {
    const und = Math.min(0.12, 0.03 + pumpHeavyLosses * 0.02);
    thPumpDelta = Math.max(thPumpDelta, Math.min(0.026, 0.008 + und));
    compositeBias -= Math.min(0.016, 0.005 + und * 0.28);
  } else if (pumpN >= 3 && dumpN >= 3) {
    if (gap < -0.06) {
      const mag = Math.min(0.14, (-gap - 0.06) * 0.45);
      thDumpDelta = Math.min(0.024, 0.006 + mag);
      compositeBias = Math.min(0.018, 0.003 + mag * 0.35);
    } else if (gap > 0.06) {
      const mag = Math.min(0.14, (gap - 0.06) * 0.45);
      thPumpDelta = Math.min(0.024, 0.006 + mag);
      compositeBias = -Math.min(0.018, 0.003 + mag * 0.35);
    }
  }

  if (meanP != null && meanD != null && pumpN >= 2 && dumpN >= 2) {
    const scoreGap = meanP - meanD;
    if (scoreGap > 3) compositeBias += Math.min(0.008, (scoreGap - 3) * 0.0012);
    if (scoreGap < -3) compositeBias -= Math.min(0.008, (-scoreGap - 3) * 0.0012);
  }

  if (pumpN >= 4 && pumpHighConfWrong >= 2) {
    thPumpDelta = Math.max(thPumpDelta, Math.min(0.024, 0.006 + pumpHighConfWrong * 0.005));
    compositeBias -= Math.min(0.014, 0.004 + pumpHighConfWrong * 0.003);
  }

  compositeBias = Math.max(-0.028, Math.min(0.028, compositeBias));
  thPumpDelta = Math.max(0, Math.min(0.028, thPumpDelta));
  thDumpDelta = Math.max(0, Math.min(0.028, thDumpDelta));

  let confidenceScale = 1;
  if (highN >= 4 && lowN >= 4) {
    const hr = highW / highN;
    const lr = lowW / lowN;
    if (hr < lr - 0.07) confidenceScale = 0.92;
    else if (hr > lr + 0.07) confidenceScale = 1.04;
  }
  if (pumpHighConfWrong >= 3) confidenceScale = Math.min(confidenceScale, 0.88);
  else if (pumpHighConfWrong >= 2) confidenceScale = Math.min(confidenceScale, 0.91);
  confidenceScale = Math.max(0.86, Math.min(1.06, confidenceScale));

  return {
    thPumpDelta,
    thDumpDelta,
    compositeBias,
    confidenceScale,
    sampleSize,
    directionalPump: { n: pumpN, wins: pumpW },
    directionalDump: { n: dumpN, wins: dumpW },
    meanScorePump: meanP,
    meanScoreDump: meanD,
  };
}
