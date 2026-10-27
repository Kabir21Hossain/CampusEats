# CampusEats — Connection Audit & Architecture Status

**Audit Date:** October 2026  
**Repository:** `campuseats`  
**Execution Environment:** Next.js 16.4.2 App Router, React 19, JavaScript (No TypeScript), MongoDB 7.x, Better Auth 1.7.x, HeroUI + Tailwind CSS v4, Nodemailer.

---

## 1. Executive Summary

This document audits the CampusEats platform codebase in accordance with `checkConnection.md`, `plan.md`, and `architecture.md`. It evaluates existing integrations, identifies missing or refactored pieces, details the unified architecture, and documents the required environment configurations and external dependencies.

---

## 2. Architecture & Backend Location

- **Chosen Architecture:** **Separated Express.js Backend + Next.js App Router Frontend** (with dual support for unified serverless deployment).
  - **Standalone Backend (`backend/`)**: A dedicated Express.js REST API service with native MongoDB pooling, Better Auth session guards, rate-limiting (`express-rate-limit`), security headers (`helmet`), Nodemailer email service, atomic rider claim transitions, and safe database seeder.
  - **Frontend Layer (`campuseats/`)**: Next.js 16 App Router interface styled with HeroUI and Tailwind CSS v4, guarded by `src/proxy.js`. Also contains mirrored Next.js Route Handlers (`src/app/api/...`) for 1-click full-stack Vercel deployment.
  - **Data Persistence:** Authoritative MongoDB database layer accessed via official MongoDB driver (`mongodb`) with collections: `users`, `shops`, `menuItems`, `orders`, `shopApplications`, `riderProfiles`, `disputes`, `notifications`.
  - **Authentication & Session Authority:** Better Auth (`better-auth`) configured with `@better-auth/mongo-adapter`.
    - Sessions are managed authoritatively via server-stored sessions in MongoDB.
    - **No custom JWT generation or decoding is used.** Server handlers verify active Better Auth sessions and cookies.
- **Navigation Guard vs. API Security:**
  - `src/proxy.js` acts solely as an **early navigation guard** (Next.js 16 App Router proxy convention) for browser redirects.
  - **Every backend Route Handler independently authorizes each request** using `requireSession(request)` and `requireRole(session, ...roles)` to guarantee defense-in-depth and prevent IDOR attacks.

---

## 3. Canonical Role Normalization

CampusEats strictly operates with four canonical roles:
1. `student`: Campus student placing meal orders to dormitory halls.
2. `shop_owner`: University food court or canteen manager.
3. `rider`: Verified student delivery partner with campus bicycle/foot access.
4. `admin`: University administration overseeing shops, disputes, and users.

Any unauthenticated user or unknown role is treated as `visitor` with restricted public-only access.

---

## 4. Environment Variables Audit

| Variable | Usage / Component | Required in Production | Default / Fallback |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Next.js runtime mode | Yes (`production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb://localhost:27017/campuseats` |
| `MONGODB_DB` | MongoDB database name | Yes | `campuseats` |
| `BETTER_AUTH_SECRET` | Better Auth session encryption key | Yes (min 32 chars) | Handled via dev secret if unset |
| `BETTER_AUTH_URL` | Canonical server base URL | Yes | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Client API base | Optional | `http://localhost:3000` |
| `NEXT_PUBLIC_CURRENCY` | Currency code | No | `BDT` (৳) |
| `SENDMAIL_PATH` | Backend path to a sendmail-compatible executable | Optional | `sendmail` resolved on `PATH` |
| `EMAIL_FROM` | Sender header display | Optional | `"CampusEats <no-reply@campuseats.edu.bd>"` |

> [!IMPORTANT]
> `.env.example` contains **placeholders only**. Real credentials and tokens must never be committed to Git. `.env.local` is ignored in `.gitignore`.

---

## 5. Implementation Status of Requirements

| Requirement Area | Status | Implementation Details |
| :--- | :--- | :--- |
| **MongoDB Driver & Collections** | **Verified** | `src/lib/db.js` initializes connection pool, collection indexing, and non-destructive seeding. |
| **Better Auth Integration** | **Verified** | `src/lib/auth.js` + `/api/auth/[...all]/route.js` handling signup, signin, session query, and logout. |
| **Route Protection & proxy.js** | **Verified** | `src/proxy.js` for early route redirects; server-side `src/lib/auth-server.js` for Route Handler guards. |
| **Role Isolation Matrix** | **Verified** | Documented in `docs/route-authorization-matrix.md`. |
| **Atomic Rider Claim** | **Verified** | Uses MongoDB conditional update `ordersCol.updateOne({ id, riderUserId: null, status: 'confirmed' }, ...)` preventing race conditions. |
| **Rider Pickup Dual-Email** | **Verified** | `src/lib/email/mailer.js` sends distinct notifications to both Customer and Shop Owner loaded from trusted database records. |
| **Attachments Security** | **Verified** | Whitelist-only MIME types, safe filename sanitizer, size limits, and access verification. |
| **Health Check Endpoint** | **Verified** | `GET /api/health` reports status, database connectivity, and uptime without leaking secrets. |
| **Strict JSON Seed Files** | **Verified** | Validated strict JSON seed data in `docs/mongodb/`. |
| **API Examples** | **Verified** | Request & response schemas in `docs/api-examples/`. |

---

## 6. External Blockers & Owner Action Required

1. **Production MongoDB Cluster:** Provide connection string `MONGODB_URI` for production MongoDB Atlas / server.
2. **Production mail delivery:** Install and configure a sendmail-compatible local MTA on the backend host. The app does not provide a fake success response when the executable is unavailable.
3. **Better Auth Secret:** Owner must generate a 32+ character high-entropy secret (`openssl rand -base64 32`) and set `BETTER_AUTH_SECRET` in production.
