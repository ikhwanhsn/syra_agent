import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, username, wallet } = await req.json();
    // Check valid telegram username (@username)
    if (!username || !username.match(/^@[a-zA-Z0-9_]{5,}$/)) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }
    // Check valid email
    if (
      !email ||
      !email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    ) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("syra");
    const checkUsername = await db
      .collection("new-user")
      .find({ username })
      .toArray();
    if (checkUsername.length > 0) {
      return NextResponse.json(
        { error: "Username already registered" },
        { status: 400 }
      );
    }
    const checkEmail = await db
      .collection("new-user")
      .find({ email })
      .toArray();
    if (checkEmail.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const user = await db.collection("new-user").find({ wallet }).toArray();
    // Check if user exists
    if (user.length > 0) {
      const result = await db.collection("new-user").updateOne(
        { wallet },
        {
          $set: {
            email,
            wallet,
            username,
            updatedAt: new Date(),
            ...user[0],
          },
        }
      );
      if (result.modifiedCount) {
        return NextResponse.json({ message: "Profile updated" });
      }
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Check if email on waitlist
    const checkWaitlist = await db
      .collection("waitlist")
      .find({ email })
      .toArray();

    // Create new user
    const result = await db.collection("new-user").insertOne({
      email,
      wallet,
      username,
      role: "user",
      isPremium: checkWaitlist.length > 0 ? true : false,
      premiumAt: checkWaitlist.length > 0 ? new Date() : null,
      premiumEndAt:
        checkWaitlist.length > 0
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (result.insertedId) {
      return NextResponse.json({
        message: "Profile updated",
        status: 200,
        ok: true,
      });
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      {
        status: 500,
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
