import clientPromise from "./mongodb";
import {
  INITIAL_SHOPS,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_USERS,
  INITIAL_SHOP_APPLICATIONS,
  INITIAL_DISPUTES,
  INITIAL_NOTIFICATIONS,
} from "@/services/mock/mock-data";

const dbName = process.env.MONGODB_DB || "campuseats";

let isSeeding = false;
let isSeeded = false;

/**
 * Returns connected MongoDB database instance.
 * Fails closed if connection cannot be established.
 */
export async function getDb() {
  const client = await clientPromise;
  if (!client) {
    throw new Error("MongoDB client is not initialized. Please verify MONGODB_URI in .env.local");
  }
  const db = client.db(dbName);

  // Seed business domain collections if empty (non-destructive)
  if (!isSeeded && !isSeeding) {
    isSeeding = true;
    try {
      await seedDatabaseIfEmpty(db);
      isSeeded = true;
    } catch (err) {
      console.warn("[MongoDB Seeding Warn]:", err.message);
    } finally {
      isSeeding = false;
    }
  }

  return db;
}

/**
 * Non-destructive seed of business collections if empty.
 * Never inserts fake auth passwords or accounts; Better Auth owns auth records.
 */
async function seedDatabaseIfEmpty(database) {
  try {
    const shopsCount = await database.collection("shops").countDocuments();
    if (shopsCount === 0) {
      await database.collection("shops").insertMany(INITIAL_SHOPS);
      await database.collection("menuItems").insertMany(INITIAL_MENU_ITEMS);
      await database.collection("orders").insertMany(INITIAL_ORDERS);
      await database.collection("shopApplications").insertMany(INITIAL_SHOP_APPLICATIONS);
      await database.collection("disputes").insertMany(INITIAL_DISPUTES);
      await database.collection("notifications").insertMany(INITIAL_NOTIFICATIONS);
      console.log(`[MongoDB] Initialized domain collections for database '${dbName}'.`);
    }
  } catch (err) {
    console.error("[MongoDB Seeding Error]:", err.message);
  }
}

/**
 * Universal Data Access Helper
 * Returns direct MongoDB collection interface.
 */
export async function getCollection(name) {
  const db = await getDb();
  const collection = db.collection(name);
  return {
    isMongo: true,
    collection,
    find: async (query = {}) => await collection.find(query).toArray(),
    findOne: async (query) => await collection.findOne(query),
    insertOne: async (doc) => await collection.insertOne(doc),
    insertMany: async (docs) => await collection.insertMany(docs),
    updateOne: async (query, update) => await collection.updateOne(query, update),
    updateMany: async (query, update) => await collection.updateMany(query, update),
    deleteOne: async (query) => await collection.deleteOne(query),
    deleteMany: async (query) => await collection.deleteMany(query),
    countDocuments: async (query = {}) => await collection.countDocuments(query),
  };
}

/**
 * Safe, sanitized MongoDB connection health check.
 * Pings database and returns status without disclosing credentials or URIs.
 */
export async function checkMongoConnection() {
  try {
    const client = await clientPromise;
    if (!client) {
      return {
        connected: false,
        database: dbName,
        error: "MongoDB client failed to initialize.",
      };
    }
    const db = client.db(dbName);
    const pingResult = await db.command({ ping: 1 });
    const isOk = pingResult && pingResult.ok === 1;

    let collections = [];
    if (isOk) {
      const colList = await db.listCollections().toArray();
      collections = colList.map((c) => c.name);
    }

    return {
      connected: isOk,
      database: dbName,
      ping: pingResult,
      collections,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      connected: false,
      database: dbName,
      error: err.message || "Failed to reach MongoDB server",
      timestamp: new Date().toISOString(),
    };
  }
}
