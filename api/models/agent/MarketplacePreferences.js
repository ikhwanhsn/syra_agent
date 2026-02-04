import mongoose from 'mongoose';

const recentItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    prompt: { type: String, required: true },
  },
  { _id: false }
);

const marketplacePreferencesSchema = new mongoose.Schema(
  {
    /** Same as AgentWallet: anonymous user id (or wallet:xxx when connected) */
    anonymousId: { type: String, required: true, unique: true },
    /** Prompt IDs the user has favorited */
    favorites: { type: [String], default: [] },
    /** Recently used prompts (newest first), max 10 */
    recent: { type: [recentItemSchema], default: [] },
    /** Prompt id -> use count */
    callCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const MarketplacePreferences = mongoose.model('MarketplacePreferences', marketplacePreferencesSchema);
export default MarketplacePreferences;
