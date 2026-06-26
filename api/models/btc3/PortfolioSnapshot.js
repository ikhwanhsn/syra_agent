import mongoose from "mongoose";

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    btcPct: { type: Number, required: true },
    usdcPct: { type: Number, required: true },
    btcAmount: { type: Number, default: 0 },
    usdcAmount: { type: Number, default: 0 },
    totalUsd: { type: Number, default: 0 },
    btcPriceUsd: { type: Number, default: null },
    source: { type: String, default: "simulated" },
  },
  { timestamps: true, collection: "btc3_portfolio_snapshots" },
);

const Btc3PortfolioSnapshot =
  mongoose.models.Btc3PortfolioSnapshot ||
  mongoose.model("Btc3PortfolioSnapshot", portfolioSnapshotSchema);

export default Btc3PortfolioSnapshot;
