import { MongoClient } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.resolve(__dirname, "../.env.local");
const envPath = path.resolve(__dirname, "../.env");

/**
 * Function loadEnvFile.
 * @param {*} filePath - Input value used by the operation.
 * @returns {*} The operation result.
 */
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val.replace(/^["']|["']$/g, "");
          }
        }
      }
    }
  }
}

loadEnvFile(envLocalPath);
loadEnvFile(envPath);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "campuseats";

if (!uri) {
  console.error("❌ MONGODB_URI not found");
  process.exit(1);
}

const client = new MongoClient(uri);

/**
 * Function seed.
 * @returns {Promise<*>} Resolves with the operation result.
 */
async function seed() {
  console.log("Connecting to MongoDB to seed Better Auth users...");
  await client.connect();
  const db = client.db(dbName);

  const auth = betterAuth({
    database: mongodbAdapter(db),
    secret:
      process.env.BETTER_AUTH_SECRET ||
      "campuseats_development_secret_key_32_characters_minimum_auth",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "student" },
        studentId: { type: "string", required: false },
        phone: { type: "string", required: false },
        dormitoryAddress: { type: "string", required: false },
        shopId: { type: "string", required: false },
        vehicleType: { type: "string", required: false },
        verificationStatus: { type: "string", defaultValue: "verified" },
        isSuspended: { type: "boolean", defaultValue: false },
      },
    },
  });

  const demoAccounts = [
    {
      email: "student@campuseats.com",
      password: "Student123!",
      name: "Tanvir Ahmed",
      role: "student",
      studentId: "DU-CSE-2022-045",
      phone: "+880 1712-345678",
      dormitoryAddress: "Shahidullah Hall, Room 304",
      verificationStatus: "verified",
    },
    {
      email: "owner@campuseats.com",
      password: "Owner123!",
      name: "Rafiqul Islam",
      role: "shop_owner",
      phone: "+880 1812-345678",
      shopId: "shop-1",
      verificationStatus: "verified",
    },
    {
      email: "rider@campuseats.com",
      password: "Rider123!",
      name: "Sabbir Hossain",
      role: "rider",
      studentId: "DU-EEE-2021-012",
      phone: "+880 1912-345678",
      vehicleType: "Bicycle",
      verificationStatus: "verified",
    },
    {
      email: "admin@campuseats.com",
      password: "Admin123!",
      name: "Dr. Farhana Rahman",
      role: "admin",
      verificationStatus: "verified",
    },
  ];

  for (const acc of demoAccounts) {
    const existing = await db.collection("user").findOne({ email: acc.email });
    if (existing) {
      console.log(`ℹ️ Account already exists: ${acc.email} (${acc.role})`);
      // Update role & fields to ensure consistency
      await db.collection("user").updateOne(
        { email: acc.email },
        {
          $set: {
            role: acc.role,
            verificationStatus: acc.verificationStatus,
            dormitoryAddress: acc.dormitoryAddress || null,
            studentId: acc.studentId || null,
            phone: acc.phone || null,
            vehicleType: acc.vehicleType || null,
          },
        }
      );
    } else {
      console.log(`Creating Better Auth account for: ${acc.email} (${acc.role})...`);
      const res = await auth.api.signUpEmail({
        body: {
          name: acc.name,
          email: acc.email,
          password: acc.password,
          role: acc.role,
          studentId: acc.studentId,
          phone: acc.phone,
          dormitoryAddress: acc.dormitoryAddress,
          vehicleType: acc.vehicleType,
        },
      });

      // Enforce the intended privileged role via server bootstrap
      await db.collection("user").updateOne(
        { email: acc.email },
        {
          $set: {
            role: acc.role,
            verificationStatus: acc.verificationStatus,
          },
        }
      );
      console.log(`✅ Created Better Auth user: ${acc.email} (ID: ${res.user.id})`);
    }
  }

  console.log("\nAll demo accounts seeded and ready in MongoDB!");
  await client.close();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
