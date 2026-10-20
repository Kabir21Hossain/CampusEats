# CampusEats — Final Backend Connection & Production-Readiness Checklist

## Mission

Inspect the existing CampusEats repository and finish the real application integration—not just write a plan. Verify frontend/backend connectivity, MongoDB, Better Auth authentication, server-side authorization, `src/proxy.js`, role isolation, JSON seed data and API examples, Nodemailer email/attachments, tests, and safe GitHub delivery.

### Fixed project constraints

- JavaScript only. Do not introduce TypeScript.
- Next.js App Router, HeroUI + Tailwind, and the existing architecture.
- Better Auth + MongoDB-backed sessions.
- Use authoritative Better Auth session/session-token verification. **Do not implement custom JWT authentication.**
- `src/proxy.js` is an early navigation guard only; every backend/API operation must independently authorize the request.
- Roles: `student`, `shop_owner`, `rider`, `admin`.
- Follow `plan.md` and `architecture.md` as the product/architecture source of truth. Inspect the actual repository before making assumptions.

## 1. Non-negotiable rules

1. Audit the repository, package scripts, current routes, auth, database, `.env.example`, `.gitignore`, Git status/remotes, `plan.md`, and `architecture.md` before editing.
2. Complete implementation, wire it into the real UI, run tests/build, and fix failures. No placeholder-only work, fake successful authentication, or silently mocked production APIs.
3. Do not overwrite existing `.env`/`.env.local`, delete user data, force-push, reset shared history, or stage unrelated changes.
4. Never print secrets or include them in source control. `.env.example` must contain **placeholders only**. If it currently contains real secrets, replace them with placeholders and tell the owner to rotate those credentials; assume exposed secrets are compromised.
5. Never fabricate MongoDB, SMTP, OAuth, payment, deployment, or GitHub credentials. Implement what can be implemented and list exact owner-only blockers.
6. Do not claim production readiness or a GitHub push unless there is evidence from completed commands.
7. Do not manually insert Better Auth passwords/sessions as a substitute for the actual Better Auth signup flow.
8. Make progress without asking for information already present in the repository. Ask only for a truly missing external value/permission, after completing independent work.

## 2. Audit and architecture

- Read `plan.md` and `architecture.md` fully. Inspect the app structure and existing implementation before deciding whether the backend is Next.js Route Handlers/server actions or a separate Express service.
- Follow the documented architecture; do not add a second competing backend or duplicate Better Auth configuration.
- Create `docs/connection-audit.md` documenting existing integrations, missing/broken pieces, chosen architecture, environment variables needed, and external blockers.
- Use canonical role values `student`, `shop_owner`, `rider`, `admin`. If existing stored values differ, implement a safe documented normalization/migration.
- Use a centralized service/repository/auth boundary consistent with the existing architecture.

## 3. Environment files and setup prompts

Inspect every variable in `.env.example` and find its code usage. Keep `.env.example` tracked with placeholders only; ensure `.env` and `.env.*` are ignored except `.env.example`. Check whether secret files are already tracked and do not re-commit them.

Create `.env` (or `.env.local` if that is the established framework convention) **only if it does not already exist**. Never overwrite a user's existing local environment file. If it exists, preserve it and report missing variable names only. Validate required variables at startup without printing their values.

Use only variables the actual implementation needs. This is an illustrative template to reconcile with the code, not a source of real credentials:

```dotenv
NODE_ENV=development
# Include PORT only if the selected backend actually needs it.
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
MONGODB_DB=campuseats
BETTER_AUTH_SECRET=<generate-a-long-random-secret>
BETTER_AUTH_URL=http://localhost:3000
# Only if a separate API service is used:
# FRONTEND_URL=http://localhost:3000
# API_BASE_URL=http://localhost:3001
# CORS_ORIGIN=http://localhost:3000
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-username>
SMTP_PASS=<smtp-password-or-app-password>
EMAIL_FROM="CampusEats <no-reply@example.com>"
```

Do not put real secrets in the template, examples, docs, prompts, tests, or Git. Generate a secure random `BETTER_AUTH_SECRET`; never use a sample value in production. Do not expose server secrets via public environment prefixes.

Document safe copy commands:

**macOS/Linux/Git Bash**
```bash
test -f .env || cp .env.example .env
```

**Windows PowerShell**
```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

**Windows Command Prompt**
```bat
if not exist .env copy .env.example .env
```

If the project uses `.env.local`, consistently substitute that filename. Explain that the owner must fill required values locally; do not ask them to paste secrets into chat.

## 4. Better Auth and session verification

- Use the installed version's supported Better Auth API and official MongoDB adapter; check installed docs/version rather than guessing API signatures.
- Use one reusable MongoDB connection and the supported Better Auth handler. Keep auth-managed user/session/account/verification records under Better Auth's control.
- Implement actual sign-up, sign-in, sign-out, current-session retrieval, expiry/revocation handling, and protected requests.
- Use secure HttpOnly cookies and correct production `Secure`, `SameSite`, trusted-origin, and cookie settings. Do not put tokens in `localStorage`, URLs, logs, or error responses.
- Do not create custom JWTs or authenticate by decoding a token. Each protected server operation must validate the live session with the authoritative Better Auth server/session store.
- If a separate Express backend exists, create shared authentication middleware that validates the active Better Auth session and attaches only a minimal trusted identity to `req.user`. Use supported cookie/session verification. If a separate service truly requires a bearer token, send it only over HTTPS in the Authorization header and validate it against the authoritative session source on every request. Never accept a user ID/role from the request body as identity.
- If all backend routes are Next.js Route Handlers/server actions, create reusable server-side `requireSession`/`getCurrentUser` helpers and call them from every protected operation.
- Missing/invalid/expired sessions return `401`; authenticated but disallowed requests return `403`. API clients receive JSON errors, not HTML redirects.
- Never return password hashes, verification tokens, session tokens, or provider secrets.
- Public signup must not permit a user to choose privileged roles. Student signup may be public if the product spec says so. Shop owner and rider privileges require the specified verified application/approval flow. Admin is never self-selectable and must use a deliberate, owner-controlled bootstrap process; never create a default public admin password.

## 5. `src/proxy.js` and exhaustive authorization

Use the exact installed Next.js version's supported `proxy.js` convention and signature. Do not blindly copy legacy `middleware.js` examples.

- Proxy performs lightweight early page navigation checks and safe redirects; it must not be treated as the security boundary or perform database writes.
- Protect server-rendered pages/layouts and all backend routes independently. Avoid rendering private data before redirecting.
- Keep public pages, sign-in/sign-up, verification, required static assets, and framework internals accessible.
- Centralize `requireSession`, `requireRole(...roles)`, resource ownership checks, and state-transition checks.
- Never trust role values from client state, localStorage, editable cookies, request bodies, or hidden navigation links.
- Default deny for unknown/suspended roles and unapproved shop owners/riders.
- Check IDOR: changing an order, shop, user, notification, or dispute ID must not expose or mutate another user's data.
- Enumerate every page, Route Handler, server action, and backend endpoint. Create `docs/route-authorization-matrix.md` with method/path, public or protected, allowed roles, ownership constraints, and test case. No route is done until classified.

Minimum role policy:

| Resource/action | Student | Shop owner | Rider | Admin |
|---|---|---|---|---|
| Public discovery/menu | Allow | Allow | Allow | Allow |
| Checkout and own orders | Own only | Deny | Deny | Audited support access only |
| Owner dashboard/menu | Deny | Own shop only | Deny | Admin tools only |
| Accept/prepare/ready shop orders | Deny | Own shop orders only | Deny | Audited support access only |
| Available/assigned deliveries | Deny | Deny | Eligible/assigned only | Admin tools only |
| Claim/pickup/deliver | Deny | Deny | Eligible/assigned only | Audited override only |
| Global approvals/disputes/settings | Deny | Deny | Deny | Allow |
| Financial/escrow mutations | No direct mutation | No direct mutation | No direct mutation | Server-controlled and audited only |

Adapt to the actual product requirements, but document every exception. A role check alone is insufficient: verify resource ownership and current resource state on every request.

## 6. MongoDB setup, collections, indexes, and JSON data

Implement real database access, application models/repositories, validation, indexes, health checks, and a repeatable **non-destructive** seed process. Use UTC timestamps, server-generated IDs, integer minor units for money, and transactions for multi-document order/financial changes when supported by the deployment. Never let the client mutate balances, escrow, commission, or payment state.

Create a documented folder such as `docs/mongodb/` with:

- `collections-and-indexes.md` — collection purpose, ownership rules, indexes, retention/privacy notes.
- `shops.seed.json`
- `menuItems.seed.json`
- `userProfiles.seed.json` — demo profiles only, no passwords/tokens/real personal data.
- `shopApplications.seed.json` if used.
- `riderProfiles.seed.json` if used.
- `orders.seed.json` — valid references/statuses; must not trigger real email or payments.
- `notifications.seed.json`
- `ratings.seed.json` and `disputes.seed.json` if those features exist.
- `seed-manifest.json` — schema version, seed order, development-only flags.

All `.json` files must be valid strict JSON: no comments, trailing commas, `ObjectId(...)`, or JavaScript expressions. Keep ID types consistent and provide a seed script to convert IDs if needed. The seed command must be idempotent, avoid deleting/overwriting real data, and refuse to run against a production environment unless explicitly designed and safely authorized.

**Do not manually insert Better Auth sessions, passwords, accounts, or verification tokens.** Better Auth owns those records. If demo login accounts are required, use a safe script that calls supported Better Auth APIs or a documented signup flow; never hand-write password hashes.

Also create `docs/api-examples/` with a request/response example for **every implemented backend route**. Each example must state method, path, authentication requirement, allowed role, exact JSON body schema, success response, and typical `400`, `401`, `403`, `404`, and `409` errors where applicable. Use placeholders such as `{{SESSION_COOKIE}}`, `{{ORDER_ID}}`; never include real tokens. Cover Better Auth flows, profiles, discovery, checkout/orders, owner operations, rider claim/pickup/delivery, notifications, payments/webhooks, QR, ratings/disputes, admin operations, and health routes only where implemented. Keep examples grounded in actual validation schemas. JSON payload examples do not themselves create a backend; implement the handlers, business rules, and tests in code.

## 7. Order lifecycle and rider claim

Follow `plan.md` and `architecture.md`; do not silently change commission, cancellation, escrow, QR expiry, or other business rules. Verify the currently agreed values before implementing.

- Student reads only their orders; shop owner reads/manages only their shop's orders; rider reads eligible or assigned orders only.
- Rider claim must be atomic so two riders cannot claim the same order. Use a conditional update/transaction checking that the order is still eligible and unassigned.
- Persist the assignment/status first, then enqueue notifications. Make retries idempotent.
- Distinguish `assigned/claimed`, `picked_up`, and `delivered` when these are separate events. Do not send a pickup email merely because a rider claimed an order unless the defined state machine explicitly equates them.
- On the actual `picked_up` event, send separate notifications to the customer and the relevant shop owner using email addresses loaded from trusted database records.
- Do not disclose other customers' data, unnecessary contact details, payment secrets, or internal records.
- Validate every state transition server-side and maintain an audit trail. Never trust frontend price, payment status, escrow release, commission, or rider assignment.

## 8. Nodemailer and safe attachments

Implement a centralized reusable Nodemailer service (for example, `src/lib/email/mailer.js`) using environment-configured SMTP. Follow the existing architecture and avoid a new competing mail subsystem.

Required templates/events, as applicable to the product:

- Account verification/password recovery only when the auth flow supports it.
- Order placed/confirmed.
- Shop accepted/rejected/ready.
- Rider assigned/claimed.
- Rider picked up order.
- Delivery completed.
- Cancellation/refund/dispute update.

For rider pickup, send distinct emails to:
1. the student/customer who placed the order; and
2. the owner of the shop that prepared it.

Include a minimal order summary, current status, timestamp, and next step. Fetch recipients from trusted persisted profiles; never accept arbitrary `to` addresses from an unauthenticated client. Use a fixed verified sender and prevent header injection. Sanitize/escape user content in HTML templates.

Attachments must be an authorized feature, not an arbitrary file-send endpoint:
- Prefer generated receipts/invoices or short-lived authorized download links.
- Allow only known attachment types/templates, enforce MIME/content validation, file-size limits, safe filenames, and authorized storage origins.
- Prevent path traversal, arbitrary local-file reads, unsafe remote URL fetching, and arbitrary recipient/header control.
- If user-uploaded attachments are required, add upload authorization, storage validation, malware scanning where available, retention controls, and audit logs.
- Do not attach sensitive documents by default; send only what the recipient is permitted to see.
- Add test/preview mode. Tests and seeding must not send real email.
- Use retry/backoff/outbox or queue patterns where available. Email failure must not roll back a valid order transition. Do not claim an email was delivered when SMTP is unconfigured or the provider has not confirmed it.
- Log delivery outcomes without logging credentials, message secrets, session tokens, or sensitive attachment content.

## 9. Frontend/backend connection

- Replace production-path mock auth/data with real service calls. Any demo fallback must be explicit, development-only, and never disguise a backend failure.
- Centralize API calls and use the actual backend base URL only if the backend is separate.
- Configure exact CORS origins and credential behavior for the chosen architecture; never use wildcard CORS with credentials.
- Implement accessible validation, loading, empty, success, network error, `401`, `403`, and server error states.
- Do not expose server-only env values in browser bundles.
- Add a safe readiness/health endpoint without URI, secrets, stack traces, or private topology.
- Add integration tests for signup → sign-in → session → protected route → cross-role denial → sign-out.

## 10. Security and production hardening

Implement and test relevant controls: server-side schema validation; rate limiting for auth/email/checkout/QR; CSRF protections appropriate to the cookie architecture; secure headers/CSP where practical; HTTPS and trusted origins in production; strict CORS; safe redirects; redacted structured logs; webhook signature verification and idempotency; immutable/audited financial ledger; upload size/content validation; personal-data retention/deletion rules; dependency audit review; and documented backups, monitoring, migration/index setup, and rollback.

Do not use real payment credentials or real money in development. Use sandbox configuration required by the existing plan. Never log cookies, authorization headers, passwords, SMTP passwords, payment secrets, or full database URIs.

## 11. Tests and evidence

Add/update tests for:

- Required env keys and secret-redaction behavior.
- MongoDB connection, indexes/health, idempotent seed.
- Signup, signin, session retrieval, signout, expired/revoked session.
- All four roles and direct navigation/API denial.
- IDOR attempts across users, shops, orders, notifications, disputes.
- Unapproved owners/riders and unknown/suspended roles.
- Competing rider claims and valid/invalid order transitions.
- Duplicate event/idempotency behavior.
- Email recipient selection for rider pickup (customer + shop owner), template escaping, attachment allowlist/size/type rejection.
- No real email/payment sent by tests or seed scripts.

Use an isolated test database and test-only credentials. Run the package manager's existing install/build/lint/unit/integration/E2E commands as applicable. Fix introduced failures. Document unrelated existing failures with command output/evidence; do not hide them.

## 12. GitHub safety and delivery

- Inspect branch, `git status`, remotes, staged files, and secret-file tracking first.
- Do not expose credential-bearing remote URLs.
- Ensure `.env`, `.env.local`, `.env.*` except `.env.example`, private keys, dumps, uploads, build output, and test credentials are not committed.
- Review the staged diff and scan for secret-like values. Stage only intended changes.
- Do not overwrite others' work, force-push, reset shared history, or stage unrelated files.
- Commit with a descriptive message such as:
  `feat: complete auth, role authorization, backend integration, and email notifications`
- Push only to the verified intended branch after checks. If no remote/credentials/permission is available, finish local work and give the exact owner action needed. Do not claim success unless Git confirms the push.
- Report branch and commit hash, never credential-bearing URLs.

## 13. Definition of done

- [ ] Existing project, `plan.md`, and `architecture.md` audited.
- [ ] `.env.example` is placeholder-only; local env creation does not overwrite existing files.
- [ ] MongoDB connection, indexes, health check, and safe seed process work.
- [ ] Better Auth signup/signin/signout/session retrieval work with MongoDB.
- [ ] Session verification uses authoritative Better Auth session data; no custom JWT.
- [ ] `src/proxy.js` protects page navigation, and server/backend authorization remains mandatory.
- [ ] Every page/API/server action is listed in the route authorization matrix.
- [ ] Automated tests deny cross-role, cross-user, and IDOR attempts.
- [ ] Real frontend/backend integration works; mock mode is explicit and development-only.
- [ ] Rider claim is atomic; order state transitions are validated.
- [ ] Pickup email goes to both the customer and shop owner from trusted database records.
- [ ] Attachments are permission-checked and validated.
- [ ] JSON seed data and every implemented API's request/response examples are valid and documented.
- [ ] Lint, tests, and production build pass, or blockers are precisely recorded.
- [ ] Git diff has no secrets or unrelated changes.
- [ ] Correct GitHub branch is pushed, or the exact external blocker is documented.
- [ ] `docs/connection-audit.md`, `docs/route-authorization-matrix.md`, `docs/mongodb/`, and `docs/api-examples/` match the actual implementation.

## 14. Required final report to owner

Report:
1. Architecture and backend location.
2. Files created/changed.
3. Exact safe environment setup commands and **variable names only** needing owner values.
4. MongoDB database/collections/indexes/seed command.
5. Auth/session verification design.
6. Route authorization matrix and cross-role test results.
7. Email templates, pickup recipients, attachment safeguards, and whether real SMTP delivery was tested.
8. Build/lint/test commands and actual pass/fail results.
9. Git branch, commit hash, push result, or exact blocker.
10. Remaining risks and owner-only setup steps.

Separate **Verified**, **Implemented but requires owner credentials**, **Not completed**, and **Owner action required**. Do not print secrets. If a real secret is found in `.env.example` or Git history, say it must be rotated; do not reproduce it.
