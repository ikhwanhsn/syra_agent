import mongoose from 'mongoose';

export const VALID_SKILL_CATEGORIES = [
  'live_data',
  'research',
  'trading',
  'learning',
  'tools',
  'general',
];

export const SKILL_STATUSES = Object.freeze(['draft', 'published']);

const skillSchema = new mongoose.Schema(
  {
    creatorAnonymousId: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: VALID_SKILL_CATEGORIES,
      default: 'general',
    },
    upstreamUrl: { type: String, required: true, trim: true },
    upstreamMethod: {
      type: String,
      enum: ['GET', 'POST'],
      default: 'GET',
    },
    /** Encrypted JSON object of upstream request headers (never store plaintext secrets). */
    upstreamHeadersEnc: { type: String, default: null },
    inputSchema: { type: mongoose.Schema.Types.Mixed, default: {} },
    outputSchema: { type: mongoose.Schema.Types.Mixed, default: {} },
    priceUsd: { type: Number, required: true, min: 0.001 },
    payToAddress: { type: String, default: null, index: true },
    payToChain: { type: String, enum: ['solana'], default: 'solana' },
    status: {
      type: String,
      enum: SKILL_STATUSES,
      default: 'draft',
      index: true,
    },
    useCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

skillSchema.index({ status: 1, useCount: -1, updatedAt: -1 });
skillSchema.index({ creatorAnonymousId: 1, updatedAt: -1 });

const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
