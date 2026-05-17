import RiseExperimentState from "../models/RiseExperimentState.js";
import { createInitialRiseLedger, normalizeRiseLedger } from "./riseExperimentLedger.js";

const SINGLETON_ID = "singleton";

export async function getRiseExperimentLedger() {
  const doc = await RiseExperimentState.findById(SINGLETON_ID).lean();
  if (!doc?.ledger) {
    const ledger = createInitialRiseLedger();
    await RiseExperimentState.findByIdAndUpdate(
      SINGLETON_ID,
      { ledger, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return ledger;
  }
  return normalizeRiseLedger(doc.ledger);
}

export async function saveRiseExperimentLedger(ledger) {
  const normalized = normalizeRiseLedger(ledger);
  await RiseExperimentState.findByIdAndUpdate(
    SINGLETON_ID,
    { ledger: normalized, updatedAt: new Date() },
    { upsert: true, new: true },
  );
  return normalized;
}

export async function resetRiseExperimentLedger() {
  const ledger = createInitialRiseLedger();
  await RiseExperimentState.findByIdAndUpdate(
    SINGLETON_ID,
    { ledger, updatedAt: new Date() },
    { upsert: true, new: true },
  );
  return ledger;
}
