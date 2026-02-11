import mongoose from 'mongoose';

const agentWalletSchema = new mongoose.Schema(
  {
    /** Anonymous user id (stored in client localStorage); no wallet connect required */
    anonymousId: { type: String, required: true, unique: true },
    /** Connected wallet public key (Solana); when set, agent wallet is linked to this user wallet */
    walletAddress: { type: String, required: false, unique: true, sparse: true },
    /** Agent wallet public key (user deposits here; backend pays x402 with this) */
    agentAddress: { type: String, required: true },
    /** Agent wallet secret key (base58) - stored in DB so backend can pay permissionlessly */
    agentSecretKey: { type: String, required: true },
    /** User avatar URL generated when wallet is first created */
    avatarUrl: { type: String, required: false },
  },
  { timestamps: true }
);

// Indexes are created automatically by unique: true on anonymousId and walletAddress

const AgentWallet = mongoose.model('AgentWallet', agentWalletSchema);
export default AgentWallet;
