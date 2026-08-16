import mongoose from "mongoose";

const sampleSchema = new mongoose.Schema(
  {
    t: { type: Date, required: true },
    priceUsd: { type: Number, required: true },
    source: { type: String, default: "jupiter" },
  },
  { _id: false },
);

const stocksPriceSnapshotSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true, index: true },
    mint: { type: String, default: null },
    nasdaqTicker: { type: String, default: null },
    samples: { type: [sampleSchema], default: [] },
    lastPriceUsd: { type: Number, default: null },
    lastSource: { type: String, default: null },
    lastLiquidityUsd: { type: Number, default: null },
    lastSpreadPct: { type: Number, default: null },
    lastPriceChange24h: { type: Number, default: null },
  },
  { timestamps: true, collection: "stocks_price_snapshots" },
);

const StocksPriceSnapshot =
  mongoose.models.StocksPriceSnapshot ||
  mongoose.model("StocksPriceSnapshot", stocksPriceSnapshotSchema);

export default StocksPriceSnapshot;
