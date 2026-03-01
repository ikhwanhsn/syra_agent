import mongoose from 'mongoose';

const agentWalletSchema = new mongoose.Schema(
  {
    /** Anonymous user id (stored in client localStorage); no wallet connect required */
    anonymousId: { type: String, required: true, unique: true },
    /** Connected wallet public key (Solana base58 or EVM 0x); when set, agent wallet is linked to this user wallet */
    walletAddress: { type: String, required: false },
    /** Chain for this agent wallet: "solana" | "base". Enables one agent per chain per user. */
    chain: { type: String, required: false, default: 'solana', enum: ['solana', 'base'] },
    /** Agent wallet public key (Solana base58 or EVM 0x); user deposits here */
    agentAddress: { type: String, required: true },
    /** Agent wallet secret: Solana = base58, Base = hex private key */
    agentSecretKey: { type: String, required: true },
    /** User avatar URL generated when wallet is first created */
    avatarUrl: { type: String, required: false },
  },
  { timestamps: true }
);

// One agent wallet per (walletAddress + chain)
agentWalletSchema.index({ walletAddress: 1, chain: 1 }, { unique: true, sparse: true });

const AgentWallet = mongoose.model('AgentWallet', agentWalletSchema);
export default AgentWallet;
