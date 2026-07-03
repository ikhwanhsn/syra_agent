import mongoose from "mongoose";
import { ttlExpireSeconds } from "../../utils/mongoTtl.js";

const embeddingReferenceSchema = new mongoose.Schema(
  {
    macroEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3MacroEvent", required: true, index: true },
    provider: { type: String, default: "openai" },
    model: { type: String, default: null },
    vectorId: { type: String, default: null },
    dimensions: { type: Number, default: null },
    store: { type: String, enum: ["qdrant", "mongo", "none"], default: "none" },
    status: { type: String, enum: ["pending", "stored", "failed", "unavailable"], default: "pending" },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true, collection: "btc3_embedding_refs" },
);

embeddingReferenceSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds("BTC3_EMBEDDING_REF_TTL_DAYS", 60) },
);

const Btc3EmbeddingReference =
  mongoose.models.Btc3EmbeddingReference ||
  mongoose.model("Btc3EmbeddingReference", embeddingReferenceSchema);

export default Btc3EmbeddingReference;
