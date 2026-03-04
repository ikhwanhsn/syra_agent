import mongoose from 'mongoose';

/**
 * Tracks 8004 agents created by users (by anonymousId) for "Your Agents" and enforce max per user.
 */
const user8004AgentSchema = new mongoose.Schema(
  {
    /** Same as AgentWallet.anonymousId; links to the user who created this agent */
    anonymousId: { type: String, required: true, index: true },
    /** 8004 agent asset (Solana mint base58) */
    asset: { type: String, required: true, unique: true },
    /** Name from registration (for display without fetching 8004 metadata) */
    name: { type: String, required: true },
    /** Description from registration */
    description: { type: String, required: false, default: '' },
    /** Image URL from registration (optional) */
    image: { type: String, required: false },
  },
  { timestamps: true }
);

user8004AgentSchema.index({ anonymousId: 1, createdAt: -1 });

const User8004Agent = mongoose.model('User8004Agent', user8004AgentSchema);
export default User8004Agent;

/** Max agents a user can create (per anonymousId). */
export const MAX_AGENTS_PER_USER = 3;
