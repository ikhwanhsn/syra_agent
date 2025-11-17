import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI as string;
if (!uri) throw new Error("Missing MONGODB_URI in .env");

const client: any = new MongoClient(uri);

export async function getDb() {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
  return client.db(process.env.DB_NAME || "syra");
}
