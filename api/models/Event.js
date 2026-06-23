/**
 * Tech/crypto/web3 events with Luma registration links — aggregated by Event Scout.
 */
import mongoose from "mongoose";
import { EVENT_SOURCES, EVENT_STATUSES, EVENT_CATEGORIES } from "../config/eventScoutConfig.js";

const eventSchema = new mongoose.Schema(
  {
    source: { type: String, enum: [...EVENT_SOURCES], required: true, index: true },
    sourceId: { type: String, default: "" },
    dedupeKey: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: [...EVENT_STATUSES],
      default: "new",
      index: true,
    },
    title: { type: String, required: true },
    organizer: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, enum: [...EVENT_CATEGORIES], default: "tech", index: true },
    lumaUrl: { type: String, required: true },
    url: { type: String, default: null },
    location: { type: String, default: "" },
    locationType: { type: String, default: "" },
    isIndonesia: { type: Boolean, default: false, index: true },
    isOnline: { type: Boolean, default: false },
    startAt: { type: Date, default: null, index: true },
    endAt: { type: Date, default: null },
    dateText: { type: String, default: "" },
    themes: { type: [String], default: [] },
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

eventSchema.index({ status: 1, discoveredAt: -1 });
eventSchema.index({ isIndonesia: 1, discoveredAt: -1 });
eventSchema.index({ source: 1, discoveredAt: -1 });
eventSchema.index({ category: 1, discoveredAt: -1 });

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
export default Event;
