import { getDb } from "../db.js";
import { getTokenBalance } from "./getTokenBalance.js";

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

  // check if wallet hold SYRA token
  const balance = await getTokenBalance(
    wallet,
    "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
  );
  if (balance === 0) {
    console.log(`Wallet ${wallet} does not hold SYRA token`);
    return;
  }

  const bonus = balance > 1000000 ? volume * 0.1 : 0;

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
          volume: existingEntry.volume + volume + bonus,
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
