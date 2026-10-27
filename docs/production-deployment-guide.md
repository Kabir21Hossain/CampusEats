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

CampusEats supports two flexible deployment models:
1. **Separated Architecture (Recommended for High Scale)**:
   - **Frontend**: Next.js App Router deployed on **Vercel**.
   - **Backend**: Express.js REST API deployed on **Render** / **Railway** / **Fly.io** (or an Ubuntu VPS).
   - **Database**: MongoDB Atlas M0 (Free) or M10 Cluster.
2. **Unified Vercel Architecture**:
   - The repository already contains complete Next.js Route Handlers (`src/app/api/*`) matching the Express backend endpoints, allowing zero-friction 1-click full-stack deployment directly on Vercel!

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
   - Assign Role: **Read and write to any database**.
4. **Configure Network Access (Crucial for Vercel)**:
   - Navigate to **Security** -> **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - *Note*: Vercel serverless functions rotate IP addresses dynamically; `0.0.0.0/0` is mandatory unless using a dedicated NAT gateway.
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
| `BETTER_AUTH_URL` | `https://your-domain.vercel.app` | Your Vercel production domain |
| `NEXT_PUBLIC_APP_URL`| `https://your-domain.vercel.app` | Public frontend URL |
| `SENDMAIL_PATH` | `sendmail` on `PATH` | Optional path to a sendmail-compatible executable on the backend host |
| `EMAIL_FROM` | `"CampusEats <no-reply@campuseats.edu.bd>"` | Sender header |

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

## 6. Step 4: Deploying to Vercel (Frontend & Full-Stack)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete production ready backend, mongodb connection, and vercel deployment setup"
   git push origin main
   ```
2. **Import Project into Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) -> Click **Add New...** -> **Project**.
   - Select your `CampusEats` GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default or select `campuseats`)
   - **Build Command**: `next build`
   - **Install Command**: `npm install`
4. **Add Environment Variables**:
   In the Vercel **Environment Variables** panel, add each of the variables from Step 2:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` (Set to `https://<your-project>.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` (Set to `https://<your-project>.vercel.app`)
   - `SENDMAIL_PATH` (optional; configure on the backend host, not the frontend)
   - `EMAIL_FROM`
5. **Click Deploy**:
   - Vercel will build the frontend, optimize assets with Turbopack, and provision serverless API routes.
   - Once deployment completes, your project will be live at `https://your-project.vercel.app`!

---

## 7. Step 5: Deploying the Express Backend (Optional Microservice)

If you prefer running the separate Express backend as an always-on service:

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
   - `PORT=5000`
   - `MONGODB_URI`
   - `BETTER_AUTH_SECRET`
   - `FRONTEND_URL=https://your-project.vercel.app`
6. Click **Create Web Service**.

### Option B: Railway.app
1. Create a new project from your GitHub repo.
2. Select `backend` subdirectory.
3. Add environment variables.
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
- **Dual Notification**: Nodemailer emails both the student and the shop owner when an order is picked up.

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
