import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "campuseats";

let authInstance = null;

export function getAuth() {
  if (authInstance) return authInstance;

  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
    const db = client.db(dbName);

    authInstance = betterAuth({
      database: mongodbAdapter(db),
      secret:
        process.env.BETTER_AUTH_SECRET ||
        "campuseats_development_secret_key_32_characters_min",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      emailAndPassword: {
        enabled: true,
      },
      user: {
        additionalFields: {
          role: {
            type: "string",
            required: false,
            defaultValue: "student",
          },
          studentId: {
            type: "string",
            required: false,
          },
          phone: {
            type: "string",
            required: false,
          },
          dormitoryAddress: {
            type: "string",
            required: false,
          },
          shopId: {
            type: "string",
            required: false,
          },
          vehicleType: {
            type: "string",
            required: false,
          },
        },
      },
    });
  } catch (err) {
    console.warn("[Better Auth] Fallback initialization:", err.message);
    authInstance = betterAuth({
      secret:
        process.env.BETTER_AUTH_SECRET ||
        "campuseats_development_secret_key_32_characters_min",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      emailAndPassword: {
        enabled: true,
      },
    });
  }

  return authInstance;
}

export const auth = getAuth();
