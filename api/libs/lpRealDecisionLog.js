import LpRealDecisionLog from "../models/LpRealDecisionLog.js";

/**
 * @param {object} entry
 */
export async function appendLpRealDecision(entry) {
  try {
    await LpRealDecisionLog.create({
      experimentId: entry.experimentId,
      agentAddress: entry.agentAddress ?? null,
      action: entry.action,
      poolAddress: entry.poolAddress ?? null,
      poolName: entry.poolName ?? null,
      positionId: entry.positionId ?? null,
      strategyId: entry.strategyId ?? null,
      summary: entry.summary,
      reason: entry.reason ?? null,
      keyRisks: Array.isArray(entry.keyRisks) ? entry.keyRisks : [],
      signals: entry.signals ?? null,
      metrics: entry.metrics ?? null,
    });
  } catch (err) {
    console.warn("[LP real] decision log write failed:", err instanceof Error ? err.message : err);
  }
}

/**
 * @param {{ experimentId?: string, limit?: number, agentAddress?: string }} [opts]
 */
export async function listLpRealDecisions({ experimentId, limit = 40, agentAddress } = {}) {
  const q = {};
  if (experimentId) q.experimentId = experimentId;
  if (agentAddress) q.agentAddress = agentAddress;
  const rows = await LpRealDecisionLog.find(q)
    .sort({ createdAt: -1 })
    .limit(Math.min(200, Math.max(1, limit)))
    .lean();
  return rows;
}
