/** Paper-sim lanes — btc1 (/btc-experiment) and btc2 (/btc2-experiment) each get their own cohort balance. */
export const BTC_QUANT_LANES = Object.freeze({
  btc1: Object.freeze({
    lane: "btc1",
    stateId: "singleton",
    idPrefix: "btcq",
    title: "BTC quant lab",
  }),
  btc2: Object.freeze({
    lane: "btc2",
    stateId: "singleton-btc2",
    idPrefix: "btcq2",
    title: "BTC quant agent desk",
  }),
});

export const BTC_QUANT_LANE_IDS = Object.freeze(["btc1", "btc2"]);

/** @param {unknown} [lane] */
export function normalizeBtcQuantLane(lane) {
  const key = String(lane ?? "btc1")
    .trim()
    .toLowerCase();
  if (key === "btc2" || key === "2") return "btc2";
  return "btc1";
}

/** @param {unknown} [lane] */
export function getBtcQuantLaneDef(lane) {
  return BTC_QUANT_LANES[normalizeBtcQuantLane(lane)];
}
