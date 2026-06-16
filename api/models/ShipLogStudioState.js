import mongoose from "mongoose";

const shipLogStudioStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    /** updateNumber (string key) → posted on X */
    postedOnX: { type: mongoose.Schema.Types.Mixed, default: {} },
    deletedUpdateNumbers: { type: [Number], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "ship_log_studio_state" },
);

const ShipLogStudioState =
  mongoose.models.ShipLogStudioState ||
  mongoose.model("ShipLogStudioState", shipLogStudioStateSchema);

export default ShipLogStudioState;
