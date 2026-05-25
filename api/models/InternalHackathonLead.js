/**
 * Hackathon leads discovered by Syra Hackathon Scout (X search + LLM extract).
 */
import mongoose from "mongoose";
import { HACKATHON_SCOUT_STATUSES } from "../config/syraHackathonScoutConfig.js";

const internalHackathonLeadSchema = new mongoose.Schema(
  {
    /** X tweet id — dedupe key */
    tweetId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: [...HACKATHON_SCOUT_STATUSES],
      default: "new",
      index: true,
    },
    title: { type: String, required: true },
    organizer: { type: String, default: "" },
    description: { type: String, default: "" },
    relevanceScore: { type: Number, default: 0 },
    relevanceReason: { type: String, default: "" },
    tags: { type: [String], default: [] },
    deadline: { type: String, default: null },
    prizePool: { type: String, default: null },
    applicationUrl: { type: String, default: null },
    tweetUrl: { type: String, required: true },
    tweetText: { type: String, default: "" },
    authorHandle: { type: String, default: "" },
    sourceQuery: { type: String, default: "" },
    notes: { type: String, default: "" },
    discoveredAt: { type: Date, default: Date.now, index: true },
    statusUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

internalHackathonLeadSchema.index({ status: 1, discoveredAt: -1 });

const InternalHackathonLead = mongoose.model("InternalHackathonLead", internalHackathonLeadSchema);
export default InternalHackathonLead;
