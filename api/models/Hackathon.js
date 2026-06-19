/**
 * Technology hackathons aggregated by Hackathon Scout (Devpost + Exa).
 */
import mongoose from "mongoose";
import { HACKATHON_SOURCES, HACKATHON_STATUSES } from "../config/hackathonScoutConfig.js";

const hackathonSchema = new mongoose.Schema(
  {
    source: { type: String, enum: [...HACKATHON_SOURCES], required: true, index: true },
    sourceId: { type: String, default: "" },
    dedupeKey: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: [...HACKATHON_STATUSES],
      default: "new",
      index: true,
    },
    title: { type: String, required: true },
    organizer: { type: String, default: "" },
    description: { type: String, default: "" },
    url: { type: String, default: null },
    applicationUrl: { type: String, default: null },
    location: { type: String, default: "" },
    locationType: { type: String, default: "" },
    isIndonesia: { type: Boolean, default: false, index: true },
    themes: { type: [String], default: [] },
    prizePool: { type: String, default: null },
    prizeAmountUsd: { type: Number, default: null },
    submissionDates: { type: String, default: null },
    deadline: { type: String, default: null },
    openState: { type: String, default: "", index: true },
    registrationsCount: { type: Number, default: null },
    thumbnailUrl: { type: String, default: null },
    relevanceScore: { type: Number, default: 0 },
    relevanceReason: { type: String, default: "" },
    notes: { type: String, default: "" },
    discoveredAt: { type: Date, default: Date.now, index: true },
    statusUpdatedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

hackathonSchema.index({ status: 1, discoveredAt: -1 });
hackathonSchema.index({ isIndonesia: 1, discoveredAt: -1 });
hackathonSchema.index({ source: 1, discoveredAt: -1 });

const Hackathon = mongoose.models.Hackathon || mongoose.model("Hackathon", hackathonSchema);
export default Hackathon;
