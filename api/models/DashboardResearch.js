/**
 * Stores the latest dashboard research result (single document, replace on each save).
 * Used by the internal dashboard: on load we fetch, on save we replace (delete old, insert new).
 */
import mongoose from 'mongoose';

const dashboardResearchSchema = new mongoose.Schema(
  {
    /** Fixed id so we only ever have one "latest" document. */
    id: { type: String, required: true, default: 'latest', unique: true },
    /** Full research payload from the dashboard (panels, customXSearch, deepResearch, browse, resume). */
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    /** ISO timestamp when this was saved. */
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

dashboardResearchSchema.index({ id: 1 });

const DashboardResearch = mongoose.model('DashboardResearch', dashboardResearchSchema);
export default DashboardResearch;
