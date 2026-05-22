/**
 * Anomaly incidents emitted by the anomaly detector (P2).
 *
 * Append-only. Ops triage by querying { resolved: false } and either resolve them or escalate
 * to a wallet freeze (AgentWallet.status = 'frozen').
 */
import mongoose from 'mongoose';

const walletIncidentSchema = new mongoose.Schema(
  {
    anonymousId: { type: String, required: true, index: true },
    kind: { type: String, enum: ['velocity', 'sum_spike', 'novel_destination', 'simulation_failed', 'cap_hit'], required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    evidence: { type: [String], default: [] },
    detectedAt: { type: Date, default: Date.now, index: true },
    resolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

const WalletIncident = mongoose.models.WalletIncident || mongoose.model('WalletIncident', walletIncidentSchema);
export default WalletIncident;
