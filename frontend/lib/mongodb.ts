import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string; // add this in .env.local
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Ensure we reuse the same client in development (avoid too many connections)
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
