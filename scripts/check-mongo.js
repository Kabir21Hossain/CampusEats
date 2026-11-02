import { MongoClient } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load environment variables without third-party dependencies
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

console.log("=========================================");
console.log("   CampusEats MongoDB Connection Check   ");
console.log("=========================================");

if (!uri) {
  console.error("❌ ERROR: MONGODB_URI is not set in environment.");
  console.error("   Please check your .env.local file.");
  process.exit(1);
}

// Masked URI for safe display
const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
console.log(`📡 Target Database : ${dbName}`);
console.log(`🔗 Target Host     : ${maskedUri}`);

/**
 * Function runCheck.
 * @returns {Promise<*>} Resolves with the operation result.
 */
async function runCheck() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log("\nAttempting connection to MongoDB...");
    const startTime = Date.now();
    await client.connect();
    const elapsed = Date.now() - startTime;

    const db = client.db(dbName);
    const ping = await db.command({ ping: 1 });

    console.log(`✅ MongoDB Connected Successfully (${elapsed}ms)`);
    console.log(`   Ping Result:`, ping);

    const collections = await db.listCollections().toArray();
    console.log(`\n📦 Existing Collections (${collections.length}):`);
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   - ${col.name.padEnd(20)} : ${count} documents`);
    }

    console.log("\n=========================================");
    console.log("   MongoDB Connection: VERIFIED HEALTHY   ");
    console.log("=========================================\n");
  } catch (err) {
    console.error("\n❌ MongoDB Connection Failed!");
    console.error("   Message:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runCheck();
