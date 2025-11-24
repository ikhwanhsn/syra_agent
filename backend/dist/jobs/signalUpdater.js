import fetch from "node-fetch";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
export async function runSignalUpdater() {
    try {
        const pricesFetch = await fetch("https://api.binance.com/api/v3/ticker/price");
        const prices = await pricesFetch.json();
        if (!Array.isArray(prices)) {
            console.error("Invalid prices data");
            return;
        }
        console.log("🟡 Running signal updater:", prices.length, "pairs");
        let updatedSignalsFromPendingToActive = 0;
        let updatedSignalsFromActiveToSuccess = 0;
        let updatedSignalsFromActiveToFailed = 0;
        const db = await getDb();
        // === Pending → Active ===
        const signalsPending = await db
            .collection("signals")
            .find({ status: "Pending" })
            .toArray();
        for (const signal of signalsPending) {
            const price = prices.find((p) => p.symbol === `${signal.ticker}USDT`);
            if (!price)
                continue;
            const currentPrice = Number(price.price);
            if ((signal.signal === "Buy" && currentPrice <= signal.entryPrice) ||
                (signal.signal === "Sell" && currentPrice >= signal.entryPrice)) {
                const result = await db
                    .collection("signals")
                    .updateOne({ _id: new ObjectId(signal._id) }, { $set: { status: "Active", updatedAt: new Date() } });
                if (result.modifiedCount > 0)
                    updatedSignalsFromPendingToActive++;
            }
        }
        // === Active → Success / Failed ===
        const signalsActive = await db
            .collection("signals")
            .find({ status: "Active" })
            .toArray();
        for (const signal of signalsActive) {
            const price = prices.find((p) => p.symbol === `${signal.ticker}USDT`);
            if (!price)
                continue;
            const currentPrice = Number(price.price);
            // Success
            if ((signal.signal === "Buy" && currentPrice >= signal.takeProfit) ||
                (signal.signal === "Sell" && currentPrice <= signal.takeProfit)) {
                const result = await db
                    .collection("signals")
                    .updateOne({ _id: new ObjectId(signal._id) }, { $set: { status: "Success", updatedAt: new Date() } });
                if (result.modifiedCount > 0)
                    updatedSignalsFromActiveToSuccess++;
                continue;
            }
            // Failed
            if ((signal.signal === "Buy" && currentPrice <= signal.stopLoss) ||
                (signal.signal === "Sell" && currentPrice >= signal.stopLoss)) {
                const result = await db
                    .collection("signals")
                    .updateOne({ _id: new ObjectId(signal._id) }, { $set: { status: "Failed", updatedAt: new Date() } });
                if (result.modifiedCount > 0)
                    updatedSignalsFromActiveToFailed++;
            }
        }
        console.log("✅ Signal updater finished:", {
            updatedSignalsFromPendingToActive,
            updatedSignalsFromActiveToSuccess,
            updatedSignalsFromActiveToFailed,
        });
    }
    catch (error) {
        console.error("❌ Signal updater failed:", error);
    }
}
