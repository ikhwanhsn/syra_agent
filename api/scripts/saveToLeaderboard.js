import { getDb } from "../db.js";

// Save single data to leaderboard_entries collection (data is object)
export const saveToLeaderboard = async (data) => {
  const {
    wallet,
    volume,
    toolsCalls = 1,
    totalReward = 0,
    period = "7d",
    rank = 0,
    lastUpdated = new Date(),
  } = data;
  const db = await getDb();
  //   check if address already exists in leaderboard_entries collection
  const existingEntry = await db.collection("leaderboard_entries").findOne({
    wallet,
  });
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
  await db.collection("leaderboard_entries").insertMany(data);
};
