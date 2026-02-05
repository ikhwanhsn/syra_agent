import mongoose from 'mongoose';
import crypto from 'crypto';

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    toolUsage: {
      name: String,
      status: { type: String, enum: ['running', 'complete', 'error'] },
    },
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
    /** Jatevo model id for this chat (e.g. glm-4.7, deepseek-v3.2). Empty = use default. */
    modelId: { type: String, default: '' },
    messages: [messageSchema],
    /** Unique shareable slug for link (e.g. /c/abc123). Private by default; isPublic controls visibility. */
    shareId: { type: String, default: null, unique: true, sparse: true },
    /** When false (default), GET /share/:shareId returns 403. When true, anyone with link can view read-only. */
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatSchema.index({ updatedAt: -1 });
chatSchema.index({ anonymousId: 1, updatedAt: -1 });
// shareId index is created automatically by unique: true on the field
chatSchema.statics.generateShareId = generateShareId;

const Chat = mongoose.model('AgentChat', chatSchema);

export default Chat;
