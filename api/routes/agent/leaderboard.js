import express from 'express';
import AgentChatLeaderboard from '../../models/agent/AgentChatLeaderboard.js';

const router = express.Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const SORT_FIELDS = {
  messages: 'totalMessages',
  chats: 'totalChats',
  recent: 'lastActiveAt',
  tools: 'totalToolCalls',
  volume: 'x402VolumeUsd',
};

/**
 * GET / - Leaderboard of users by AI agent chat usage.
 * Query: limit (default 20, max 100), skip (default 0), sort=messages|chats|recent|tools|volume (default messages), order=asc|desc (default desc).
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const sort = (req.query.sort || 'messages').toLowerCase();
    const order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const sortField = SORT_FIELDS[sort] || SORT_FIELDS.messages;

    const [total, entries] = await Promise.all([
      AgentChatLeaderboard.countDocuments(),
      AgentChatLeaderboard.find()
        .sort({ [sortField]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const leaderboard = entries.map((e, i) => ({
      rank: skip + i + 1,
      anonymousId: e.anonymousId,
      totalMessages: e.totalMessages ?? 0,
      totalChats: e.totalChats ?? 0,
      totalToolCalls: e.totalToolCalls ?? 0,
      x402VolumeUsd: e.x402VolumeUsd ?? 0,
      lastActiveAt: e.lastActiveAt ?? e.updatedAt,
    }));

    res.json({ leaderboard, sort: sortField, order: order === 1 ? 'asc' : 'desc', total, limit, skip });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export async function createAgentLeaderboardRouter() {
  return router;
}

export default router;
