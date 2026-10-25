import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { client } from "./mongodb.js";
import { ROLES } from "./constants.js";

const dbName = process.env.MONGODB_DB || "campuseats";
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
          user.email = user.email.trim().toLowerCase();
          user.role = user.role || ROLES.STUDENT;
          if (!Object.values(ROLES).includes(user.role)) {
            throw new Error("Invalid account role");
          }

          if (!user.phone?.trim()) {
            throw new APIError("BAD_REQUEST", {
              message: "Phone number is required",
            });
          }

          if (
            user.role === ROLES.STUDENT &&
            (!user.studentId?.trim() || !user.dormitoryAddress?.trim())
          ) {
            throw new APIError("BAD_REQUEST", {
              message: "Student ID and dormitory details are required",
            });
          }

          if (
            user.role === ROLES.SHOP_OWNER &&
            (!user.shopName?.trim() ||
              !user.location?.trim() ||
              !user.shopCategory?.trim())
          ) {
            throw new APIError("BAD_REQUEST", {
              message: "Shop name, location, and category are required",
            });
          }

          if (
            user.role === ROLES.RIDER &&
            (!["Bicycle", "Motorcycle"].includes(user.vehicleType) ||
              !user.deliveryZones?.trim() ||
              (user.vehicleType === "Motorcycle" && !user.licenseNumber?.trim()))
          ) {
            throw new APIError("BAD_REQUEST", {
              message: "Rider vehicle and delivery details are required",
            });
          }

          // Shop owners and riders require admin verification/approval
          if (user.role === ROLES.SHOP_OWNER || user.role === ROLES.RIDER) {
            user.verificationStatus = "pending";
          } else {
            user.verificationStatus = "verified";
          }
          user.isSuspended = false;
          return { data: user };
        },
      },
    },
  },
});

export function getAuth() {
  return auth;
}
