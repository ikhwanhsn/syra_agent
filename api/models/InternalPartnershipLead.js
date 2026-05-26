/**
 * Partnership / integration leads discovered by Syra Partnership Scout.
 */
import mongoose from "mongoose";
import { PARTNERSHIP_SCOUT_STATUSES } from "../config/syraPartnershipScoutConfig.js";

const internalPartnershipLeadSchema = new mongoose.Schema(
  {
    /** Normalized name (+ optional link host) — dedupe key */
    dedupeKey: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ["target", "integration"], default: "target", index: true },
    status: {
      type: String,
      enum: [...PARTNERSHIP_SCOUT_STATUSES],
      default: "new",
      index: true,
    },
    name: { type: String, required: true },
    projectType: { type: String, default: "" },
    utility: { type: String, default: "" },
    whyFitForSyra: { type: String, default: "" },
    collaborationIdea: { type: String, default: "" },
    onchainSignals: { type: [String], default: [] },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    link: { type: String, default: null },
    /** Full text for kind=integration */
    integrationText: { type: String, default: "" },
    notes: { type: String, default: "" },
    discoveredAt: { type: Date, default: Date.now, index: true },
    statusUpdatedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

internalPartnershipLeadSchema.index({ kind: 1, status: 1, discoveredAt: -1 });

const InternalPartnershipLead = mongoose.model("InternalPartnershipLead", internalPartnershipLeadSchema);
export default InternalPartnershipLead;
