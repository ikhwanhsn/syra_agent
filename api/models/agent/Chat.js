import mongoose from 'mongoose';
import crypto from 'crypto';

const toolUsageEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ['running', 'complete', 'error', 'skipped'], required: true },
    /** Listed / effective tool price in USD (for UI). */
    costUsd: { type: Number },
    /** When true, SYRA treasury covered this call (user not charged USDC). */
    included: { type: Boolean },
    /** Solana mint for optional in-chat price chart (pump.fun coin / SOL price tools). */
    chartMint: { type: String },
    /** CoinGecko coin id for chart (e.g. signal tool: bitcoin, solana). */
    chartCoinId: { type: String },
    chartSymbol: { type: String },
    chartName: { type: String },
    /** pump.fun create-coin: mint + tx for client links (pump.fun, Solscan, share). */
    pumpfunCreateMint: { type: String },
    pumpfunCreateSignature: { type: String },
    pumpfunCreateSymbol: { type: String },
    pumpfunCreateName: { type: String },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    toolUsage: {
      name: String,
      status: { type: String, enum: ['running', 'complete', 'error', 'skipped'] },
      costUsd: { type: Number },
      included: { type: Boolean },
    },
    /** Full tool list for an assistant turn (preferred over toolUsage when present). */
    toolUsages: { type: [toolUsageEntrySchema], default: undefined },
    /** Rich client UI hint (e.g. pump.fun launch form when create params were missing). */
    inlineUi: { type: mongoose.Schema.Types.Mixed, default: undefined },
    inlineUiDismissed: { type: Boolean, default: undefined },
    /** Inline Jupiter/pump swap card: user tapped Swap or Cancel — keep card, hide action buttons. */
    swapActionsHidden: { type: Boolean, default: undefined },
    swapInlineStatus: { type: String, enum: ['cancelled', 'submitted'], default: undefined },
  },
  { _id: false }
);

/** Generate a URL-safe unique share id (e.g. 16 chars). */
function generateShareId() {
  return crypto.randomBytes(12).toString('base64url');
}

const chatSchema = new mongoose.Schema(
  {
    /** Owner: anonymousId (wallet-scoped or localStorage id). Chats are listed/filtered by this. */
    anonymousId: { type: String, default: null },
    title: { type: String, default: 'New Chat' },
    preview: { type: String, default: '' },
    agentId: { type: String, default: '' },
    systemPrompt: { type: String, default: '' },
    /** OpenRouter model id for this chat (e.g. google/gemini-2.5-flash-lite). Empty = use default. */
    modelId: { type: String, default: '' },
    messages: [messageSchema],
    /** Unique shareable slug for link (e.g. /c/abc123). Private by default; isPublic controls visibility. */
    shareId: { type: String, default: null, unique: true, sparse: true },
    /** When false (default), GET /share/:shareId returns 403. When true, anyone with link can view read-only. */
    isPublic: { type: Boolean, default: false },
    /** Cumulative LLM tokens (prompt+completion) for this chat thread — used to cap cost per session. */
    llmSessionTokensTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatSchema.index({ updatedAt: -1 });
chatSchema.index({ anonymousId: 1, updatedAt: -1 });
// shareId index is created automatically by unique: true on the field
chatSchema.statics.generateShareId = generateShareId;

const Chat = mongoose.model('AgentChat', chatSchema);

export default Chat;
