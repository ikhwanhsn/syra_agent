import mongoose from "mongoose";

const tradingExperimentAgentStateSchema = new mongoose.Schema(
  {
    /** Lab ledger: primary | secondary | multi_resource */
    suite: { type: String, required: true, index: true },
    agentId: { type: Number, required: true, min: 0, max: 999 },
    /** Free USD not locked in open positions (each open run reserves full free cash as notional). */
    cashUsd: { type: Number, required: true, default: 1000 },
    startingBankUsd: { type: Number, required: true, default: 1000 },
  },
  { timestamps: true, collection: "trading_experiment_agent_states" },
);

tradingExperimentAgentStateSchema.index({ suite: 1, agentId: 1 }, { unique: true });

const TradingExperimentAgentState =
  mongoose.models.TradingExperimentAgentState ||
  mongoose.model("TradingExperimentAgentState", tradingExperimentAgentStateSchema);

export default TradingExperimentAgentState;
