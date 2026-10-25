# Frontend/backend integration

The frontend calls the Express API directly. Set this in `.env.local` and restart Next.js:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

For Vercel, set `NEXT_PUBLIC_API_BASE_URL` in the **frontend** project's environment variables to one deployed backend URL followed by `/api` (for example, `https://campuseats-api.vercel.app/api`). Do not put shell fallback expressions such as `http://localhost:5000/api || https://.../api` in this variable; environment values are literal strings, not shell expressions. This value is embedded in the frontend at build time, so redeploy after changing it. Production builds fail clearly when it is missing instead of silently calling localhost.

Configure MongoDB credentials and the same `BETTER_AUTH_SECRET` (at least 32 characters) in both projects. The backend's `BETTER_AUTH_URL` is its own canonical origin (for example, `http://localhost:5000` locally); `FRONTEND_URL` must exactly match the browser origin. Any valid email address can be used for student, shop-owner, and rider accounts. First-admin signup is restricted to the exact `ADMIN_BOOTSTRAP_EMAIL` configured on the backend, requires no invitation code, and is disabled after the first admin exists. For recovery when the existing admin is inaccessible, a short-lived `ADMIN_RECOVERY_TOKEN` and `ADMIN_RECOVERY_EXPIRES_AT` can authorize one new admin account through `/admin-recovery`; this does not remove existing admins. Never prefix secrets with `NEXT_PUBLIC_`.

The browser stores its Better Auth cookie for the API origin and sends it on credentialed API requests. The frontend's role layout therefore reads the session from the API, while every protected backend endpoint independently verifies that session and the user's approval state. For production, use stable custom frontend/API domains on the same site when possible; cross-site cookie restrictions can prevent auth cookies from being sent even when CORS is configured. Restart both servers after changing local values. Check backend health at `http://localhost:5000/api/health`.

Authenticated notifications are stored in MongoDB and scoped to the signed-in user at `/api/notifications`. The frontend refreshes them every 15 seconds while the tab is visible; notification reads are persisted through `/api/notifications/:id/read` and `/api/notifications/read-all`.

If the database is empty and you want the project's sample records, run `npm run seed` from the backend project before starting the frontend.

Cookie authentication requires the backend CORS `FRONTEND_URL` to match the browser origin exactly. Set the frontend's deployed API URL in `NEXT_PUBLIC_API_BASE_URL`; set the backend's `FRONTEND_URL` to the deployed frontend origin and `BETTER_AUTH_URL` to the deployed backend origin.

Student accounts are activated immediately. Shop-owner and rider registrations create pending applications and cannot use protected backend routes until an administrator approves them. First-admin registration is restricted to the configured email; admin access to operational routes is still enforced on the backend.

The frontend and Express backend now share authenticated routes for shop-owner menu management, student order cancellation and ratings, shop-application review, and dispute resolution. Payment collection and historical dashboard charts remain integrations outside this backend.
