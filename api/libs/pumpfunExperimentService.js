import PumpfunExperimentState from "../models/PumpfunExperimentState.js";
import {
  createInitialPumpfunLedger,
  normalizePumpfunLedger,
} from "./pumpfunExperimentLedger.js";

const SINGLETON_ID = "singleton";

export async function getPumpfunExperimentLedger() {
  const doc = await PumpfunExperimentState.findById(SINGLETON_ID).lean();
  if (!doc?.ledger) {
    const ledger = createInitialPumpfunLedger();
    await PumpfunExperimentState.findByIdAndUpdate(
      SINGLETON_ID,
      { ledger, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return ledger;
  }
  return normalizePumpfunLedger(doc.ledger);
}

export async function savePumpfunExperimentLedger(ledger) {
  const normalized = normalizePumpfunLedger(ledger);
  await PumpfunExperimentState.findByIdAndUpdate(
    SINGLETON_ID,
    { ledger: normalized, updatedAt: new Date() },
    { upsert: true, new: true },
  );
  return normalized;
}

export async function resetPumpfunExperimentLedger() {
  const ledger = createInitialPumpfunLedger();
  await PumpfunExperimentState.findByIdAndUpdate(
    SINGLETON_ID,
    { ledger, updatedAt: new Date() },
    { upsert: true, new: true },
  );
  return ledger;
}
