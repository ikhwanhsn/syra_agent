import mongoose from "mongoose";

/**
 * Per-pool memory for the Meridian desk. Tracks win/loss history so the signal cycle can
 * de-prioritize pools that keep losing and honor cooldowns after a bad close.
 */
const meridianPoolMemorySchema = new mongoose.Schema(
  {
    poolAddress: { type: String, required: true, unique: true, index: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    sumPnlSol: { type: Number, default: 0 },
    /** "win" | "loss" | "expired" — outcome of the most recent close. */
    lastOutcome: { type: String, default: null },
    /** Skip new opens on this pool until this time (set after a loss). */
    cooldownUntil: { type: Date, default: null },
    notes: { type: [String], default: [] },
  },
  { timestamps: true, collection: "meridian_pool_memory" },
);

const MeridianPoolMemory =
  mongoose.models.MeridianPoolMemory ||
  mongoose.model("MeridianPoolMemory", meridianPoolMemorySchema);

export default MeridianPoolMemory;
