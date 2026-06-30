import BtcQuantStrategyOverride from "../models/BtcQuantStrategyOverride.js";
import { BTC_QUANT_STRATEGIES } from "../config/tradingExperimentStrategies.js";
import { getBtcQuantLaneDef } from "../config/btcQuantLanes.js";

/**
 * @param {Record<string, unknown>} base
 * @param {import("mongoose").LeanDocument<unknown> | null | undefined} o
 */
function mergeBaseWithOverride(base, o) {
  if (!o) return { ...base };
  return {
    ...base,
    name: typeof o.name === "string" ? o.name : base.name,
    signalGate:
      o.signalGate != null && typeof o.signalGate === "object"
        ? JSON.parse(JSON.stringify(o.signalGate))
        : base.signalGate,
    exit:
      o.exit != null && typeof o.exit === "object"
        ? JSON.parse(JSON.stringify(o.exit))
        : base.exit,
    notes: typeof o.notes === "string" ? o.notes : base.notes,
  };
}

/**
 * @param {unknown} lane
 * @returns {Promise<object[]>}
 */
export async function resolveBtcQuantStrategies(lane = "btc1") {
  const laneDef = getBtcQuantLaneDef(lane);
  /** @type {import("mongoose").LeanDocument<unknown>[]} */
  let overrides = [];
  try {
    overrides = await BtcQuantStrategyOverride.find({ lane: laneDef.lane }).lean();
  } catch {
    return BTC_QUANT_STRATEGIES.map((b) => ({ ...b }));
  }
  const map = new Map(overrides.map((row) => [row.strategyId, row]));
  return BTC_QUANT_STRATEGIES.map((b) => mergeBaseWithOverride({ ...b }, map.get(b.id)));
}

/**
 * @param {unknown} lane
 * @param {number} strategyId
 * @returns {Promise<object | null>}
 */
export async function resolveBtcQuantStrategyById(lane, strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  const list = await resolveBtcQuantStrategies(lane);
  return list.find((s) => s.id === id) ?? null;
}
