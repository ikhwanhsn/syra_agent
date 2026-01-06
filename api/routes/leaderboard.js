import express from "express";
import { getDb } from "../db.js";

export async function createLeaderboardRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const { period = "7d" } = req.query;
    // Example with MongoDB aggregation
    async function getLeaderboard(period) {
      const db = await getDb();

      // Calculate date range based on period
      const dateFilter =
        period === "all"
          ? {}
          : {
              lastUpdated: {
                $gte: new Date(Date.now() - getPeriodInMs(period)),
              },
            };

      const results = await db
        .collection("leaderboard_entries")
        .find(dateFilter)
        .sort({ volume: -1 }) // Sort by volume descending
        .toArray();

      return results;
    }

    function getPeriodInMs(period) {
      const periods = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "14d": 14 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      };
      return periods[period];
    }

    const leaderboard = await getLeaderboard(period);

    // Return the leaderboard data
    res.send(leaderboard);
  });

  //   add data to leaderboard_entries collection
  router.post("/create", async (req, res) => {
    const { data } = req.body;
    const db = await getDb();
    await db.collection("leaderboard_entries").insertMany(data);
    res.send({ message: "Data added to leaderboard_entries" });
  });

  //   update data in leaderboard_entries collection
  router.post("/update", async (req, res) => {
    const { data } = req.body;
    const db = await getDb();
    await db
      .collection("leaderboard_entries")
      .updateMany(
        { id: { $in: data.map((item) => item.id) } },
        { $set: data.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}) }
      );
    res.send({ message: "Data updated in leaderboard_entries" });
  });

  return router;
}
