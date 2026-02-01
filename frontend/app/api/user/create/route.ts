import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();
    const client = await clientPromise;
    const db = client.db("syra");
    const user = await db.collection("new-user").find({ wallet }).toArray();
    if (user) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const result = await db.collection("new-user").insertOne({ wallet });
    if (result.insertedId) {
      return NextResponse.json({ message: "User added successfully" });
    }
    return NextResponse.json({ error: "Failed to add user!" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add user!" }, { status: 500 });
  }
}
