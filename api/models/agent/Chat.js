import mongoose from 'mongoose';

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

const chatSchema = new mongoose.Schema(
  {
    /** Owner: anonymousId (wallet-scoped or localStorage id). Chats are listed/filtered by this. */
    anonymousId: { type: String, default: null },
    title: { type: String, default: 'New Chat' },
    preview: { type: String, default: '' },
    agentId: { type: String, default: '' },
    systemPrompt: { type: String, default: '' },
    messages: [messageSchema],
  },
  { timestamps: true }
);

chatSchema.index({ updatedAt: -1 });
chatSchema.index({ anonymousId: 1, updatedAt: -1 });

const Chat = mongoose.model('AgentChat', chatSchema);

export default Chat;
