import mongoose from 'mongoose';

const VALID_CATEGORIES = ['live_data', 'research', 'trading', 'learning', 'tools', 'general'];

const userPromptSchema = new mongoose.Schema(
  {
    /** Creator: anonymousId (same as AgentWallet / MarketplacePreferences) */
    anonymousId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    prompt: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: VALID_CATEGORIES,
      default: 'general',
    },
    /** Number of times this prompt was used (by anyone, including creator) */
    useCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userPromptSchema.index({ anonymousId: 1, updatedAt: -1 });
userPromptSchema.index({ category: 1, useCount: -1 });
userPromptSchema.index({ updatedAt: -1 });

const UserPrompt = mongoose.model('UserPrompt', userPromptSchema);
export default UserPrompt;
export { VALID_CATEGORIES };
