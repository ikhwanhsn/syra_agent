import { getDb } from "../db.js";

export const saveToLeaderboard = async (data) => {
  const {
    wallet,
    volume = 0,
    toolsCalls = 1,
    totalReward = 0,
    period = "7d",
    rank = 0,
    lastUpdated = new Date(),
  } = data;

  const db = await getDb();

  const existingEntry = await db
    .collection("leaderboard_entries")
    .findOne({ wallet });

  if (existingEntry) {
    await db.collection("leaderboard_entries").updateOne(
      { wallet },
      {
        $set: {
          wallet,
          volume: existingEntry.volume + volume,
          toolsCalls: existingEntry.toolsCalls + toolsCalls,
          totalReward: existingEntry.totalReward + totalReward,
          period,
          rank,
          lastUpdated,
        },
      }
    );

    return;
  }

  const doc = {
    wallet,
    volume,
    toolsCalls,
    totalReward,
    period,
    rank,
    lastUpdated,
  };

  await db.collection("leaderboard_entries").insertOne(doc);
};
