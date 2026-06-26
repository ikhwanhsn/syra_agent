/**
 * Onchain Recorder — interface for storing allocation decisions on Solana.
 */

import { decisionRepo } from "../../repositories/btc3/index.js";

/** @type {Array<{ timestamp: Date; headlineHash: string; allocation: object; confidence: number; reasonHash: string; txSignature: string | null; status: string }>} */
const pendingRecords = [];

/**
 * @param {{
 *   decisionId: import('mongoose').Types.ObjectId;
 *   headlineHash: string;
 *   allocation: { btcPct: number; usdcPct: number };
 *   confidence: number;
 *   reasonHash: string;
 * }} params
 */
export async function recordDecisionOnchain(params) {
  const record = {
    timestamp: new Date(),
    headlineHash: params.headlineHash,
    allocation: params.allocation,
    confidence: params.confidence,
    reasonHash: params.reasonHash,
    txSignature: null,
    status: "pending_onchain",
  };

  pendingRecords.push(record);

  // TODO: write Solana memo transaction via wallet broker
  // const txSignature = await executeMemoTransaction({ payload: record });

  await decisionRepo.findById(params.decisionId);

  return {
    ...record,
    status: "stored_offchain",
    message: "Onchain recording pending — Solana memo integration TODO",
  };
}

export function getPendingOnchainRecords() {
  return [...pendingRecords];
}

export async function confirmOnchainRecord(headlineHash, txSignature) {
  const idx = pendingRecords.findIndex((r) => r.headlineHash === headlineHash);
  if (idx >= 0) {
    pendingRecords[idx].txSignature = txSignature;
    pendingRecords[idx].status = "confirmed";
  }
  return pendingRecords[idx] ?? null;
}
