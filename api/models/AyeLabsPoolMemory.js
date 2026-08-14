import mongoose from "mongoose";

/**
 * Per-pool memory for the AyeLabs desk. Tracks win/loss history so the signal cycle can
 * de-prioritize pools that keep losing and honor cooldowns after a bad close.
 */
const ayelabsPoolMemorySchema = new mongoose.Schema(
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
  { timestamps: true, collection: "ayelabs_pool_memory" },
);

const AyeLabsPoolMemory =
  mongoose.models.AyeLabsPoolMemory ||
  mongoose.model("AyeLabsPoolMemory", ayelabsPoolMemorySchema);

export default AyeLabsPoolMemory;
