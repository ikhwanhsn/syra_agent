import mongoose from "mongoose";

const delphiRealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    agentAddress: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    enabled: { type: Boolean, default: false, index: true },
    experimentId: { type: String, required: true, index: true },
    title: { type: String, default: "Delphi Real Agent" },
    startedAt: { type: Date, default: Date.now },
    maxPositionUsd: { type: Number, default: 50, min: 0 },
    maxPositionSol: { type: Number, default: 0.3, min: 0 },
    maxConcurrentPositions: { type: Number, default: 2, min: 1, max: 10 },
    currentStrategyId: { type: Number, default: null, min: 0, max: 99 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    closeAllRequested: { type: Boolean, default: false },
    depositsPaused: { type: Boolean, default: false },
  },
  { collection: "delphi_real_config", timestamps: true },
);

delphiRealConfigSchema.index({ enabled: 1, agentAddress: 1 });

delphiRealConfigSchema.pre("validate", function syncIdFromAddress() {
  if (this.agentAddress) this._id = this.agentAddress;
});

if (mongoose.models.DelphiRealConfig) {
  delete mongoose.models.DelphiRealConfig;
}

const DelphiRealConfig = mongoose.model("DelphiRealConfig", delphiRealConfigSchema);

export default DelphiRealConfig;
