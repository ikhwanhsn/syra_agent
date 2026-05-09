import mongoose from 'mongoose';

/**
 * One document per UTC calendar day — snapshot of terminal strip KPIs when
 * GET /uponly-rise-markets/aggregate runs, so all clients share the same baseline.
 */
const uponlyTerminalKpiDailySchema = new mongoose.Schema(
  {
    dayUtc: { type: String, required: true, unique: true, index: true },
    marketCount: { type: Number, required: true },
    volume24hUsd: { type: Number, required: true },
    marketCapUsd: { type: Number, required: true },
    alphaPicks: { type: Number, required: true },
    sampledCount: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const UponlyTerminalKpiDaily =
  mongoose.models.UponlyTerminalKpiDaily ||
  mongoose.model('UponlyTerminalKpiDaily', uponlyTerminalKpiDailySchema);

export default UponlyTerminalKpiDaily;
