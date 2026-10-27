# CampusEats Business Workflow Repair — Antigravity Execution Prompt

## Mission

Inspect the actual CampusEats repository and implement the following workflows end to end. Do not only provide advice or mockups. Trace frontend → API → middleware → MVC controller/service → MongoDB → notifications/email, repair the implementation, test it, and report evidence.

Use the project's existing architecture docs and installed package versions. Keep Better Auth as the sole authentication authority and MongoDB as the persistent store. Keep the backend in MVC/service layers: models/repositories, controllers, routes, middleware, services, response serializers/views, background jobs, and tests. Preserve JavaScript if that is the established language. Never invent secrets, claim unverified integrations work, or make destructive changes.

## Non-negotiable rules

- All order status, payment state, rider assignment, verification codes, wallet balances, ledger entries, and notifications are authoritative in the database, not client state.
- Never trust client-submitted price, role, balance, payment status, user ID, ownership, rider assignment, or “verified” flags.
- Never treat a submitted bKash transaction reference as proof of payment. Without a real provider verification API, mark it `pending_verification` until an authorized admin checks the merchant records.
- Mock payments must be explicitly marked test-only, work only under an explicit development/test environment switch, and be rejected in production. Never show mock references as real bKash payments or allow mock funds into payouts.
- All financial changes must be immutable-ledger-backed, idempotent, auditable, and atomic where MongoDB deployment supports transactions. Prevent duplicate credits/debits, concurrent overspending, and duplicate state transitions.
- Server-side Better Auth session, role, and resource ownership checks are mandatory for every protected operation. UI hiding/proxy redirects are not security.
- Never store/log passwords, session tokens, Better Auth secrets, SMTP credentials, bKash PIN/OTP, or full private environment values. Do not commit `.env`.
- Persist the core business event before attempting email. Email failures must be retried safely and must not roll back an order transition.
- Preserve existing work and unrelated changes. Do not force-push, drop collections, or reset the repository.

---

## 1. Audit before edits

Inspect `package.json`/lockfile, existing `plan.md`, `architecture.md`, auth/MVC docs, models, routes, controllers, services, middleware, Better Auth setup, MongoDB connection, order lifecycle, rider claim/code logic, payment and wallet logic, admin/profile/upload code, notifications, Nodemailer, password reset, environment files, Git status, and tests.

Trace every flow from UI through API to database. Find mock handlers, unguarded endpoints, duplicate side effects, direct database writes in controllers, missing ownership checks, unsafe status transitions, hard-coded prices/roles, and fake payment/email success. State root causes with exact file paths, then implement fixes rather than stopping at the audit.

## 2. Order state machine and notifications

Define one canonical documented state machine, mapping existing statuses where possible. Suggested states:

`pending_shop_acceptance → accepted → preparing → ready_for_pickup → rider_assigned → picked_up → delivered`

Also define legal terminal/exception states such as `rejected`, `cancelled`, `delivery_failed`, and `refunded`. Reject illegal, repeated, skipped, or backward transitions with appropriate errors.

Required flow:
1. Student creates an order. Server recalculates prices and persists an order snapshot (shop, item name, unit price, quantity, fees, totals, student, timestamps, payment state).
2. Notify only the relevant shop owner(s) and the student.
3. Authorized shop owner accepts/rejects and updates preparation state.
4. When ready, notify eligible/active riders and expose the job.
5. Riders compete to claim. Use one atomic conditional database update; exactly one rider wins. Other concurrent claims get `409 Conflict`.
6. Persist assigned rider and timestamp; notify student, shop owner, and assigned rider.
7. Rider verifies pickup code, then order moves to `picked_up`.
8. Rider verifies delivery code, then order moves to `delivered` and eligible settlement entries are posted once.

Use separate, cryptographically secure codes:
- **Shop handover code:** shown only to the authorized shop owner; assigned rider submits it at pickup.
- **Student delivery code:** shown to the student and, only at the appropriate stage, the assigned rider. The same delivery code is displayed to both for comparison and the rider submits it for server verification.

Never reuse one code for both handovers. Use secure randomness, store hashes where feasible, limit attempts, expire/reissue with audit, invalidate after success, rate-limit verification, and never log codes. Never expose codes to other riders or unrelated users. Make code verification and status transition atomic/idempotent. Enforce student/shop/rider/admin ownership on every order API. A rider claiming a job is not the same as picking it up.

## 3. Two bKash payments and manual verification

Model two distinct payment obligations per order:

A. Food/order amount paid by student to the shop's configured bKash number, with its own transaction reference.
B. Delivery charge + platform charge paid by student to the platform's configured bKash number, with a separate transaction reference.

Store separate payment records linked to the order, with payer, payee type, configured recipient, integer amount in **paisa/poisha**, currency `BDT`, method, normalized reference, status, submit/verify timestamps, verifying admin, safe rejection reason, idempotency key, and audit metadata. Never store bKash PIN/OTP. Enforce duplicate-reference rules. Server-calculated prices and a persisted price snapshot are mandatory; ignore/reject client totals.

Statuses should include `not_submitted`, `submitted`/`pending_verification`, `verified`, `rejected`, `expired`, and `refunded`. Reference format validation is not payment verification. Until an official provider API is actually integrated, an authorized admin must verify each payment against trusted merchant records. Require both obligations to be verified before fulfilment by default; if the product owner explicitly chooses a different risk policy, document it.

For testing, use an explicit environment flag such as `PAYMENT_TEST_MODE=true` only in non-production and references such as `MOCK-SHOP-<test-id>` and `MOCK-PLATFORM-<test-id>`. Tag records `method=mock_test` and `isTest=true`; reject mock references in production or when test mode is off. Never hard-code one shared “valid” reference or claim a mock is real payment.

## 4. Wallet, ledger, rider payouts

Create/repair a financial service and immutable ledger. Every wallet-affecting event must record a unique ID/idempotency key, wallet owner/type, related order/payment/payout, type, signed integer amount in paisa, currency, status, description, actor, timestamps, and audit reason. Prefer balanced double-entry legs for transfers and fees. Wallet balances may be cached but must reconcile against posted ledger entries. Never edit/delete historical entries; correct errors with compensating entries.

Rules:
- Payment reference submission alone never credits a wallet.
- Verified payments and completed delivery create only the appropriate entries once.
- Separate shop proceeds, rider earnings, and platform revenue.
- Clearly define pending vs available funds and when earnings become available.
- Cancellation/refund creates compensating entries.
- Repeated requests, retries, or duplicate events cannot double-credit/debit.
- Use MongoDB transactions where supported; otherwise design an idempotent saga/reconciliation approach and document its guarantees.
- Provide a reconciliation report/command that flags balance discrepancies without silently rewriting history.

Rider payout:
- Rider sees own pending/available balances, ledger, and payout history.
- Define the policy precisely; recommended: payout request must be at least **200 BDT (20,000 paisa)** and no more than available balance.
- Atomically reserve funds when a request is made to prevent concurrent overspending.
- Store payout status (`requested`, `approved`, `rejected`, `processing`, `paid`, `failed`), amount, rider, timestamps, admin actor, payout reference, and audit data.
- Admin manually sends the payout externally and only then marks it paid with a reference. Do not claim money was sent without confirmation.
- Rejection/failure releases reserved funds through compensating ledger entries.
- Riders cannot edit balances or mark their own payout paid. Mask and protect payout destination details. Test funds cannot be paid out.

## 5. Admin account management

Only a server-verified admin can manage users, suspend/reactivate accounts, change approved roles, initiate email changes, or initiate password reset. Use allowlisted actions, recent authentication/re-authentication for sensitive operations where supported, and immutable audit logs.

- Never reveal existing passwords, password hashes, reset tokens, or session tokens.
- Use Better Auth's supported short-lived, single-use password reset flow; never set/reveal a user's raw password through admin UI.
- Email changes must verify control of the new address and follow Better Auth's supported flow; do not silently overwrite email.
- Public signup must never create `admin`. Role changes require server-side authorization and audit.
- Revoke sessions after sensitive role/account changes when appropriate.
- Prevent self-escalation and accidental removal of the last active admin.
- “Transfer account” is ambiguous: do not transfer credentials. Implement explicit operations such as verified email change, approved role change, suspend/reactivate, or audited **shop ownership transfer** to another eligible user. Document the interpretation and require authorization.

## 6. Editable profiles and photo uploads

All roles can edit their own allowed profile fields. Admin edits require an explicit permission path and audit trail. Use field allowlists. Profile PATCH must not change role, approval status, wallet balance, email verification, account status, or internal IDs. Email and password changes use Better Auth flows.

Photo upload:
- Validate size, MIME type and actual file signature; use safe random storage keys, strip metadata if practical, and do not trust original filenames/extensions.
- Reject arbitrary remote URLs and local paths. Prefer the repository's existing object-storage provider or a deployment-appropriate object store; local disk is not durable on many serverless/ephemeral hosts.
- Store image storage key/URL and metadata, not large raw images in MongoDB unless intentionally designed.
- Do not serve SVG/HTML/script payloads as executable content. Apply rate limits and authorization.
- Replace old photos only after the new upload succeeds.
- Test unauthorized uploads, oversized files, spoofed MIME/extension, and attempts to edit another user's profile.

## 7. Persistent notifications for important events

Create one central notification/event service and event catalog. Persist notifications before email. Store event type, actor, recipient, related resource, safe title/body, created/read timestamps, channel, and idempotency key. Users can read/mark-read only their own notifications.

Cover at least:
- order created → student and relevant shop owner;
- accepted/rejected/preparing/ready → student and relevant riders as appropriate;
- rider claimed → student, shop owner, assigned rider;
- pickup and delivery verified → relevant order participants;
- payment reference submitted → student confirmation and admin review queue;
- payment verified/rejected → student and appropriate accounting recipients;
- wallet ledger event → wallet owner;
- payout requested → rider and admins;
- payout status changed → rider;
- profile/email/password security change → affected user;
- password reset request → account email;
- admin role/account action → target user and audit log.

Use idempotency keys to prevent duplicate notifications. Add paginated list, unread count, mark-one-read and mark-all-read. Use existing realtime infrastructure if available; otherwise reliable polling/refetch is acceptable. Do not toast on every render, poll, or session refresh. Toast only for a meaningful new event/action and deduplicate by notification ID. Never leak codes, private payment references, or unrelated users' data.

## 8. Nodemailer and password reset

Treat the provided Nodemailer snippet as a concept, not production-ready code: `host: '://example.com'` is invalid. Use one reusable server-side transporter configured by environment variables:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
FRONTEND_URL=http://localhost:3000
```

Port 587 usually uses STARTTLS (`secure: false`); port 465 usually uses implicit TLS (`secure: true`). Confirm provider documentation. Sender identity must be authorized. Keep `.env` private and `.env.example` placeholders only.

- Create reusable email service and branded, escaped HTML + text templates.
- Never trust client-supplied recipient for order/payment emails. Get recipients from trusted database records.
- Public contact forms must use a configured support recipient, validate input, rate-limit, and never become an arbitrary-recipient open relay.
- Escape user-supplied HTML. Never expose raw SMTP errors or secrets to clients.
- Persist email jobs/outbox status (`queued`, `sending`, `sent`, `retrying`, `failed`), retry with bounded exponential backoff, and deduplicate by event/recipient. SMTP failure must not roll back an order or duplicate money movements.
- Record provider message ID where available. “Accepted by SMTP” is not the same as inbox delivery.
- Implement Better Auth's supported forgot/reset-password and email verification APIs for the installed version. Forgot-password response must be generic whether or not the account exists. Tokens must be short-lived, single-use, not logged, and reset URLs must be same-origin/no open redirects. Notify users after password reset and apply session invalidation policy.
- Test missing SMTP config, failed SMTP, retry, duplicate event, successful reset, expired/reused token, unknown email, and verification flows.

## 9. MVC boundaries

- **Models/repositories:** persistence, schemas, indexes, atomic database operations.
- **Controllers:** HTTP input/output, validation, calling services; no duplicated financial rules.
- **Routes:** endpoint registration and middleware mapping.
- **Middleware:** Better Auth session, roles, ownership, validation, rate limits, error mapping.
- **Services:** order state machine, payment verification, ledger/wallet accounting, rider claims/codes, payouts, notifications, email, profile storage, admin audit.
- **Views/serializers:** response DTOs exposing only authorized fields. For JSON APIs, document serializers as the response/View layer.
- **Jobs/outbox:** reliable notification/email retries.
- **Tests:** unit, integration, concurrency, and end-to-end tests.

Controllers should not make ad hoc financial collection writes. Centralize business invariants in services and atomic repository methods.

## 10. API inventory and testing artifacts

Inspect existing paths first; reuse paths where possible and avoid duplicate endpoints. Document every API's method, path, auth role, ownership rule, request/response schema, status codes, side effects, and Thunder Client/curl example.

Cover these API groups:

**Orders/delivery**
- student creates order and reads own order;
- shop owner accepts/rejects/marks ready;
- rider lists eligible jobs, atomically claims, verifies pickup, verifies delivery;
- role-scoped code access.

**Payments/wallet**
- submit shop payment reference;
- submit platform fee/delivery reference;
- admin verify/reject each payment;
- own wallet summary and paginated ledger;
- rider payout request/history;
- admin payout queue, approve/reject/mark-paid with actual reference;
- admin finance reconciliation.

**Notifications**
- own paginated notifications, unread count, mark-one-read, mark-all-read.

**Profile/admin**
- own profile read/update/photo upload;
- verified email change/password change;
- admin user list/search, approved role change, suspend/reactivate, reset flow, shop ownership transfer if supported.

**Auth/email**
- use the installed Better Auth endpoints for signup/sign-in/sign-out/session/forgot/reset/verification; confirm actual paths against the installed version.
- no public endpoint may send arbitrary email to arbitrary recipient.

Create a Thunder Client or Postman collection (choose whichever fits the repo) and a guide to run it. Include setup, environment variables, cookie/session handling, request bodies, success/error examples, and a test sequence from student order through shop readiness, rider claim, code verification, payment review, ledger, payout, notifications, profile/photo, and reset password. Include negative cases for `401`, `403`, `404`, `409`, `422`, and `429`. Use only test fixtures; no real passwords, tokens, bKash numbers, SMTP credentials, or real transaction IDs in collections.

Suggested endpoint names, adapt to existing conventions:
- `POST /api/orders`
- `POST /api/orders/:id/accept`, `/reject`, `/ready-for-pickup`
- `GET /api/rider/jobs`
- `POST /api/orders/:id/claim`, `/verify-pickup`, `/verify-delivery`
- `POST /api/orders/:id/payments/shop-reference`, `/platform-reference`
- `GET /api/wallet/me`, `/api/wallet/me/ledger`
- `POST /api/wallet/me/payouts`
- `GET /api/admin/payments`, `POST /api/admin/payments/:id/verify`, `/reject`
- `GET /api/admin/payouts`, `POST /api/admin/payouts/:id/approve`, `/mark-paid`
- `GET /api/notifications`, `/unread-count`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`
- `GET/PATCH /api/profile/me`, `POST /api/profile/me/photo`
- admin user-management routes, guarded and audited.

## 11. Required tests

Use the existing test framework and a dedicated non-production MongoDB database. Never run financial tests against production.

**Order/concurrency:** correct shop notified; other shops blocked; only legal transitions; exactly one simultaneous rider claim succeeds; codes differ and are role/stage scoped; wrong/expired/replayed codes rejected; no duplicate events/ledger entries on retry.

**Payments/ledger:** two separate references required; submitted references remain pending; only admin/provider verifies; mock references rejected in production; duplicate references blocked; client totals ignored; no double credits; balances reconcile; payout minimum/available limit enforced under concurrent requests; failed payout releases reservation; test funds cannot be paid out.

**Admin/auth:** non-admin blocked; public signup cannot assign admin; email change verified; reset tokens expire and are single-use; sessions revoked as required; audit entries created; last-admin protection works.

**Profile/upload:** own-profile-only; protected fields rejected; invalid/oversized/spoofed image rejected; valid upload stored safely.

**Notifications/email:** correct recipients only; one event creates one notification/job per recipient; user cannot mark another user's notification read; SMTP failure does not roll back business state; retry bounded/idempotent; HTML escaped; forgot-password response does not reveal account existence.

**API collection:** health/config diagnostics disclose no secrets; auth/session/reset; order lifecycle; both payments; admin verification; wallet/payout; profile/photo; notifications; negative authorization and validation tests.

## 12. Execution sequence

1. Audit repo and document root causes with file paths.
2. Define state machine and explicit accounting/settlement rules.
3. Repair models/repositories/indexes.
4. Implement order transitions, atomic rider claim, and secure codes.
5. Implement two payment records, admin verification, ledger, wallets, payouts.
6. Implement admin account management and audit.
7. Implement profile/photo storage.
8. Implement persistent notifications and idempotent email outbox.
9. Implement Nodemailer and Better Auth password reset/verification.
10. Wire MVC controllers/routes/middleware and frontend.
11. Create API collection/docs.
12. Run tests, lint, and production build.
13. Review diff for secrets, unguarded routes, duplicate money operations, mock payment leakage, unsafe email recipients, and unrelated changes.
14. Report real outcomes and blocked external integrations.

## Definition of done

- [ ] Root causes and exact paths documented.
- [ ] Order state machine enforced.
- [ ] Separate shop handover and student delivery codes implemented safely.
- [ ] Rider claim is atomic and concurrency-tested.
- [ ] Both payment references are separate and independently verified.
- [ ] Mock payments work only in test mode and are rejected in production.
- [ ] All wallet changes have immutable, idempotent ledger entries.
- [ ] 200 BDT payout policy and balance reservation enforced atomically.
- [ ] Admin account actions are guarded, verified, and audited.
- [ ] Profile/photo editing is owner-scoped and validated.
- [ ] Notifications persist and email retries are safe/idempotent.
- [ ] Better Auth forgot/reset-password and verification work.
- [ ] MVC boundaries and API docs/Thunder Client collection are complete.
- [ ] Tests, lint, build outcomes are reported accurately.
- [ ] MongoDB, SMTP, and real payment verification are marked successful only if actually tested.
- [ ] No secrets committed and no destructive operations performed.

## Required final report

List root causes with paths; state machine and accounting policy; files changed by MVC layer; API inventory and collection path; exact commands/results; tests passed/failed/blocked; evidence for MongoDB persistence, SMTP delivery, and payment verification without revealing secrets; owner setup steps; remaining risks.

## Execute now

Inspect the actual repository and implement this specification end to end. Preserve unrelated work. Do not stop at a proposal. Do not fabricate payment success or claim external integrations work without evidence.
