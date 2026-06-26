import mongoose from "mongoose";

const entitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    normalizedName: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["person", "organization", "country", "asset", "macro_concept", "central_bank"],
      required: true,
    },
    aliases: { type: [String], default: [] },
    articleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Btc3Article" }],
    macroEventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Btc3MacroEvent" }],
    mentionCount: { type: Number, default: 1 },
  },
  { timestamps: true, collection: "btc3_entities" },
);

entitySchema.index({ normalizedName: 1, type: 1 }, { unique: true });

const Btc3Entity =
  mongoose.models.Btc3Entity || mongoose.model("Btc3Entity", entitySchema);

export default Btc3Entity;
