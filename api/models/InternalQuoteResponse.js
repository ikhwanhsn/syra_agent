/**
 * Syra quote-tweet / reply responses generated from external X posts.
 */
import mongoose from "mongoose";

const internalQuoteResponseSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    sourcePostHash: { type: String, required: true, index: true },
    sourcePost: { type: String, required: true },
    text: { type: String, required: true },
    tone: { type: String, default: "", index: true },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalQuoteResponseSchema.index({ createdAt: -1 });
internalQuoteResponseSchema.index({ sourcePostHash: 1, createdAt: -1 });

const InternalQuoteResponse =
  mongoose.models.InternalQuoteResponse ||
  mongoose.model("InternalQuoteResponse", internalQuoteResponseSchema);

export default InternalQuoteResponse;
