import Btc3MacroAgentState from "../../models/btc3/MacroAgentState.js";
import { BTC3_DEFAULT_PORTFOLIO, BTC3_PAPER_SIM_DEFAULTS } from "../../config/btc3MacroConfig.js";

export const agentStateRepo = {
  async ensureSingleton() {
    let state = await Btc3MacroAgentState.findById("singleton");
    if (!state) {
      state = await Btc3MacroAgentState.create({
        _id: "singleton",
        simConfig: { ...BTC3_PAPER_SIM_DEFAULTS },
        portfolio: { ...BTC3_DEFAULT_PORTFOLIO },
        targetPortfolio: { btcPct: BTC3_DEFAULT_PORTFOLIO.btcPct, usdcPct: BTC3_DEFAULT_PORTFOLIO.usdcPct },
        currentRecommendation: { btcPct: BTC3_DEFAULT_PORTFOLIO.btcPct, usdcPct: BTC3_DEFAULT_PORTFOLIO.usdcPct },
      });
    }
    return state;
  },

  async getState() {
    return this.ensureSingleton();
  },

  async updateState(patch) {
    await this.ensureSingleton();
    return Btc3MacroAgentState.findByIdAndUpdate("singleton", { $set: patch }, { new: true }).lean();
  },

  async incrementCounters({ articles = 0, predictions = 0 } = {}) {
    await this.ensureSingleton();
    return Btc3MacroAgentState.findByIdAndUpdate(
      "singleton",
      {
        $inc: {
          articlesProcessed: articles,
          predictionsGenerated: predictions,
        },
      },
      { new: true },
    ).lean();
  },
};
