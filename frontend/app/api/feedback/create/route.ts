import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  const { username, feedback } = await req.json();
  const client = await clientPromise;
  const db = client.db("syra");
  const result = await db
    .collection("feedbacks")
    .insertOne({ username, feedback });
  if (result.insertedId) {
    return Response.json({ message: "Thanks for your feedback!", ok: true });
  }
  return Response.json({ error: "Failed to add feedback!" }, { status: 500 });
}
