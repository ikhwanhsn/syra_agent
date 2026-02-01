import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const client = await clientPromise;
    const db = client.db("syra");

    // Step 1: Match users by search (optional)
    const userMatch = search
      ? {
          $or: [
            { wallet: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Step 2: Aggregate user + signal data
    const data = await db
      .collection("new-user")
      .aggregate([
        { $match: userMatch },

        // Join with signals collection
        {
          $lookup: {
            from: "signals",
            localField: "wallet",
            foreignField: "wallet",
            as: "signals",
          },
        },
        {
          $addFields: {
            signals: {
              $filter: {
                input: "$signals",
                as: "s",
                cond: {
                  $in: ["$$s.status", ["Success", "Failed"]],
                },
              },
            },
          },
        },

        // Add computed metrics
        {
          $addFields: {
            totalSignals: { $size: "$signals" },
            winSignals: {
              $size: {
                $filter: {
                  input: "$signals",
                  as: "s",
                  cond: { $eq: ["$$s.status", "Success"] },
                },
              },
            },
            buySignals: {
              $filter: {
                input: "$signals",
                as: "s",
                cond: { $eq: ["$$s.signal", "Buy"] },
              },
            },
            sellSignals: {
              $filter: {
                input: "$signals",
                as: "s",
                cond: { $eq: ["$$s.signal", "Sell"] },
              },
            },
            lastActive: {
              $max: "$signals.createdAt",
            },
          },
        },

        // Compute win rates
        {
          $addFields: {
            winRate: {
              $cond: [
                { $gt: ["$totalSignals", 0] },
                {
                  $multiply: [
                    { $divide: ["$winSignals", "$totalSignals"] },
                    100,
                  ],
                },
                0,
              ],
            },
            buyWinRate: {
              $cond: [
                { $gt: [{ $size: "$buySignals" }, 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $size: {
                            $filter: {
                              input: "$buySignals",
                              as: "s",
                              cond: { $eq: ["$$s.status", "Success"] },
                            },
                          },
                        },
                        { $size: "$buySignals" },
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
            sellWinRate: {
              $cond: [
                { $gt: [{ $size: "$sellSignals" }, 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $size: {
                            $filter: {
                              input: "$sellSignals",
                              as: "s",
                              cond: { $eq: ["$$s.status", "Success"] },
                            },
                          },
                        },
                        { $size: "$sellSignals" },
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },

        // Project the final fields
        {
          $project: {
            _id: 0,
            username: 1,
            email: 1,
            wallet: 1,
            totalSignals: 1,
            winRate: 1,
            buyWinRate: 1,
            sellWinRate: 1,
            lastActive: 1,
          },
        },

        // Sort newest active users first
        // { $sort: { lastActive: -1 } },
        { $sort: { winRate: -1 } },

        // Limit results
        { $limit: 25 },
      ])
      .toArray();

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch combined data" },
      { status: 500 }
    );
  }
}
