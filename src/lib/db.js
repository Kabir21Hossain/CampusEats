import { MongoClient } from "mongodb";
import {
  INITIAL_SHOPS,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_USERS,
  INITIAL_SHOP_APPLICATIONS,
  INITIAL_DISPUTES,
  INITIAL_NOTIFICATIONS,
} from "@/services/mock/mock-data";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "campuseats";

let client = null;
let db = null;
let isConnected = false;

// In-memory fallback database if MongoDB daemon is not running locally
const memoryStore = {
  users: [...INITIAL_USERS],
  shops: [...INITIAL_SHOPS],
  menuItems: [...INITIAL_MENU_ITEMS],
  orders: [...INITIAL_ORDERS],
  shopApplications: [...INITIAL_SHOP_APPLICATIONS],
  disputes: [...INITIAL_DISPUTES],
  notifications: [...INITIAL_NOTIFICATIONS],
  sessions: [],
  accounts: [],
  verifications: [],
};

export async function getDb() {
  if (db && isConnected) return db;

  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 1500,
        connectTimeoutMS: 2000,
      });
    }
    await client.connect();
    db = client.db(dbName);
    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${dbName}`);

    // Seed collections if empty
    await seedDatabase(db);
    return db;
  } catch (err) {
    console.warn(`[MongoDB] Offline/Fallback mode active: ${err.message}`);
    isConnected = false;
    return null;
  }
}

async function seedDatabase(database) {
  try {
    const shopsCount = await database.collection("shops").countDocuments();
    if (shopsCount === 0) {
      await database.collection("shops").insertMany(INITIAL_SHOPS);
      await database.collection("menuItems").insertMany(INITIAL_MENU_ITEMS);
      await database.collection("orders").insertMany(INITIAL_ORDERS);
      await database.collection("users").insertMany(INITIAL_USERS);
      await database.collection("shopApplications").insertMany(INITIAL_SHOP_APPLICATIONS);
      await database.collection("disputes").insertMany(INITIAL_DISPUTES);
      await database.collection("notifications").insertMany(INITIAL_NOTIFICATIONS);
      console.log("[MongoDB] Database successfully seeded with CampusEats records.");
    }
  } catch (err) {
    console.error("[MongoDB] Seeding error:", err.message);
  }
}

/**
 * Universal Data Access Helper
 * Automatically uses MongoDB if available, otherwise uses persistent memory store.
 */
export async function getCollection(name) {
  const database = await getDb();
  if (database && isConnected) {
    return {
      isMongo: true,
      collection: database.collection(name),
      find: async (query = {}) => await database.collection(name).find(query).toArray(),
      findOne: async (query) => await database.collection(name).findOne(query),
      insertOne: async (doc) => await database.collection(name).insertOne(doc),
      updateOne: async (query, update) => await database.collection(name).updateOne(query, update),
      deleteOne: async (query) => await database.collection(name).deleteOne(query),
      countDocuments: async (query = {}) => await database.collection(name).countDocuments(query),
    };
  }

  // Memory store fallback
  if (!memoryStore[name]) memoryStore[name] = [];
  const list = memoryStore[name];

  return {
    isMongo: false,
    find: async (filterFn = {}) => {
      if (typeof filterFn === "function") return list.filter(filterFn);
      if (Object.keys(filterFn).length === 0) return [...list];
      return list.filter((item) =>
        Object.entries(filterFn).every(([k, v]) => item[k] === v)
      );
    },
    findOne: async (filterFn) => {
      if (typeof filterFn === "function") return list.find(filterFn) || null;
      return (
        list.find((item) =>
          Object.entries(filterFn).every(([k, v]) => item[k] === v)
        ) || null
      );
    },
    insertOne: async (doc) => {
      const newDoc = { ...doc, _id: doc._id || doc.id || `doc-${Date.now()}` };
      list.unshift(newDoc);
      return { insertedId: newDoc._id };
    },
    updateOne: async (query, updates) => {
      const idx = list.findIndex((item) =>
        typeof query === "function"
          ? query(item)
          : Object.entries(query).every(([k, v]) => item[k] === v)
      );
      if (idx !== -1) {
        const payload = updates.$set ? updates.$set : updates;
        list[idx] = { ...list[idx], ...payload };
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    },
    deleteOne: async (query) => {
      const idx = list.findIndex((item) =>
        typeof query === "function"
          ? query(item)
          : Object.entries(query).every(([k, v]) => item[k] === v)
      );
      if (idx !== -1) {
        list.splice(idx, 1);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },
    countDocuments: async () => list.length,
  };
}

export { memoryStore };
