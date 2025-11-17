import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // const { email, username } = await req.json();
    const client = await clientPromise;
    const db = client.db("syra");
    const totalUsers = await db.collection("users").countDocuments({});
    const totalSignals = await db.collection("signals").countDocuments({});
    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const endOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );

    const signalToday = await db.collection("signals").countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const totalSignalsSuccess = await db.collection("signals").countDocuments({
      status: "Success",
    });
    const avgWinrate = (totalSignalsSuccess / totalSignals) * 100;
    const avgWinrateFinal = `${avgWinrate.toFixed(1)}%`;

    return NextResponse.json(
      { totalUsers, totalSignals, signalToday, avgWinrate: avgWinrateFinal },
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
