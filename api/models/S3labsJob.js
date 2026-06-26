/**
 * S3Labs Jobs Bot — scraped job listings with stable identity dedupe.
 */
import mongoose from "mongoose";

const JOB_CATEGORIES = Object.freeze(["web3", "crypto", "tech"]);

const s3labsJobSchema = new mongoose.Schema(
  {
    jobIdentityKey: { type: String, required: true, unique: true, index: true },
    dedupeKey: { type: String, required: true, index: true },
    externalId: { type: String, default: "" },
    title: { type: String, required: true },
    company: { type: String, default: "" },
    location: { type: String, default: "" },
    remote: { type: Boolean, default: false },
    salaryLabel: { type: String, default: "" },
    salaryScore: { type: Number, default: 0, index: true },
    url: { type: String, required: true },
    source: { type: String, default: "" },
    sourceId: { type: String, default: "" },
    category: { type: String, enum: [...JOB_CATEGORIES], default: "tech", index: true },
    description: { type: String, default: "" },
    publishedAt: { type: Date, default: null },
    postedToTelegram: { type: Boolean, default: false, index: true },
    postedAt: { type: Date, default: null },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

s3labsJobSchema.index({ category: 1, lastSeenAt: -1 });
s3labsJobSchema.index({ salaryScore: -1 });

const S3labsJob = mongoose.models.S3labsJob || mongoose.model("S3labsJob", s3labsJobSchema);
export default S3labsJob;
export { JOB_CATEGORIES };
