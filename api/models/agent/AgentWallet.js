/**
 * AgentWallet — per-user custodial wallet for Syra agent actions.
 *
 * v2 security upgrade (P0/P1):
 *   - `custody`:       'legacy' (encrypted key in `agentSecretKey`) or 'privy' (TEE-backed at Privy)
 *   - `privyWalletId`: Privy server wallet id when custody === 'privy'
 *   - `status`:        lifecycle gate enforced by walletBroker
 *   - Spend caps + allowlists:  consumed by the policy engine
 *
 * `agentSecretKey` remains for legacy rows; new wallets created with custody='privy' MUST have
 * `agentSecretKey` empty/null. The schema enforces this consistency at validation time.
 */
import mongoose from 'mongoose';

const agentWalletSchema = new mongoose.Schema(
  {
    /** Anonymous user id (stored in client localStorage); no wallet connect required. */
    anonymousId: { type: String, required: true, unique: true },
    /** Connected wallet public key (Solana base58 or EVM 0x); when set, agent wallet is linked to this user wallet. */
    walletAddress: { type: String, required: false },
    /** Chain for this agent wallet: "solana" | "base" | "bsc". One agent per chain per user. */
    chain: { type: String, required: false, default: 'solana', enum: ['solana', 'base', 'bsc'] },
    /** Agent wallet public key. */
    agentAddress: { type: String, required: true },

    /**
     * Custody backend for this wallet.
     *  - 'legacy': encrypted key stored in `agentSecretKey`. Pre-v2 wallets.
     *  - 'privy':  key custodied by Privy Server Wallets (TEE). `agentSecretKey` MUST be null.
     */
    custody: { type: String, enum: ['legacy', 'privy'], default: 'legacy' },
    /** Privy server-wallet identifier when custody === 'privy'. */
    privyWalletId: { type: String, default: null, sparse: true },

    /**
     * Lifecycle status. Broker refuses to sign for anything other than 'active'.
     *  - 'active':    normal operation
     *  - 'frozen':    manual freeze by ops (security incident)
     *  - 'migrating': sweep-to-Privy in progress
     *  - 'retired':   wallet superseded; no signing permitted ever
     */
    status: {
      type: String,
      enum: ['active', 'frozen', 'migrating', 'retired'],
      default: 'active',
      index: true,
    },

    /** Encrypted secret for legacy custody. enc:v1:... envelope. NEVER returned by any API. */
    agentSecretKey: { type: String, required: false, default: null, select: false },

    /** Policy caps (USD). */
    dailySpendCapUsd: { type: Number, default: 250 },
    hourlySpendCapUsd: { type: Number, default: 100 },
    perTxCapUsd: { type: Number, default: 50 },

    /** Tool / destination policy. Empty allowedTools => all known tools allowed (subject to caps). */
    allowedTools: { type: [String], default: [] },
    destinationAllowlist: { type: [String], default: [] },
    destinationDenylist: { type: [String], default: [] },

    /** Avatar URL. */
    avatarUrl: { type: String, required: false },

    /**
     * Wallet role: chat (default) pays for agent chat/tools; lp funds on-chain LP experiments.
     * Future agent types can add more enum values.
     */
    purpose: {
      type: String,
      enum: ['chat', 'lp'],
      default: 'chat',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// One agent wallet per (walletAddress + chain + purpose)
agentWalletSchema.index({ walletAddress: 1, chain: 1, purpose: 1 }, { unique: true, sparse: true });
agentWalletSchema.index({ custody: 1, status: 1 });

agentWalletSchema.pre('validate', function (next) {
  if (this.custody === 'privy') {
    if (!this.privyWalletId) {
      return next(new Error('AgentWallet: custody=privy requires privyWalletId'));
    }
    if (this.agentSecretKey) {
      // Never store a raw key when Privy is custodying — defensive double-write protection.
      return next(new Error('AgentWallet: custody=privy must not store agentSecretKey'));
    }
  }
  if (this.custody === 'legacy' && this.status !== 'retired' && !this.agentSecretKey) {
    // legacy active rows must have an encrypted secret — except retired
    return next(new Error('AgentWallet: custody=legacy requires agentSecretKey unless retired'));
  }
  next();
});

const AgentWallet = mongoose.models.AgentWallet || mongoose.model('AgentWallet', agentWalletSchema);
export default AgentWallet;
