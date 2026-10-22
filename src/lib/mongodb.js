import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/campuseats";

if (!process.env.MONGODB_URI) {
  console.warn("[MongoDB Warning] MONGODB_URI environment variable is not defined in process.env. Ensure .env.local is loaded.");
}

const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!globalThis._mongoClientPromise) {
    client = new MongoClient(uri || "mongodb://localhost:27017/campuseats", options);
    globalThis._mongoClient = client;
    globalThis._mongoClientPromise = client.connect();
  }
  client = globalThis._mongoClient;
  clientPromise = globalThis._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export { client };
export default clientPromise;
