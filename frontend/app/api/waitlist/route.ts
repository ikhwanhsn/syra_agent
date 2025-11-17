import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // waitlist is ended
    return NextResponse.json({ error: "Waitlist is ended" }, { status: 400 });
    // const { email, username } = await req.json();
    // const client = await clientPromise;
    // const db = client.db("syra");
    // const waitlist = await db.collection("waitlist").find({ email }).toArray();
    // if (waitlist.length > 0) {
    //   return NextResponse.json(
    //     { error: "Email already in waitlist" },
    //     { status: 400 }
    //   );
    // }

    // const result = await db
    //   .collection("waitlist")
    //   .insertOne({ email, username });
    // if (result.insertedId) {
    //   return NextResponse.json({ message: "Email added to waitlist" });
    // }
    // return NextResponse.json(
    //   { error: "Failed to add email to waitlist" },
    //   { status: 500 }
    // );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
