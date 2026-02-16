import mongoose from 'mongoose';

const agentChatLeaderboardSchema = new mongoose.Schema(
  {
    /** User identifier: anonymousId (localStorage) or wallet:pubkey when connected */
    anonymousId: { type: String, required: true, unique: true },
    /** Total number of messages sent by this user across all chats */
    totalMessages: { type: Number, default: 0 },
    /** Total number of chats created */
    totalChats: { type: Number, default: 0 },
    /** Total paid tool calls (x402) that completed successfully */
    totalToolCalls: { type: Number, default: 0 },
    /** Total x402 volume in USD (sum of tool prices paid by user's agent wallet) */
    x402VolumeUsd: { type: Number, default: 0 },
    /** Last time the user was active (created chat, sent message, or used a tool) */
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

agentChatLeaderboardSchema.index({ totalMessages: -1 });
agentChatLeaderboardSchema.index({ lastActiveAt: -1 });
agentChatLeaderboardSchema.index({ totalToolCalls: -1 });
agentChatLeaderboardSchema.index({ x402VolumeUsd: -1 });

const AgentChatLeaderboard = mongoose.model('AgentChatLeaderboard', agentChatLeaderboardSchema);
export default AgentChatLeaderboard;
