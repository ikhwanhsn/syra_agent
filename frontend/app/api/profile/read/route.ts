import clientPromise from "@/lib/mongodb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) {
    return Response.json({ error: "Wallet is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("syra");
  const user = await db.collection("new-user").findOne({ wallet });
  if (user) {
    return Response.json({ user }, { status: 200 });
  } else {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
}
