import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // const { email, username } = await req.json();
    const client = await clientPromise;
    const db = client.db("syra");
    const totalSignals = await db.collection("signals").countDocuments({});
    const now = new Date();

    // Get daily signal
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const endOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    const dailySignals = await db.collection("signals").countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    // Get monthly signal
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const endOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
    );
    const monthlySignal = await db.collection("signals").countDocuments({
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    // Get buy signal
    const buySignals = await db.collection("signals").countDocuments({
      type: "Buy",
    });

    // Get sell signal
    const sellSignals = await db.collection("signals").countDocuments({
      type: "Sell",
    });

    // Get active signal
    const activeSignals = await db.collection("signals").countDocuments({
      status: "Active",
    });

    // Get pending signal
    const pendingSignals = await db.collection("signals").countDocuments({
      status: "Pending",
    });

    // Get failed signal
    const failedSignals = await db.collection("signals").countDocuments({
      status: "Failed",
    });

    // Get success signal
    const successSignals = await db.collection("signals").countDocuments({
      status: "Success",
    });

    //   const avgWinrate = await db
    //     .collection("signals")
    //     .aggregate([
    //       {
    //         $group: {
    //           _id: null,
    //           avgWinrate: { $avg: "$winrate" },
    //         },
    //       },
    //     ])
    //     .toArray();
    // const avgWinrateValue = avgWinrate[0]?.avgWinrate || 0;

    return NextResponse.json(
      {
        totalSignals,
        dailySignals,
        monthlySignal,
        buySignals,
        sellSignals,
        activeSignals,
        pendingSignals,
        failedSignals,
        successSignals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
