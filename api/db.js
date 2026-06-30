import mongoose from "mongoose";
import connectMongoose from "./config/mongoose.js";

/**
 * Shared MongoDB database handle via the singleton Mongoose connection.
 * Replaces a separate MongoClient pool (saves Atlas connection count).
 */
export async function getDb() {
  const ok = await connectMongoose({ required: false });
  if (!ok || mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected");
  }
  return mongoose.connection.getClient().db(process.env.DB_NAME || "syra");
}
