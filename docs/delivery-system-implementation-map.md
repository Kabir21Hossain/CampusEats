# CampusEats Delivery System — Phase 1 Implementation Map

**Audit scope:** Existing repository, MongoDB access, Better Auth, delivery
workflows, payment/wallet/payout code, APIs, middleware, services, tests, and
project documentation.

**Phase 1 boundary:** This is an inspection and planning deliverable only. No
application code, database records, environment values, or dependencies were
changed.

## 1. Current stack and architecture

- **Frontend:** Next.js App Router 16.4.2, React 19, JavaScript/ES modules,
  Tailwind CSS v4. Browser-facing services call the separately configured
  Express API through `NEXT_PUBLIC_API_BASE_URL`.
- **API:** A separate Express 5 backend in `backend/`, also JavaScript/ES
  modules. It is the documented API used by the frontend and has MVC-oriented
  routes, some extracted controllers, repositories, services, and middleware.
- **Database:** MongoDB Node.js driver 7.x, not Mongoose. Better Auth and
  application data use MongoDB collections. There are no application model
  files or Mongoose dependency; application documents and field rules are
  currently defined by route/service code, collection indexes, and docs.
- **Authentication:** Better Auth 1.7.x with its MongoDB adapter. Frontend and
  Express each configure Better Auth against MongoDB and share the session
  authority; Express additionally reloads the user record for account status
  and role checks. No custom JWT authentication is used.
- **Persistence identifiers:** Application records predominantly use string
  `id` values. Better Auth owns its own `user`, `session`, `account`, and
  related records. Some documentation uses different names or ObjectId-based
  conceptual schemas, so migrations must follow the actual persisted format.
- **Transaction requirement:** `backend/src/services/finance.js` uses native
  MongoDB sessions and `withTransaction`. Related financial operations
  therefore require a transaction-capable MongoDB deployment (replica set or
  sharded cluster). The current isolated unit suite does not establish that
  the deployed database topology supports transactions.

### Source-of-truth boundary

`docs/backend-integration.md` and the frontend API client describe the browser
calling the Express API. At the same time, `src/app/api/` contains overlapping
Next.js Route Handlers that access MongoDB directly. The deployment guide
identifies Express as canonical; the overlapping Next.js handlers are legacy
and are not assumed to be equivalent. Future phases must
choose and verify the supported runtime for each operation; they must not
silently create another implementation or assume the mirrored handlers are
equivalent to Express.

## 2. Existing files and capabilities

| Area | Existing implementation | What is already present |
|---|---|---|
| MongoDB / runtime config | `backend/src/config/env.js`, `backend/src/config/db.js` | Backend environment validation, cached native-driver client, safe health ping, idempotent index creation, graceful close. |
| Frontend MongoDB | `src/lib/mongodb.js`, `src/lib/db.js` | Separate native-driver client and Next.js collection helper. The helper also contains non-destructive sample seeding, creating a second application-data access path. |
| Better Auth | `backend/src/config/auth.js`, `backend/src/middleware/auth.js`, `src/lib/auth.js`, `src/lib/auth-server.js` | Server-side session checks; role, suspension/approval, and ownership checks; privileged public role assignment is guarded in signup configuration. |
| Backend HTTP stack | `backend/src/app.js`, `backend/src/server.js`, `backend/src/routes/index.js`, `backend/src/middleware/errorHandler.js` | Express app, CORS allowlist, Helmet, JSON limits, global rate limiting, route mounting, centralized error handling, startup/index setup. |
| Orders | `backend/src/routes/orders.js`, `backend/src/services/order-workflow.js` | Server-derived item prices and integer-paisa totals, order snapshots, payment records, canonical forward order states with legacy mapping, owner checks, status timestamps, cancellation rules, student history/detail and rating endpoint. |
| Shop operations | `backend/src/routes/shops.js`, `backend/src/routes/menu.js`, `backend/src/repositories/shops.js` | Shop/menu CRUD and owner checks; shop status transitions are handled through the orders API. |
| Rider operations | `backend/src/routes/rider.js`, `backend/src/repositories/orders.js`, `backend/src/services/order-codes.js` | Availability, eligible-order feed, atomic conditional claim, separate pickup/delivery codes, hashed and encrypted code records, expiry, attempt ceilings, verification rate limiting and role-limited serialization. |
| Payments and finance | `backend/src/routes/payments.js`, `backend/src/routes/wallet.js`, `backend/src/services/finance.js` | Separate shop/platform payment obligations, manual reference submission, admin verify/reject/refund routes, test-reference gates, transactional wallet/ledger work, payout reservation and reconciliation logic. No official bKash provider verification is present. |
| Notifications | `backend/src/routes/notifications.js`, `backend/src/controllers/notifications.js`, `backend/src/repositories/notifications.js`, `backend/src/services/notifications.js` | Authenticated user-scoped inbox, unread/read actions, persistent MongoDB records, stable event keys, idempotent upsert behavior. |
| Admin / audit | `backend/src/routes/admin.js`, `backend/src/services/audit.js` | Admin-scoped operations for users, shops, disputes, payment settings, payouts, reconciliation, and audit records. Some request orchestration remains inline in route callbacks. |
| Email | `backend/src/controllers/email.js`, `backend/src/routes/email.js`, `backend/src/repositories/email.js`, `backend/src/services/mailer.js` | Trusted-recipient lookup and an explicit unavailable/failure response when mail delivery is not configured. A persistent email outbox/worker is not present. |
| Frontend API and UI | `src/services/api-client.js`, `src/services/index.js`, `src/app/student/checkout/page.js`, `src/app/shop-owner/orders/page.js`, `src/app/rider/available-orders/page.js`, `src/app/rider/active-delivery/page.js`, `src/app/admin/payments/page.js` | Express API client and existing student, shop-owner, rider, and admin workflow screens. |
| Supporting documentation | `docs/mongodb/collections-and-indexes.md`, `docs/route-authorization-matrix.md`, `docs/api/README.md`, `docs/backend-integration.md`, `docs/production-deployment-guide.md` | Collection/index notes, endpoint examples, authorization and deployment guidance; some statements conflict with the current code or one another. |

### Current MongoDB collections in backend code

The backend index setup and service/routes reference `user`, `shops`,
`menuItems`, `orders`, `orderReviews`, `payments`, `wallets`, `ledger`,
`payouts`, `notifications`, `auditLogs`, `disputes`, `shopApplications`,
email-related recipient/user records, and platform settings. No durable email
outbox collection was found in the backend code.
This list reflects code references, not a guarantee that every collection is
currently populated or has been migrated consistently.

## 3. What works today

1. Better Auth is the session authority; Express checks the live session and
   database-backed user status. Protected routes use role checks, with
   order/shop ownership checks in relevant workflows.
2. Student checkout validates shop/menu records server-side, calculates prices
   in integer paisa, snapshots order items, creates separate payment
   obligations, and records the order/payment documents in a MongoDB
   transaction.
3. Order-state policy is centralized in a reusable service and supports legacy
   status aliases. Shop transitions use a conditional update and prevent
   offering an order to riders until both payment obligations are verified.
4. Rider claims use a conditional `findOneAndUpdate`; the repository unit
   tests cover the single-winner behavior without MongoDB.
5. Pickup and delivery are distinct code purposes. Code hashes are checked
   with constant-time comparison; code records also retain encrypted material
   for authorized disclosure. Verification endpoints have a limiter and
   attempt caps.
6. Manual bKash reference submission remains pending verification. Admin
   verification/rejection and refund decisions are server-side; mock
   references are explicitly gated from production and outside test mode.
7. Wallet and ledger changes, payout reservations, and order settlement use
   transaction/idempotency logic. Reconciliation support is present.
8. Notifications persist in MongoDB, scope reads to the authenticated user,
   and use event idempotency keys.
9. Admin routes are mounted behind session and admin middleware. Shop and menu
   mutations check ownership.

These are capabilities observed in source and tests; they are not a claim that
the production database topology, live payment integration, mail transport, or
every deployment mode has been exercised.

## 4. Gaps, risks, and decisions to resolve before implementation

### Architecture and persistence

- `architecture.md` describes Mongoose as the intended application model
  layer, but neither package manifest includes Mongoose and the running API
  uses the native MongoDB driver. Phase 3 should preserve the installed driver
  unless a separately approved migration justifies changing the data layer.
- Express has the richer delivery implementation, but overlapping Next.js
  route handlers also read/write business collections. In particular,
  `src/app/api/orders/route.js` contains a different, legacy-shaped order
  creation/read implementation. Deployment must not expose inconsistent
  business rules by routing some clients to one implementation and other
  clients to another.
- MongoDB collection/field names differ across the architecture docs and
  implementation (for example `users` vs Better Auth's `user`, and proposed
  ObjectId references vs string IDs). A non-destructive compatibility plan is
  needed before any schema/index migration.
- The frontend `src/lib/db.js` includes legacy mock-data seeding on first
  access, whereas the Express backend has its own seed script. Confirm which
  deployment mode is authoritative before expanding or invoking either
  seeder.

### Delivery and authorization

- Rider claim checks online status and atomically claims one order, but the
  inspected claim handler does not enforce a one-active-delivery-per-rider
  limit. If this is a product rule, it needs a race-safe implementation and a
  concurrency test.
- The shop-owner order queue now has bounded pagination and filters. Rider
  available-order, student-history, and admin list routes still need separate
  pagination review.
- Canonical Express order transitions append actor/timestamp `statusHistory`;
  overlapping Next.js handlers still have legacy direct-write paths.
- Rider pickup/delivery verification changes order state before invoking
  settlement separately. A failure between those operations can leave a
  delivered order with settlement pending; confirm recovery/idempotency
  requirements and add a focused test/reconciliation path.
- The code reissue flow, general admin disclosure rules for verification
  secrets, and failure-attempt persistence should receive a targeted review
  when Phase 9 is authorized.
- Some auth/route documentation matrices do not match live routes/roles. In
  particular, the Express API and Next.js handlers do not consistently expose
  the same operations or authorization behavior.

### Payments, ledger, operations, and tests

- Manual reference review is implemented, but there is no verified official
  bKash integration. References must continue to be treated as claims, not
  proof of payment.
- Transaction-dependent flows need a replica-set/sharded deployment and a
  transaction-capable integration-test database. The current rider-claim
  Mongo integration test is opt-in and was skipped in the baseline run.
- Current backend unit tests cover workflow policy, repositories,
  notifications, mailer behavior, recipient validation, and review payloads;
  they do not comprehensively exercise the payment/finance transaction
  lifecycle, auth-protected HTTP endpoints, order creation, code concurrency,
  or deployment routing.
- The root authentication test connects to the configured MongoDB database
  and creates then deletes `@campuseats.test` records. It has no enforced
  dedicated test database guard; it was not run during this audit.
- Backend request orchestration for orders, riders, payments, and admin
  remains concentrated in route modules. Existing notification/email
  controller/repository patterns can guide incremental extraction; a
  wholesale MVC rewrite is not warranted.
- The email flow uses an immediate sendmail integration rather than a durable
  outbox/worker. Email is optional and should only be expanded if product
  requirements and runtime support are confirmed.
- Product policy remains unresolved in existing design docs for rider role
  representation, cancellation/timeout rules, live tracking, provider
  integration, and whether proposed escrow splits are approved. Do not infer
  new financial policy from stale design text.

## 5. Exact proposed files by delivery-system phase

This is the incremental file map based on paths present in the repository.
**Create** means the path did not exist before its phase. Each phase proceeds
only after explicit user approval.

| Phase | Existing paths to modify | New paths to create if needed |
|---|---|---|
| **1 — Repository audit and map (this phase)** | None | `docs/delivery-system-implementation-map.md` |
| **2 — Environment and MongoDB** | `backend/.gitignore`, `backend/src/config/env.js`, `backend/src/config/db.js`, `backend/src/server.js`, `backend/src/routes/health.js`, `src/lib/auth.js`, `src/lib/mongodb.js`, `src/lib/db.js`, `src/app/api/health/route.js`, `.env.example`, `backend/.env.example`, `docs/production-deployment-guide.md` | `backend/tests/env.test.js`. Reconcile runtime/config without exposing or changing secret values. |
| **3 — Documents, validation, indexes** | `backend/src/config/db.js`, `backend/src/routes/orders.js`, `backend/src/services/finance.js`, `backend/src/services/notifications.js`, `backend/src/services/audit.js`, `docs/mongodb/collections-and-indexes.md` | `backend/src/models/documents.js` for shared native-driver validation of the persisted document shapes; `backend/tests/models.test.js`. |
| **4 — Auth and ownership** | `backend/src/middleware/auth.js`, `backend/src/config/auth.js`, `src/lib/auth-server.js`, `docs/route-authorization-matrix.md` | `backend/tests/auth-middleware.test.js` if existing tests do not cover the required HTTP behavior. |
| **5 — Central order state machine** | `backend/src/services/order-workflow.js`, `backend/src/services/order-transitions.js`, `backend/src/routes/orders.js`, `backend/src/routes/rider.js`, `backend/src/repositories/orders.js`, `backend/src/services/finance.js`, `backend/src/services/audit.js`, `backend/src/models/documents.js`, `backend/tests/order-workflow.test.js`, `backend/tests/order-repository.test.js`, `backend/tests/order-transitions.test.js`, `backend/tests/models.test.js` | `backend/src/controllers/orders.js`, `backend/src/controllers/rider.js` only if later extracting HTTP orchestration. Preserve state rules in the shared transition service, not controllers. |
| **6 — Student order creation** | `backend/src/app.js`, `backend/src/config/db.js`, `backend/src/models/documents.js`, `backend/src/routes/orders.js`, `backend/src/services/order-workflow.js`, `src/services/index.js`, `src/app/student/checkout/page.js`, `backend/tests/models.test.js`, `backend/tests/order-workflow.test.js`, `docs/api/README.md`, `docs/api/CampusEats.postman_collection.json`, `docs/mongodb/collections-and-indexes.md`, `docs/api-examples/orders-and-checkout.md` | `backend/src/services/order-creation.js`, `backend/tests/order-creation.test.js`. The existing finance transaction is reused; no route/controller extraction is needed. |
| **7 — Shop-owner workflow** | `backend/src/middleware/auth.js`, `backend/src/routes/orders.js`, `backend/src/services/order-workflow.js`, `backend/src/services/order-transitions.js`, `backend/tests/auth.test.js`, `backend/tests/order-workflow.test.js`, `backend/tests/order-transitions.test.js`, `src/services/index.js`, `src/app/shop-owner/orders/page.js`, `docs/api/README.md`, `docs/api-examples/orders-and-checkout.md` | `backend/src/services/order-queue.js`, `backend/tests/order-queue.test.js`. The existing transition service and authenticated shop lookup are reused; no controller extraction is needed. |
| **8 — Rider discovery and claim** | `backend/src/routes/rider.js`, `backend/src/repositories/orders.js`, `backend/src/config/db.js`, `backend/tests/order-repository.test.js`, `backend/tests/order-claim.integration.test.js`, `src/app/rider/available-orders/page.js`, `docs/api-examples/rider-lifecycle.md` | `backend/tests/rider-claim.integration.test.js` only if existing integration test cannot cover eligibility/active-job concurrency. |
| **9 — Pickup/delivery codes** | `backend/src/services/order-codes.js`, `backend/src/routes/rider.js`, `backend/src/routes/orders.js`, `backend/src/middleware/rateLimit.js`, `backend/src/services/order-workflow.js`, `backend/tests/order-workflow.test.js`, `docs/api-examples/rider-lifecycle.md`, `src/app/rider/active-delivery/page.js`, `src/app/student/orders/[orderId]/page.js`, `src/app/shop-owner/orders/page.js` | `backend/tests/order-code-verification.test.js` if existing tests cannot cover route-level expiry, attempts, reuse, and authorization. |
| **10 — Notifications/events** | `backend/src/services/notifications.js`, `backend/src/repositories/notifications.js`, `backend/src/controllers/notifications.js`, `backend/src/routes/notifications.js`, `backend/tests/notifications.test.js`, `backend/tests/notifications-repository.test.js`, `backend/tests/notifications-controller.test.js`, `docs/api/README.md` | `backend/src/jobs/outbox-worker.js` and an outbox repository/model only if durable retry processing is selected and operationally supported; neither is assumed necessary for existing in-app notifications. |
| **11 — Manual payment/admin verification** | `backend/src/routes/payments.js`, `backend/src/routes/admin.js`, `backend/src/services/finance.js`, `backend/src/config/db.js`, `backend/tests/payment-recipients.test.js`, `docs/api-examples/admin-operations.md`, `src/app/admin/payments/page.js`, `src/services/index.js` | `backend/src/controllers/payments.js` (extract route orchestration if useful), `backend/tests/payments.integration.test.js` with transaction-capable isolated MongoDB. No provider client is planned without an approved official integration. |
| **12 — Ledger/reconciliation** | `backend/src/services/finance.js`, `backend/src/models/documents.js`, `backend/src/routes/wallet.js`, `backend/src/routes/admin.js`, `backend/src/config/db.js`, `docs/mongodb/collections-and-indexes.md`, `docs/production-deployment-guide.md` | `backend/tests/finance-reconciliation.test.js`; keep reconciliation read-only and transactional ledger writes unchanged. |
| **13 — Rider payouts (existing product scope)** | `backend/src/services/finance.js`, `backend/src/models/documents.js`, `backend/src/routes/wallet.js`, `backend/src/routes/admin.js`, `backend/src/config/db.js`, `src/app/rider/earnings/page.js`, `src/app/admin/payouts/page.js`, `src/services/index.js`, `docs/api-examples/admin-operations.md` | `backend/tests/payouts.integration.test.js` only with a transaction-capable isolated MongoDB. |
| **14 — Email outbox (conditional)** | `backend/src/services/mailer.js`, `backend/src/routes/email.js`, `backend/src/controllers/email.js`, `backend/src/repositories/email.js`, `backend/src/config/env.js`, `backend/tests/mailer.test.js`, `docs/production-deployment-guide.md` | `backend/src/models/email-outbox.js`, `backend/src/repositories/email-outbox.js`, `backend/src/jobs/email-outbox-worker.js`, and corresponding tests only if durable email delivery is required and a worker-capable host is confirmed. |
| **15 — Admin/audit operations** | `backend/src/routes/admin.js`, `backend/src/services/audit.js`, `backend/src/config/db.js`, `backend/tests/`, `docs/route-authorization-matrix.md`, `docs/api-examples/admin-operations.md`, `src/app/admin/audit-logs/page.js` | `backend/src/controllers/admin.js` only if later route extraction is needed. |
| **16 — API contracts and UI integration** | `docs/api/README.md`, `docs/api/CampusEats.postman_collection.json`, `docs/api-examples/`, `docs/backend-integration.md`, `src/services/index.js`, `src/services/api-client.js`, `src/app/rider/earnings/page.js`, `src/app/admin/payouts/page.js`, `src/components/shared/navbar.js` | No new routes unless a required capability is confirmed missing; use the Express contract. |
| **17 — Tests** | `backend/tests/` existing focused suites, root `tests/auth.test.js`, root `package.json` only if test isolation/scripting is corrected; `backend/package.json` only if a real test script change is needed | Focused route/service/integration tests in `backend/tests/`; root auth test isolation must be resolved before safely including it in routine baseline CI. |
| **18 — Resilience and final review** | `backend/src/middleware/errorHandler.js`, `backend/src/middleware/rateLimit.js`, `backend/src/app.js`, `backend/src/server.js`, both READMEs, `docs/production-deployment-guide.md`, `docs/api/README.md`, `docs/route-authorization-matrix.md` | `backend/src/middleware/requestContext.js` only if correlation IDs are not already supplied by deployment/runtime; no logging or observability dependency without need. |

### Cross-phase implementation constraints

- Keep Better Auth as the only session authority and use the actual native
  MongoDB driver already installed.
- Treat Express as the browser's active API per `docs/backend-integration.md`.
  Do not remove or extend overlapping Next.js route handlers until their
  supported deployment role is resolved and parity is tested.
- Do not add a competing model/database/auth layer simply to match stale
  architecture text. If validation modules are required, use native-driver
  document conventions and the existing dependencies.
- Reuse `backend/src/services/order-workflow.js`,
  `backend/src/repositories/orders.js`, `backend/src/services/order-codes.js`,
  `backend/src/services/notifications.js`, and `backend/src/services/finance.js`.
- Do not add payment allocations, cancellation percentages, delivery
  distance/map behavior, shop timeouts, or a new payout policy without
  confirming the product decisions in `architecture.md`.
- Integration tests for transactions must use an explicitly isolated
  transaction-capable test database. Never point them at production data.

## 6. MongoDB deployment requirements

1. The backend uses `MONGODB_URI` and `MONGODB_DB` and a shared native-driver
   `MongoClient` in `backend/src/config/db.js`. The frontend has a separate
   client/helper in `src/lib/mongodb.js` and `src/lib/db.js`.
2. Existing transaction-based order/payment, wallet/ledger, settlement, and
   payout flows require a replica set or sharded cluster that supports
   transactions. A standalone local MongoDB server is insufficient for those
   multi-document transactions.
3. `backend/src/config/db.js` creates indexes at backend startup. Schema/index
   changes must be compatible with pre-existing records and deployed index
   state; do not drop collections or assume documentation seed data matches
   production.
4. The rider-claim MongoDB integration test is opt-in through
   `CAMPUS_EATS_TEST_MONGO_URI` and a dedicated `CAMPUS_EATS_TEST_MONGO_DB`
   named `campuseats_test_*`. Financial integration tests need the same kind
   of explicit isolated transaction-capable setup.
5. The root authentication test does not enforce a dedicated test database
   name; it loads local environment files and writes/deletes test-user
   records. Do not use it against an unknown configured database.

## 7. Baseline checks (Phase 1)

Commands were run from the repository root unless noted:

| Command | Observed result |
|---|---|
| `npm run lint` | **Passed**, exit code 0. |
| `npm run build` | **Passed**, production build completed and all 53 static pages were generated. Build output included expected dynamic-session prerender messages for `/api/auth/session`; build still completed successfully. |
| `Set-Location backend; npm test` | **Passed:** 34 tests passed, 0 failed, 1 skipped. The skipped case was the opt-in simultaneous MongoDB rider-claim integration test. |
| Root `npm test` | **Not run.** Inspection showed `tests/auth.test.js` loads `.env.local`/`.env`, connects to the configured MongoDB database, and creates/deletes `@campuseats.test` user records without asserting that the selected database is a dedicated test database. Running it would risk modifying an unknown database. |
| `npm run check:db` | **Not run.** It would connect to the configured MongoDB service; this audit did not require a live connection check. |

No baseline test/build/lint failure was observed in the commands that were
run. The root test is unverified, not failed. The skipped integration test
does not verify a real concurrent MongoDB claim.

## 8. Phase 3 implementation record

- Added native-driver document validation for the persisted string-ID and
  paisa-based order, payment, wallet, ledger, payout, notification, and audit
  shapes. New writes through the Express backend's order/payment/finance/
  notification/audit paths use these checks; legacy records are not rewritten.
- Added query indexes for order history/queues/status dates, notifications,
  payment history, ledger history, payout queues, and audit actor history.
- Documented the indexes actually created by the native-driver setup, including
  the order-review indexes; no live collection inspection was used to claim
  deployed index state.
- Review tightened ledger owner-type validation to the persisted `shop`,
  `rider`, `platform`, and `external` values and expanded plaintext-code
  rejection to the verification field names used by current and legacy order
  serializers.
- The order-number unique index is created only when the duplicate check finds
  no existing string order-number duplicates. Existing duplicates are kept;
  a non-unique lookup index is created and a warning is logged instead.
  Existing order-number indexes are preserved as-is pending an explicit
  reviewed migration.
  Phase 6 replaced the six-digit order-number generator with high-entropy
  identifiers and retries unique-index collisions. Existing non-unique
  indexes still need a reviewed migration before database-enforced uniqueness
  is guaranteed.
- New installations receive partial, non-unique normalized payment and refund
  reference indexes. Existing indexes are preserved as-is; existing unique
  reference indexes require a separately reviewed migration because there is
  no confirmed provider-wide uniqueness policy.
- Validation and index behavior are covered by isolated unit tests. The
  deployed database's actual indexes, legacy document shapes, and successful
  index creation on its MongoDB topology were not queried or verified.
- Removed an erroneous second audit call from rider payout creation; it
  referenced undefined variables after the valid payout audit
  record and would cause the transaction to abort.
- The tagged sample user profile seed uses string identifiers and required no
  schema change.
- Authentication, route authorization, and ownership code were not changed in
  this phase. New document checks remain on the existing authenticated write
  paths; they do not establish live authorization or MongoDB behavior.
- **Partial coverage:** the overlapping Next.js `POST /api/orders` handler
  still directly inserts its incompatible legacy order shape, including
  plaintext verification codes, and the Next.js rider delivery handler writes
  notifications without the new validators. These are existing parallel API
  paths; migrating or disabling them requires the canonical-runtime decision
  recorded in the architecture risks. Phase 3 therefore does not guarantee
  every persisted order/notification was validated.
- The repository-root `npm test` was inadvertently run twice during this
  phase. It connects to the configured MongoDB and deletes all `user`
  collection documents matching the `@campuseats.test` email suffix during
  cleanup, not only the test account. Cleanup of `account` and `session`
  records is limited to the test's own created user ID. Both test runs passed,
  but matching pre-existing user records may have been deleted, potentially
  leaving their linked auth records orphaned. No database query was run to
  inspect or restore records.

### Phase 3 review checks

| Exact command | Observed result |
|---|---|
| `Set-Location backend; npm test` | **Passed:** 45 passed, 0 failed, 1 skipped. The skip is the opt-in simultaneous MongoDB rider-claim integration test. |
| `npm run lint` | **Passed**, exit code 0. Git emitted line-ending conversion warnings for existing modified files. |
| `npm run build` | **Passed**, production build generated all 53 static pages. The existing dynamic-session prerender messages appeared. |
| `git diff --check` | **Passed**, exit code 0. |
| `git -C backend diff --check` | **Passed**, exit code 0. |

The root `npm test` and `npm run check:db` were not run during review because
they connect to the configured database. The prior root-test incident above
remains unresolved and was not investigated through database access.

## 9. Phase 4 implementation record

- Reused the installed Better Auth `api.getSession` flow in both existing
  server-side authorization modules. Protected checks now reload persisted
  user state and reject suspended, deactivated, disabled, unapproved, or
  missing accounts; authentication infrastructure failures return a generic
  `500` instead of looking like an unauthenticated request.
- Added reusable role, active-account, shop-owner, order-participant, and
  assigned-rider checks in the existing Express and Next.js auth helpers.
  Order, payment, shop, menu, rider, and admin handlers now use ownership
  checks, with unrelated order/shop IDs returning non-disclosing `404`
  responses.
- Secured the previously unguarded Next.js admin-user, shop-review, KPI, and
  dispute APIs with an active Better Auth admin session. Admin-user output is
  sanitized and self-suspension is blocked.
- Secured Next.js menu and shop mutation routes with role and resource-owner
  checks; ownership/approval fields cannot be changed through shop updates.
  Public shop details no longer reveal payment-recipient configuration.
- Removed admin from public self-registration. Initial admin recovery remains
  available through the existing token-protected recovery route; admin
  provisioning otherwise remains admin-only.
- Hardened the overlapping Next.js delivery handlers as well: detail/update
  and rider verification use native MongoDB filters; riders must be assigned
  before pickup/delivery; claims check both current and legacy rider fields;
  and order serializers restrict verification-code exposure by participant.
- Updated the authorization matrix to reflect the guards and known runtime
  differences.
- **Phase 4 checks run:**
  - `Set-Location backend; npm test` — **passed:** 52 passed, 0 failed, 1
    skipped. The skip is the opt-in simultaneous MongoDB rider-claim test.
  - `npm run lint` — **passed**.
  - `npm run build` — **passed**; Next.js compiled and generated all pages.
    During static generation, shop/session handlers attempted MongoDB
    connections, which failed because MongoDB was unavailable; generation
    continued and the build exited successfully. No successful live database
    operation was verified.
  - `git diff --check` and `git -C backend diff --check` — **passed**; Git
    emitted only line-ending conversion warnings.
  - `npm test` from the repository root — **failed before tests ran** because
    Node could not resolve the extensionless `src/lib/mongodb` import from
    `src/lib/db.js` in the root test harness. It did not reach a database.
- **Partial:** The Next.js order creation and rider verification flows remain
  legacy implementations with incompatible order fields and plaintext codes.
  Phase 4 secures access to those endpoints but does not reconcile their
  business behavior or replace them with the Express workflow. The Next.js
  rider claim endpoint still differs from Express on online-state enforcement.
- **Unverified:** No route-level HTTP tests or live Better Auth/MongoDB checks
  were run. Backend unit tests cover authorization helpers and status behavior;
  actual deployed session invalidation, account-state documents, and endpoint
  wiring across production deployment modes remain unverified.

## 10. Phase 5 implementation record

- Added `backend/src/services/order-transitions.js` as the canonical
  Express-side persistence boundary for order status changes. It validates the
  current and target states, persisted actor role/ownership, cancellation
  assignment constraints, reason requirements, and legacy rider assignment
  fields; it conditionally updates the expected current state and appends
  actor, role, timestamp, and optional reason history in the same MongoDB
  update.
- Routed shop accept/reject/prepare/ready actions, atomic rider claims,
  code-verified pickup/delivery, and student cancellation through the service.
  Payment-refund completion also uses it within the existing finance
  transaction. Code hash/expiry filters and code removal remain part of the
  same pickup/delivery atomic update.
- New orders now include an initial `pending_shop_acceptance` history record.
  Order-document validation checks optional history arrays and entry shape,
  preserving legacy documents without rewriting them.
- Added a separate admin correction endpoint. It permits only a legal
  one-step correction, requires a reason, and commits the transition history
  and audit log together using the existing transaction helper.
- Notifications remain after the order status update commits and use the
  existing stable event-key mechanism. The delivery settlement retry path is
  retained for a committed delivery whose settlement needs retry.
- **Partial by architecture constraint:** Overlapping Next.js order/rider
  handlers still contain legacy direct status writes and are not routed
  through this service. The implementation map's Phase 2 constraint says not
  to remove or extend those handlers until their supported deployment role
  is resolved and parity is tested. The browser uses the Express API; direct
  Next.js API callers remain a risk and need a separate explicit runtime
  decision.
- **Unverified:** No route-level HTTP tests, live MongoDB operation, concurrent
  database test, or transaction-capable admin-correction test was run. Unit
  tests exercise transition policy, generated atomic filters/updates, history,
  ownership, legacy rider assignment, and conflict handling with in-memory
  fakes.
- **Phase 5 checks run:**
  - `Set-Location backend; node --test tests/order-workflow.test.js tests/order-repository.test.js tests/order-transitions.test.js tests/models.test.js`
    — **passed:** 22 tests at the time of this focused run.
  - `Set-Location backend; npm test` — **passed:** 58 passed, 0 failed, 1
    skipped. The skip is the opt-in simultaneous MongoDB rider-claim test.
  - `npm run lint` — **passed**.
  - `git diff --check` and `git -C backend diff --check` — **passed**; Git
    emitted only line-ending conversion warnings.
  - No build or live database check was run for this backend-only change.

## 11. Phase checklist and approval gate

### Phase 3 status

- **Completed:** Native-driver validators are used for new documents written
  through the Express order, payment, wallet, ledger, payout, notification,
  and audit paths. Index declarations cover the documented query patterns.
  Tests cover document validation, duplicate order numbers, existing index
  preservation, and rejected unsupported ledger owner types.
- **Partial:** Order-number uniqueness is only established when there is no
  existing order-number index and no legacy duplicates. Existing indexes are
  not altered automatically. Legacy Next.js order and notification writes
  bypass the Express document validators and use a different order shape.
- **Unverified:** No live database reads/writes were performed for Phase 3;
  actual deployed index definitions, legacy-document compatibility, and
  MongoDB topology behavior remain unverified. Duplicate values under other
  unique-index keys were not checked; MongoDB may reject index creation and
  prevent startup if such legacy duplicates exist, without deleting records.
  No live authorization checks were performed.
- **Outstanding decisions:** Confirm production MongoDB supports the index
  options used; decide whether to retire or migrate the overlapping Next.js
  order and notification write paths before treating validation as
  comprehensive. Phase 6 added high-entropy order numbers and transactional
  duplicate-key retry, but legacy non-unique indexes still require reviewed
  migration before database-enforced order-number uniqueness is guaranteed.

- [x] **Phase 1:** Inspect current architecture, identify reusable
  functionality/gaps, map real paths, and record safe baseline checks.
- [x] **Phase 2:** Environment/MongoDB topology and canonical API runtime.
- [x] **Phase 3:** Native-driver document validation and indexes.
- [x] **Phase 4:** Better Auth authorization/ownership coverage.
- [x] **Phase 5 (canonical Express paths):** Central, auditable order
  transition service. Overlapping Next.js writes remain explicitly partial.
- [x] **Phase 6:** Student order creation hardening and idempotency on the
  canonical Express API. Legacy Next.js order creation remains out of scope
  under the runtime constraint.
- [x] **Phase 7:** Shop-owner workflow and queue limits on the canonical
  Express API. Legacy Next.js order handlers remain out of scope under the
  runtime constraint.
- [x] **Phase 8:** Rider discovery, eligibility, and active-job claim rules.
- [x] **Phase 9:** Code lifecycle, expiry, rate limits, atomic verification.
- [x] **Phase 10:** Persistent notifications and retry/outbox decision.
- [x] **Phase 11:** Manual payment controls and admin verification.
- [x] **Phase 12:** Ledger invariants and reconciliation.
- [x] **Phase 13:** Rider payout correctness.
- [ ] **Phase 14:** Email outbox — intentionally not implemented per user scope.
- [x] **Phase 15:** Admin operations and audit trail.
- [x] **Phase 16:** API documentation and frontend parity.
- [x] **Phase 17:** Isolated route, integration, and concurrency tests.
- [x] **Phase 18:** Resilience and security review (code review and focused checks; no live deployment audit).

### Phase 6 implementation record

- Checkout now requires an `Idempotency-Key` header, normalizes and validates
  the student request, and hashes the normalized intent. The unique,
  student-scoped partial index prevents duplicate order records. Identical
  retries return the existing summary; key reuse for different intent returns
  `409 IDEMPOTENCY_KEY_REUSED`.
- The checkout client retains a key for retries of the same form values and
  issues a new key if the order intent changes. CORS allows the custom request
  header.
- Shop approval/open state, menu availability/ownership, item count, item IDs,
  positive integer quantities, exact integer-paisa prices, and safe totals are
  checked server-side. The existing MongoDB transaction still creates the
  order and both payment obligations atomically.
- Order numbers now use high-entropy identifiers; the unique-index collision
  is retried. The response is an allowlisted order summary with no verification
  codes, hashes, encrypted code material, or payment recipient records.
  Notifications and email remain after successful persistence, and
  idempotent replays do not repeat them.
- **Unverified:** No live MongoDB transaction, concurrent duplicate checkout,
  deployed index inspection, or route-level HTTP test was run. Existing
  Next.js direct order creation remains an explicitly separate legacy path.
- **Phase 6 checks run:**
  - `Set-Location backend; npm test` — **passed:** 68 passed, 0 failed, 1
    skipped. The skip is the opt-in simultaneous MongoDB rider-claim test.
  - `Set-Location backend; node --test tests/api-collection.test.js` —
    **passed:** the updated Postman collection validates and contains no saved
    credentials.
  - `npm run lint` — **passed**.
  - `npm run build` — **passed** and generated all 53 pages. Existing MongoDB
    connection errors appeared during static generation because no database
    was available; no live database operation was verified.
  - Root `npm test` — **failed before tests ran** because Node could not
    resolve the extensionless `src/lib/mongodb` import from `src/lib/db.js`.
    This matches the previously recorded root-test harness limitation; the
    error occurred before database access.
  - `git diff --check` and `git -C backend diff --check` — **passed**; Git
    emitted only line-ending conversion warnings.

### Phase 7 implementation record

- Shop-owner order lists now derive access solely from shop IDs owned by the
  authenticated account; denormalized order owner fields no longer widen
  access. The endpoint supports bounded pagination (default 50, maximum 100),
  state filters, and inclusive date filters, with total/page metadata.
- Shop rejection requires a non-empty reason of at most 500 characters, and
  the owner UI requires the reason before submission. The transition service
  still enforces only legal next states and verifies shop ownership.
- Marking an order ready requires both payment obligations to be verified and
  atomically replaces the pickup code with a distinct short-lived code. Only
  the hash and encrypted disclosure record are persisted; legacy plaintext
  pickup fields are unset. Ready notifications target eligible, online,
  active riders after persistence.
- Pickup codes are excluded from order-list responses and are returned only
  on an explicit order-detail read by the owning shop account after readiness.
  The shop UI now loads this detail when the owner opens the handover modal.
- **Unverified:** No route-level HTTP authorization test, live MongoDB
  concurrency test, or deployed notification test was run. Existing
  overlapping Next.js order endpoints remain a separate legacy runtime path.
- **Phase 7 checks run:**
  - `Set-Location backend; npm test` — **passed:** 74 passed, 0 failed, 1
    skipped. The skip is the opt-in simultaneous MongoDB rider-claim test.
  - Focused queue, transition, creation, and serializer tests — **passed:** 28
    passed, 0 failed.
  - `npm run lint` — **passed**.
  - `npm run build` — **passed** and generated all 53 pages. Existing MongoDB
    connection errors appeared during static generation because no database
    was available; no live database operation was verified.
  - Root `npm test` — **failed before tests ran** on the pre-existing
    extensionless `src/lib/mongodb` import from `src/lib/db.js`.
  - `git diff --check` and `git -C backend diff --check` — **passed**; Git
    emitted only line-ending conversion warnings.

### Phase 8 implementation record

- The rider offer feed now lists only unassigned `ready_for_pickup` orders,
  applies bounded pagination, and is restricted to active, approved, online
  riders. A rider with an active delivery receives no additional offers;
  generic order history contains assigned orders only.
- Claims remain conditional order transitions. A unique reservation field and
  unique partial indexes on both canonical and legacy rider IDs enforce one
  active order per rider. Existing duplicate active assignments are preserved;
  startup skips the affected unique index and warns until those records are
  reviewed. Same-order retries by the winning rider return the active claim.
- The rider offer page directs riders to their active delivery and disables
  second claims. The API example and MongoDB index reference were updated.
- **Unverified:** No live MongoDB same-order or same-rider concurrency test
  ran; both opt-in integration tests require a dedicated
  `CAMPUS_EATS_TEST_MONGO_URI` database. Existing legacy conflicts and deployed
  index definitions still need inspection.
- **Phase 8 checks run:** Focused backend order claim, transition, workflow,
  and index tests passed; the two live MongoDB concurrency cases were skipped.
  Frontend lint and both Git whitespace checks passed.

### Phase 9 implementation record

- Verification codes are cryptographically generated six-character values,
  HMAC-hashed for comparison, and encrypted only for recipient disclosure.
  They expire after two hours and allow five failed attempts per order.
- Pickup codes are generated when the shop marks the order ready. The pickup
  verification service checks the assigned rider, exact lifecycle stage,
  expiry, and attempt ceiling, then atomically consumes the code, records
  pickup history, and issues a distinct delivery code.
- The delivery code is issued at pickup and disclosed only to the order's
  student while the order is picked up. Riders, shop owners, admins, general
  order responses, and lists do not receive it. Delivery verification
  atomically consumes it and records the delivered transition.
- Failed code attempts use conditional atomic increments. Verification and
  reissue endpoints are limited by IP and authenticated account. Reissue
  requires the proper student/shop owner and lifecycle stage, uses conditional
  replacement, and is available from the student and shop-owner order screens.
- Conflicting canonical/legacy rider identifiers no longer grant assignment
  access through the legacy field.
- **Unverified:** No live MongoDB verification race, expiry, or deployed
  rate-limit behavior was exercised. The canonical Express paths were tested;
  parallel legacy Next.js order handlers remain a separate runtime path.
- **Phase 9 checks run:** `Set-Location backend; npm test` — **passed:** 88
  passed, 0 failed, 2 skipped (both require the dedicated MongoDB test URI).
  Focused ESLint on changed pages/services and `git diff --check` plus
  `git -C backend diff --check` — **passed**. `npm run build` — **passed** and
  generated all 53 pages; pre-existing MongoDB/auth errors appeared during
  static generation because no database/session was available. Backend
  syntax checks and route module imports — **passed**.

## Phases 10–11 implementation record

- Notification writes retain stable recipient-scoped idempotency keys and now
  retry retryable MongoDB write/connection failures up to three times. A
  duplicate-key race is treated as an already persisted event; permanent
  failures are logged and returned as unsuccessful without making a completed
  order/payment action look failed.
- **Outbox decision:** No durable notification outbox/worker was added. The
  deployed runtime includes serverless mode, so an in-process polling worker
  would not be a reliable operational contract. Notifications are in-app only;
  persistent failures after bounded retries can still result in a missed
  notification and require operational recovery. Email outbox remains the
  separate conditional Phase 14 decision.
- Manual payment review now has strict allowlisted status/pagination parsing,
  bounded queue pages, and total-page metadata consumed by the admin UI. An
  `activeReference` unique partial index reserves submitted references until
  rejection releases the reservation. Submission also
  checks normalized references on legacy active records. Admin verification
  remains manual against merchant records and transactionally posts ledger
  entries; no provider integration or automated proof claim was added.
- **Unverified:** MongoDB transaction races, deployed index creation, and
  notification persistence against a live database were not exercised without
  a dedicated test MongoDB URI. Legacy normalized-reference duplicates still
  require operational review.
- **Phase 10–11 checks run:** `Set-Location backend; npm test` — **passed:**
  94 passed, 0 failed, 2 skipped (dedicated MongoDB integration checks).
  Focused ESLint on changed backend/frontend JavaScript — **passed**.
  `npm run build` — **passed**, generating all 53 pages; static generation
  logged expected session/shop API errors without a configured database
  session. Root and backend `git diff --check` — **passed**, with only existing
  line-ending conversion warnings. No live MongoDB payment race/index check
  was run.

## Phases 12–13, 15–18 implementation record

- **Phase 12:** Ledger documents now restrict balance types and enforce the
  external-clearing versus wallet-owner pairing. Reconciliation performs one
  posted-ledger aggregation, compares all supported wallet fields, flags
  ledger balances without wallets and unsupported balance types, and skips
  external clearing accounts. It is read-only except for its audit event and
  does not attempt automated repair.
- **Phase 13:** Payout references are normalized, bounded, reject mock values,
  checked against legacy references including whitespace variants, and
  reserved by a unique partial index for concurrent finalized transfers.
  Wallet and admin pagination/status filters are strict. Riders can view their
  balance, ledger, and payout history and request payouts from the earnings UI;
  admins have a paginated queue with guarded status transitions.
- **Phase 14:** No email outbox, worker, or email retry changes were made,
  following the user's explicit exclusion.
- **Phase 15:** Dispute and shop-application decisions now commit audit records
  transactionally. Admin user updates are audited with the underlying
  moderation transaction. Added a bounded, exact-filter audit read endpoint
  and UI. User, application, dispute, and payout queues expose bounded
  pagination.
- **Phase 16:** Updated API, authorization, MongoDB, deployment, integration,
  admin-operations, and Postman documentation. Corrected Postman payment-review
  URLs to match the canonical Express routes and identified overlapping Next.js
  handlers as legacy rather than claiming endpoint parity.
- **Phase 17:** Added isolated unit coverage for wallet reconciliation,
  payout-reference normalization, strict pagination, and admin list filters.
  Existing MongoDB integration tests remain environment-gated; the root auth
  test was not run because it may use the configured application database.
- **Phase 18:** Added authenticated-account financial mutation rate limits,
  bounded admin queries, and safe normalization of invalid HTTP error status
  values. The general limiter remains in-process memory; multi-instance
  deployments need a shared store. This was not a third-party penetration or
  live infrastructure audit.
- **Unverified:** No dedicated test MongoDB was configured, so actual unique
  index creation, transaction behavior, payout-reference races, and
  reconciliation against live data were not exercised. Production financial
  operations still require a replica set or sharded cluster. Phase 14 remains
  outside this scope.
- **Checks run:** Backend suite — **105 tests, 103 passed, 0 failed, 2 skipped**
  (MongoDB-gated); focused ESLint, production Next.js build, and
  `git diff --check` all passed. Build-time session/shop diagnostics occurred
  during static generation without a configured database session; all routes
  generated successfully.

**Stop here after Phase 18.** Do not begin Phase 14 or any later work unless
the user explicitly requests it.
