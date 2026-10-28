# CampusEats — Production Deployment & Vercel Readiness Guide

Assalamu Alaikum. This guide contains complete, step-by-step instructions to take CampusEats from local development to a secure, production-ready system deployed on **Vercel** and connected with **MongoDB Atlas**, **Better Auth**, and optional local sendmail email delivery.

---

## 1. System Architecture Overview

```
                      +---------------------------------------+
                      |       Next.js 16 (App Router)         |
                      |   Hosted on Vercel / Cloud Edge       |
                      | - HeroUI + Tailwind Modern Interface  |
                      | - Role Navigation Guards (proxy.js)   |
                      +---------------------------------------+
                                     |         |
                  API Calls (REST)   |         | Direct DB / Auth
                                     v         v
+-------------------------------+         +----------------------------------+
|    Express.js Backend API     |         |         MongoDB Atlas            |
| (Render / Railway / VPS / VM) |<------->| (Managed Cloud Document DB)      |
| - Atomic Rider Order Claim    |         | - Collections: users, shops,     |
| - Best-effort Nodemailer Pickup Mail |         |   menuItems, orders, ledger      |
| - IDOR Guard & Escrow Ledger  |         +----------------------------------+
+-------------------------------+                          ^
               |                                           |
               v                                           |
+-------------------------------+                          |
| Local sendmail MTA (optional) |                          |
| - Customer & Shop Owner Alert |--------------------------+
+-------------------------------+
```

CampusEats uses the Express API as its canonical browser-facing application
backend. The Next.js application is the UI and calls that API through
`NEXT_PUBLIC_API_BASE_URL`.

1. **Separated Architecture (Supported)**:
   - **Frontend**: Next.js App Router deployed on **Vercel**.
   - **Backend**: Express.js REST API deployed on **Render** / **Railway** / **Fly.io** (or an Ubuntu VPS).
   - **Database**: MongoDB Atlas M0 (Free) or M10 Cluster.

The overlapping `src/app/api/*` Next.js Route Handlers are legacy paths and
are not a complete or parity-tested substitute for the Express API. Do not
deploy them as an alternate application backend or point clients at them for
financial, delivery, or administrative workflows. Retire or reconcile those
handlers before changing this source-of-truth boundary.

---

## 2. Prerequisites & Accounts

Before deploying, ensure you have:
1. A **GitHub** account with this repository pushed.
2. A **Vercel** account ([vercel.com](https://vercel.com)) linked to your GitHub.
3. A **MongoDB Atlas** account ([mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)).
4. For email delivery, a backend host with a configured sendmail-compatible local mail transfer agent (MTA).

---

## 3. Step 1: MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a free **M0 Cluster** (choose AWS / Frankfurt or Singapore for low latency to Bangladesh).
3. **Configure Database User**:
   - Navigate to **Security** -> **Database Access**.
   - Click **Add New Database User**.
   - Choose **Password Authentication**.
   - Set Username (e.g., `campuseats_admin`) and generate a secure password.
   - Assign Role: **Read and write** on the specific `campuseats` database only.
4. **Configure Network Access**:
   - Navigate to **Security** -> **Network Access**.
   - Prefer a private endpoint or the hosting provider's documented static egress addresses.
   - Do not allow `0.0.0.0/0` by default. If a deployment requires it because outbound IPs are dynamic, treat it as a documented risk and use a database account with access only to the CampusEats database.
5. **Copy Connection String**:
   - Go to **Deployments** -> **Database** -> Click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy URI:
     `mongodb+srv://campuseats_admin:<password>@cluster0.xxxxx.mongodb.net/campuseats?retryWrites=true&w=majority`

---

## 4. Step 2: Environment Variables Reference

Create a local `.env` or `.env.local` by copying `.env.example`.

### Windows PowerShell:
```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

### Git Bash / Linux / macOS:
```bash
test -f .env || cp .env.example .env
```

### Required Variable Values:
| Variable Name | Sample / Purpose | Where to get it |
|---|---|---|
| `NODE_ENV` | `production` | Set to `production` on Vercel |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/campuseats?retryWrites=true&w=majority` | MongoDB Atlas Connection String |
| `MONGODB_DB` | `campuseats` | Your chosen database name |
| `BETTER_AUTH_SECRET` | 32+ character random secret | Generate using: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Frontend origin in Next.js; backend origin in Express | Canonical origin serving Better Auth |
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-api-domain.example/api` | Deployed Express API URL; embedded at frontend build time |
| `FRONTEND_URL` | `https://your-domain.example` | Exact browser origin allowed by the Express API |
| `PORT` | Platform-assigned port or `5000` locally | Express backend only |
| `SENDMAIL_PATH` | `sendmail` on `PATH` | Optional path to a sendmail-compatible executable on the backend host |
| `EMAIL_FROM` | `"CampusEats <no-reply@campuseats.edu.bd>"` | Sender header |

Use the same `MONGODB_URI`, `MONGODB_DB`, and `BETTER_AUTH_SECRET` for both
server deployments. Keep `BETTER_AUTH_URL` specific to each server: the
Next.js origin for the frontend deployment and the Express origin for the API.
Only `NEXT_PUBLIC_API_BASE_URL` is public; never prefix database credentials
or authentication secrets with `NEXT_PUBLIC_`.

> [!IMPORTANT]
> To generate a secure `BETTER_AUTH_SECRET` in PowerShell:
> ```powershell
> -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 36 | ForEach-Object {[char]$_})
> ```

---

## 5. Step 3: Seeding Database Safely

The database contains an automated, idempotent seeder that populates campus restaurants, menus, demo profiles, and sample delivery data without deleting existing data.

Run the seeder from the `backend/` directory:
```powershell
cd backend
npm run seed
```

Output:
```
=========================================
     CampusEats Safe Database Seeder     
=========================================
[Seeder] Loaded manifest v1.0.0: CampusEats Seed Manifest
[MongoDB] Connected successfully to database: campuseats
[Seeder] Collection 'users': 7 documents verified/upserted.
[Seeder] Collection 'shops': 3 documents verified/upserted.
[Seeder] Collection 'menuItems': 6 documents verified/upserted.
[Seeder] Collection 'riderProfiles': 2 documents verified/upserted.
[Seeder] Collection 'orders': 3 documents verified/upserted.
=========================================
 [Seeder] Database seeding completed successfully!
=========================================
```

---

## 6. Step 4: Deploying the Next.js Frontend to Vercel

1. **Import Project into Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) -> Click **Add New...** -> **Project**.
   - Select your `CampusEats` GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default or select `campuseats`)
   - **Build Command**: `next build`
   - **Install Command**: `npm install`
4. **Add frontend environment variables** in the Vercel **Environment Variables** panel:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` (the Next.js frontend origin, `https://<your-project>.vercel.app`)
   - `NEXT_PUBLIC_API_BASE_URL` (the deployed Express API origin followed by `/api`)
5. **Click Deploy**:
   - Vercel builds the frontend. `NEXT_PUBLIC_API_BASE_URL` is embedded at build time, so redeploy after changing it.
   - Once deployment completes, your project will be live at `https://your-project.vercel.app`!

---

## 7. Step 5: Deploying the Canonical Express Backend

Deploy the Express API as a separate service. The frontend's
`NEXT_PUBLIC_API_BASE_URL` must point to this service; it is required for the
documented browser-to-API flow.

### Option A: Render.com (Free Web Service)
1. Sign in to [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your repository.
4. Set:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables in the Render dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL=https://<your-api-domain>`
   - `FRONTEND_URL=https://your-project.vercel.app`
   - `PORT` (use the platform-provided value if required by the host)
6. Click **Create Web Service**.

### Option B: Railway.app
1. Create a new project from your GitHub repo.
2. Select `backend` subdirectory.
3. Add environment variables.
   Configure the same backend variables listed for Render, including the API
   origin in `BETTER_AUTH_URL` and the frontend origin in `FRONTEND_URL`.
4. Railway generates an instant HTTPS endpoint (e.g. `https://campuseats-backend.up.railway.app`).

---

## 8. Role-Based Access Control Verification

| Role | Portal URL | Protected Routes | Allowed Actions |
|---|---|---|---|
| **Student** | `/student/home` | `/student/*` | Browse food stalls, place orders, make escrow payments, track delivery with delivery code. |
| **Shop Owner** | `/shop-owner/dashboard` | `/shop-owner/*` | Manage shop menu, accept incoming orders, mark food "Ready for Pickup". |
| **Rider** | `/rider/available-orders` | `/rider/*` | Claim available orders atomically, verify kitchen pickup (triggers dual email), complete delivery via code. |
| **Admin** | `/admin/overview` | `/admin/*` | View platform gross volume, manage registered users, resolve order disputes, audit escrow ledger. |

### Security Guarantees:
- **Navigation Guard**: `src/proxy.js` intercepts unauthorized attempts and redirects users to their appropriate portal.
- **Server Guard**: Every backend endpoint calls `requireSession` and `requireRole`, preventing direct API manipulation or IDOR attacks.
- **Atomic Claim**: Riders use atomic database operations (`findOneAndUpdate`) preventing double claiming.
- **Financial transactions**: Wallet, ledger, and payout mutations require MongoDB transactions; deploy MongoDB as a replica set or sharded cluster.
- **Rate limits**: API request limits use in-process memory by default. Configure a shared rate-limit store before relying on them across multiple backend instances.

---

## 9. Troubleshooting & FAQ

### Q1: MongoDB Connection Timeout on Vercel?
- **Cause**: IP restriction on MongoDB Atlas.
- **Fix**: Open MongoDB Atlas -> **Network Access** -> Ensure `0.0.0.0/0` is active.

### Q2: Authentication cookies not persisting across domains?
- **Fix**: When using separate frontend and backend domains:
  - Ensure CORS has `credentials: true`.
  - In production, cookies must have `SameSite: "none"` and `Secure: true`.
  - Or deploy both under the same root domain with subdomains (`app.campuseats.com` and `api.campuseats.com`).

### Q3: How to test Nodemailer email delivery?
- Install and configure a sendmail-compatible local mail transfer agent on the backend host. Without its executable, email endpoints return `SENDMAIL_UNAVAILABLE`; the application does not simulate successful delivery.

---

May Allah bless your project and make it a tremendous success!
