import fs from "fs";
import mongoose from "mongoose";

const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const uriLine = env.split(/\r?\n/).find((l) => l.startsWith("MONGODB_URI="));
let uri = uriLine.slice("MONGODB_URI=".length).trim();
if (
  (uri.startsWith('"') && uri.endsWith('"')) ||
  (uri.startsWith("'") && uri.endsWith("'"))
) {
  uri = uri.slice(1, -1);
}

await mongoose.connect(uri);
const payer = "9VsuZxfkEtE3gbqkuVuimQg8gRy6cX2oZnXJUNw1tGCm";
const logs = await mongoose.connection.db
  .collection("x402calllogs")
  .find({ payer })
  .sort({ createdAt: -1 })
  .limit(5)
  .project({ path: 1, outcome: 1, source: 1, createdAt: 1, amountUsd: 1 })
  .toArray();
const paid = await mongoose.connection.db
  .collection("paidapicalls")
  .find({})
  .sort({ createdAt: -1 })
  .limit(8)
  .project({ path: 1, source: 1, createdAt: 1, network: 1 })
  .toArray();
const bySource = await mongoose.connection.db
  .collection("paidapicalls")
  .aggregate([{ $group: { _id: "$source", n: { $sum: 1 } } }])
  .toArray();
const mcpLogs = await mongoose.connection.db
  .collection("x402calllogs")
  .countDocuments({ source: { $in: ["mcp", "mcp-server"] }, outcome: "paid" });

console.log("x402 recent for payer:", JSON.stringify(logs, null, 2));
console.log("paidapicalls recent:", JSON.stringify(paid, null, 2));
console.log("paid by source:", JSON.stringify(bySource, null, 2));
console.log("x402 paid with mcp source count:", mcpLogs);
await mongoose.disconnect();
