import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const query = search
      ? {
          $or: [
            { wallet: { $regex: search, $options: "i" } },
            { signal: { $regex: search, $options: "i" } },
            { token: { $regex: search, $options: "i" } },
            { ticker: { $regex: search, $options: "i" } },
            { paymentSignature: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const client = await clientPromise;
    const db = client.db("syra");
    const signals = await db
      .collection("signals")
      .find(query)
      .sort({ _id: -1 })
      .limit(25)
      .toArray();
    if (signals) {
      return NextResponse.json({ signals }, { status: 200 });
    } else {
      return NextResponse.json({ error: "No signals found" }, { status: 404 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
