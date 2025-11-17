import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prices } = await req.json();

    if (!prices || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: "Prices data is required" },
        { status: 400 }
      );
    }

    console.log("Received prices:", prices.length, "pairs");

    let updatedSignalsFromPendingToActive = 0;
    let updatedSignalsFromActiveToSuccess = 0;
    let updatedSignalsFromActiveToFailed = 0;

    const client = await clientPromise;
    const db = client.db("syra");

    const signalsPending = await db
      .collection("signals")
      .find({ status: "Pending" })
      .toArray();

    if (signalsPending.length === 0) {
      return NextResponse.json(
        { error: "No pending signals" },
        { status: 404 }
      );
    }

    // Use the prices passed from client
    for (const signal of signalsPending) {
      const price = prices.find(
        (item: any) => item.symbol === `${signal.ticker}USDT`
      );
      if (price) {
        const currentPrice = Number(price.price);
        if (signal.signal === "Buy" && currentPrice <= signal.entryPrice) {
          const result = await db
            .collection("signals")
            .updateOne(
              { _id: new ObjectId(signal._id) },
              { $set: { status: "Active", updatedAt: new Date() } }
            );
          if (result.modifiedCount > 0) {
            updatedSignalsFromPendingToActive++;
          }
        } else if (
          signal.signal === "Sell" &&
          currentPrice >= signal.entryPrice
        ) {
          const result = await db
            .collection("signals")
            .updateOne(
              { _id: new ObjectId(signal._id) },
              { $set: { status: "Active", updatedAt: new Date() } }
            );
          if (result.modifiedCount > 0) {
            updatedSignalsFromPendingToActive++;
          }
        }
      }
    }

    const signalsActive = await db
      .collection("signals")
      .find({ status: "Active" })
      .toArray();

    if (signalsActive.length === 0) {
      return NextResponse.json({ error: "No active signals" }, { status: 404 });
    }

    for (const signal of signalsActive) {
      const price = prices.find(
        (item: any) => item.symbol === `${signal.ticker}USDT`
      );
      if (price) {
        const currentPrice = Number(price.price);
        if (signal.signal === "Buy" && currentPrice >= signal.takeProfit) {
          const result = await db
            .collection("signals")
            .updateOne(
              { _id: new ObjectId(signal._id) },
              { $set: { status: "Success", updatedAt: new Date() } }
            );
          if (result.modifiedCount > 0) {
            updatedSignalsFromActiveToSuccess++;
          }
        } else if (
          signal.signal === "Sell" &&
          currentPrice <= signal.takeProfit
        ) {
          const result = await db
            .collection("signals")
            .updateOne(
              { _id: new ObjectId(signal._id) },
              { $set: { status: "Success", updatedAt: new Date() } }
            );
          if (result.modifiedCount > 0) {
            updatedSignalsFromActiveToSuccess++;
          }
        }
      }
    }

    for (const signal of signalsActive) {
      const price = prices.find(
        (item: any) => item.symbol === `${signal.ticker}USDT`
      );
      if (price) {
        const currentPrice = Number(price.price);
        if (signal.signal === "Buy" && currentPrice <= signal.stopLoss) {
          const result = await db
            .collection("signals")
            .updateOne(
              { _id: new ObjectId(signal._id) },
              { $set: { status: "Failed", updatedAt: new Date() } }
            );
          if (result.modifiedCount > 0) {
            updatedSignalsFromActiveToFailed++;
          }
        } else if (
          signal.signal === "Sell" &&
          currentPrice >= signal.stopLoss
        ) {
          const result = await db
            .collection("signals")
            .updateOne(
              { _id: new ObjectId(signal._id) },
              { $set: { status: "Failed", updatedAt: new Date() } }
            );
          if (result.modifiedCount > 0) {
            updatedSignalsFromActiveToFailed++;
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: "Updated signals Successfully!",
        updatedSignalsFromPendingToActive,
        updatedSignalsFromActiveToSuccess,
        updatedSignalsFromActiveToFailed,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update signals" },
      { status: 500 }
    );
  }
}
