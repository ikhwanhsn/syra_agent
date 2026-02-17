import AgentChatLeaderboard from '../models/agent/AgentChatLeaderboard.js';

/**
 * Record AI agent chat usage for leaderboard. Call when user creates a chat, sends messages, or completes tool calls.
 * @param {string} anonymousId - User id (wallet-scoped or localStorage)
 * @param {{ chatsDelta?: number, messagesDelta?: number, toolCallsDelta?: number, x402VolumeUsdDelta?: number }} options
 */
export async function recordAgentChatUsage(anonymousId, {
  chatsDelta = 0,
  messagesDelta = 0,
  toolCallsDelta = 0,
  x402VolumeUsdDelta = 0,
} = {}) {
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) return;
  if (chatsDelta === 0 && messagesDelta === 0 && toolCallsDelta === 0 && x402VolumeUsdDelta === 0) return;

  const ownerId = anonymousId.trim();
  const now = new Date();

  const inc = {};
  if (chatsDelta) inc.totalChats = chatsDelta;
  if (messagesDelta) inc.totalMessages = messagesDelta;
  if (toolCallsDelta) inc.totalToolCalls = toolCallsDelta;
  if (x402VolumeUsdDelta) inc.x402VolumeUsd = x402VolumeUsdDelta;

  try {
    await AgentChatLeaderboard.findOneAndUpdate(
      { anonymousId: ownerId },
      { $inc: inc, $set: { lastActiveAt: now } },
      { upsert: true, new: true }
    );
  } catch {
    // recordAgentChatUsage failed; non-fatal
  }
}
