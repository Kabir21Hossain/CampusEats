import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { client } from "./mongodb.js";
import { validateStoreRegistration } from "./store-registration.js";

const dbName = process.env.MONGODB_DB?.trim() || "campuseats";
const db = client.db(dbName);
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters.");
}

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false,
      },
      studentId: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      username: {
        type: "string",
        required: false,
      },
      dormitoryAddress: {
        type: "string",
        required: false,
      },
      shopName: {
        type: "string",
        required: false,
      },
      location: {
        type: "string",
        required: false,
      },
      shopCategory: {
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
      licenseNumber: {
        type: "string",
        required: false,
      },
      deliveryZones: {
        type: "string",
        required: false,
      },
      isOnline: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      verificationStatus: {
        type: "string",
        required: false,
        defaultValue: "verified",
      },
      isSuspended: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return { data: validateStoreRegistration(user) };
        },
      },
    },
  },
});

export function getAuth() {
  return auth;
}
