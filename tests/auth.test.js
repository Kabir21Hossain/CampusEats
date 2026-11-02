import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { requireRole, assertOwnership } from "../src/lib/auth-server.js";
import { ROLES } from "../src/lib/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.resolve(__dirname, "../.env.local");
const envPath = path.resolve(__dirname, "../.env");

/**
 * Function loadEnv.
 * @param {*} filePath - Input value used by the operation.
 * @returns {*} The operation result.
 */
function loadEnv(filePath) {
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

loadEnv(envLocalPath);
loadEnv(envPath);

describe("CampusEats Authentication & MongoDB Test Suite", () => {
  let client;
  let db;
  let auth;
  const testEmail = `autotest_${Date.now()}@campuseats.test`;
  let createdUserId = null;
  let cookieHeader = null;

  before(async () => {
    assert.ok(process.env.MONGODB_URI, "MONGODB_URI must be configured in environment");
    client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(process.env.MONGODB_DB || "campuseats");

    auth = betterAuth({
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
          verificationStatus: { type: "string", defaultValue: "verified" },
        },
      },
      databaseHooks: {
        user: {
          create: {
            before: async (user) => {
              // Block admin self-assignment
              if (user.role === "admin") {
                user.role = "student";
              }
              return { data: user };
            },
          },
        },
      },
    });
  });

  after(async () => {
    // Clean up test records from MongoDB
    if (db) {
      await db.collection("user").deleteMany({ email: { $regex: /@campuseats\.test$/ } });
      if (createdUserId) {
        await db.collection("account").deleteMany({ userId: createdUserId });
        await db.collection("session").deleteMany({ userId: createdUserId });
      }
    }
    if (client) {
      await client.close();
    }
    setTimeout(() => process.exit(0), 100);
  });

  test("1. MongoDB Connection & Database Ping", async () => {
    const ping = await db.command({ ping: 1 });
    assert.equal(ping.ok, 1, "MongoDB ping should succeed with ok: 1");
  });

  test("2. Signup persists user to MongoDB with role 'student'", async () => {
    const res = await auth.api.signUpEmail({
      body: {
        name: "Test Runner",
        email: testEmail,
        password: "StrongPassword123!",
        role: "student",
        studentId: "DU-TEST-2026",
        phone: "+8801700000000",
      },
    });

    assert.ok(res.user, "Signup should return user object");
    assert.equal(res.user.email, testEmail);
    assert.equal(res.user.role, "student");
    createdUserId = res.user.id;

    // Verify directly in MongoDB 'user' collection
    const mongoUser = await db.collection("user").findOne({ email: testEmail });
    assert.ok(mongoUser, "User must exist in MongoDB 'user' collection");
    assert.equal(mongoUser.email, testEmail);
    assert.equal(mongoUser.role, "student");
  });

  test("3. Duplicate email registration is safely rejected", async () => {
    await assert.rejects(
      async () => {
        await auth.api.signUpEmail({
          body: {
            name: "Duplicate User",
            email: testEmail,
            password: "StrongPassword123!",
          },
        });
      },
      (err) => {
        assert.ok(err, "Duplicate signup should throw an error");
        return true;
      }
    );
  });

  test("4. Public signup cannot self-assign 'admin' role", async () => {
    const privilegeEmail = `admin_attempt_${Date.now()}@campuseats.test`;
    const res = await auth.api.signUpEmail({
      body: {
        name: "Hacker Attempt",
        email: privilegeEmail,
        password: "StrongPassword123!",
        role: "admin", // Public attempt to gain admin
      },
    });

    assert.notEqual(
      res.user.role,
      "admin",
      "Public signup must NEVER be assigned admin role"
    );
    assert.equal(res.user.role, "student", "Role should be safely defaulted to student");
  });

  test("5. Login with valid credentials creates server-recognized session and signed cookie", async () => {
    const response = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: "StrongPassword123!",
      },
      asResponse: true,
    });

    assert.equal(response.status, 200, "Sign in should return status 200");
    const setCookie = response.headers.get("set-cookie");
    assert.ok(setCookie, "Sign in should return a signed set-cookie header");
    cookieHeader = setCookie;

    const data = await response.json();
    assert.ok(data.token, "Sign in response body should contain token");
    assert.equal(data.user.email, testEmail);

    // Verify session was persisted in MongoDB 'session' collection
    const mongoSession = await db.collection("session").findOne({ token: data.token });
    assert.ok(mongoSession, "Session must exist in MongoDB 'session' collection");
    assert.equal(String(mongoSession.userId), String(createdUserId));
  });

  test("6. Login with invalid password fails safely", async () => {
    await assert.rejects(
      async () => {
        await auth.api.signInEmail({
          body: {
            email: testEmail,
            password: "WrongPassword999!",
          },
        });
      },
      (err) => {
        assert.ok(err, "Invalid password must be rejected");
        return true;
      }
    );
  });

  test("7. Authoritative session verification via headers returns valid user and role", async () => {
    assert.ok(cookieHeader, "Must have active cookie header from sign-in");
    const headers = new Headers();
    headers.set("cookie", cookieHeader);

    const verified = await auth.api.getSession({ headers });
    assert.ok(verified, "getSession should find active session via cookie header");
    assert.equal(verified.user.email, testEmail);
    assert.equal(verified.user.role, "student");
  });

  test("8. Logout invalidates server session in MongoDB", async () => {
    assert.ok(cookieHeader, "Must have cookie header to logout");
    const headers = new Headers();
    headers.set("cookie", cookieHeader);

    await auth.api.signOut({ headers });

    // Verify session lookup now returns null
    const checkAfterSignOut = await auth.api.getSession({ headers });
    assert.equal(checkAfterSignOut, null, "Session must be null after signOut");
  });

  test("9. Server-side role authorization guard (requireRole)", () => {
    const studentUser = { id: "u1", role: ROLES.STUDENT };
    const ownerUser = { id: "u2", role: ROLES.SHOP_OWNER };
    const adminUser = { id: "u3", role: ROLES.ADMIN };

    // Student trying to access shop_owner route -> Forbidden (status 403)
    const denied = requireRole(studentUser, [ROLES.SHOP_OWNER]);
    assert.ok(denied, "Student should be denied shop_owner access");
    assert.equal(denied.status, 403);

    // Shop owner accessing shop_owner route -> Allowed (null error response)
    const allowed = requireRole(ownerUser, [ROLES.SHOP_OWNER]);
    assert.equal(allowed, null, "Shop owner should be allowed shop_owner access");

    // Admin accessing any route -> Always allowed (null error response)
    const adminAllowed = requireRole(adminUser, [ROLES.RIDER]);
    assert.equal(adminAllowed, null, "Admin should be allowed across roles");
  });

  test("10. Server-side IDOR Ownership check (assertOwnership)", () => {
    const studentUser = { id: "student-100", role: ROLES.STUDENT };
    const adminUser = { id: "admin-999", role: ROLES.ADMIN };

    assert.equal(assertOwnership("student-100", studentUser), true, "Owner accessing own resource");
    assert.equal(assertOwnership("student-200", studentUser), false, "Student accessing another student's resource");
    assert.equal(assertOwnership("student-200", adminUser), true, "Admin has audited override");
  });
});
