# CampusEats Delivery System — Step-by-Step Copilot Implementation Prompt

> **Purpose:** A staged implementation plan for GitHub Copilot to build CampusEats delivery workflows, from repository audit and MongoDB setup through order lifecycle, rider claiming, verification codes, notifications, payment verification, ledger safety, admin tools, and tests.
>
> **How to use:** Open this file in the CampusEats repository and ask Copilot Chat/Agent to follow it one phase at a time. Do not ask it to implement everything in one giant change. It must inspect the existing code first, preserve the current stack, run checks after each phase, and report changed files and actual test results.

---

## 0. Global instructions for Copilot

You are implementing the delivery system in an existing application called **CampusEats**. Work inside the existing repository; do not scaffold a second application or replace working architecture without a clear reason.

### Required working method

1. Inspect `package.json` files, workspace structure, Next.js app/router, any separate Express/API backend, MongoDB connection utilities, models/schemas, auth setup, role middleware, routes, controllers, services, tests, and existing `plan.md`, `architecture.md`, and README files.
2. Summarize what already exists, what is missing, and the actual architecture.
3. Map each phase to real repository paths before editing. Do not guess paths.
4. Implement **Phase 1 only** first, run relevant checks, report results, and stop for review unless the user explicitly asks you to continue.
5. Extend existing code; do not duplicate existing functionality.
6. Use JavaScript unless the repository is already intentionally TypeScript-based. Follow existing framework and library choices.
7. If there is a separate Express backend, use MVC conventions there: models, routes, controllers, services, middleware, config, jobs, and tests. In Next.js-only areas, use established server-side patterns.
8. Avoid giant controllers, duplicated business logic, fake success responses, TODO-only implementations, and silent error swallowing.
9. At the end of each phase, list files inspected/changed, what works, commands actually run, real test results, remaining issues, and the next phase.
10. Never claim tests/build passed unless you actually ran them and observed success.
11. Never invent credentials, API keys, payment-provider responses, or successful payment confirmations.

### Non-negotiable security and data rules

- **Better Auth remains the authentication authority** if it is the existing chosen auth system. Verify real server-side sessions using the installed version's supported API. Do not invent a custom JWT authentication system.
- Client-side guards and `src/proxy.js` are navigation conveniences only. Every protected API/server action must independently verify session, role, account state, and resource ownership.
- Never trust client-supplied actor IDs, roles, prices, totals, payment states, balances, or admin flags.
- Public signup must never create an admin.
- Never store Better Auth session tokens in localStorage or URLs.
- Never commit `.env`, database credentials, SMTP passwords, payment credentials, or tokens. `.env.example` must contain placeholders only.
- Never log passwords, session tokens, pickup/delivery codes, full payment references, or sensitive personal data.
- Validate all inputs server-side and return consistent errors.
- Store money as integer **paisa**, never floating-point currency.
- Use atomic MongoDB operations for rider claiming, state transitions, code consumption, wallet reservations, and idempotency.
- Use MongoDB transactions for related multi-document changes when the deployed topology supports them. If transactions are unavailable, do not pretend multiple writes are atomic; document the requirement and implement a safe alternative.
- Ledger entries are append-only. Correct mistakes with compensating entries and an audit reason.
- A student-submitted bKash transaction/reference number is **not proof of payment**. Without an official provider integration that genuinely verifies the transaction, mark it `PENDING_VERIFICATION` and require an authorized admin to compare it against trusted records.
- Mock payment references are allowed only in explicit test/development mode, rejected in production, and must never create real withdrawable balances.
- Do not build an open SMTP relay. Email recipients must come from verified/trusted database records or an explicitly authorized account-change flow.
- Avoid destructive database operations, dropping collections, resetting user data, force pushes, or rewriting unrelated files.

---

# Phase 1 — Repository audit and implementation map

## Copilot task

Inspect the repository and produce an architecture report before editing implementation code.

### Steps

1. Read root and frontend/backend `package.json` files.
2. Locate MongoDB connection code and determine whether the project uses the native MongoDB driver, Mongoose, or another existing data layer.
3. Locate user, shop, menu, order, rider, payment, wallet, notification, payout, and admin models/schemas.
4. Locate Better Auth configuration and current server-side session/role verification.
5. Locate API routes, middleware, controllers, and services. Identify whether the backend is Next.js route handlers, Express, or a combination.
6. Locate existing order placement, shop acceptance, rider availability, payment, notification, and payout code.
7. Inspect existing `plan.md`, `architecture.md`, README, and environment examples if present.
8. Inspect test/lint/build scripts and run a safe baseline where practical.
9. Do not make broad code changes in this phase.

### Deliverable

Create or update `docs/delivery-system-implementation-map.md` with:
- Current stack and architecture.
- Existing reusable files and current capabilities.
- Missing delivery capabilities.
- Exact planned paths for models, controllers, routes, services, middleware, jobs, and tests.
- Database deployment requirements, including transaction support.
- Phased checklist and baseline test results.

### Acceptance criteria

- No duplicate application or parallel auth system is introduced.
- Future changes are mapped to real repository paths.
- Existing test/build failures are recorded rather than misattributed to new changes.

---

# Phase 2 — Environment configuration and MongoDB connection

## Copilot task

Make MongoDB configuration reliable and safe, reusing the current data layer. Do not create a second connection helper if one already exists.

### Typical environment example

Adapt names to the actual project; do not rename existing variables without checking all consumers.

```dotenv
# Safe placeholders only; never commit real credentials.
MONGODB_URI=mongodb://127.0.0.1:27017/campuseats
MONGODB_DB_NAME=campuseats

# Use the existing Better Auth variable names.
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000

# Optional email transport; configure only if email is implemented.
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Steps

1. Check `.gitignore`; ensure secret-bearing `.env` files are ignored and `.env.example` is allowed.
2. Add/update `.env.example` with placeholders only. Never print actual secret values in logs or chat.
3. Validate required environment variables with clear, non-secret error messages.
4. Use one canonical MongoDB connection/client according to the installed driver or Mongoose pattern.
5. In Next.js development, avoid creating a new connection on every hot reload; follow the existing project's caching pattern.
6. Fail clearly on connection errors. Do not return fake success.
7. Never connect to MongoDB from browser/client components.
8. Add a safe readiness/health check if the project has an established pattern. Do not reveal connection strings or infrastructure details.
9. Add practical tests for missing configuration and error handling.

### Acceptance criteria

- One canonical MongoDB connection module exists.
- Server data access uses the established connection pattern.
- No secrets are committed or logged.
- Connection/startup failures are understandable.
- Existing app behavior remains intact.

---

# Phase 3 — MongoDB documents, models, validation, and indexes

## Copilot task

Implement/adapt the following concepts using the existing data layer. Do not create duplicate models. Preserve compatibility with existing records and use explicit, non-destructive migrations where needed.

## 3.1 Order document

Adapt names to repository conventions, preserving these concepts:

```js
{
  _id: ObjectId,
  orderNumber: String,              // unique public-facing identifier
  studentId: ObjectId,
  shopId: ObjectId,
  riderId: ObjectId | null,

  items: [{
    menuItemId: ObjectId,
    nameSnapshot: String,
    quantity: Number,                // positive integer
    unitPricePaisa: Number,          // server-derived
    lineTotalPaisa: Number
  }],

  currency: "BDT",
  foodTotalPaisa: Number,
  deliveryFeePaisa: Number,
  platformFeePaisa: Number,
  grandTotalPaisa: Number,

  status: String,
  paymentStatus: String,
  paymentIds: [ObjectId],

  pickupCodeHash: String | null,
  pickupCodeExpiresAt: Date | null,
  pickupCodeUsedAt: Date | null,

  deliveryCodeHash: String | null,
  deliveryCodeExpiresAt: Date | null,
  deliveryCodeUsedAt: Date | null,

  cancellationReason: String | null,
  statusHistory: [{
    from: String | null,
    to: String,
    actorId: ObjectId,
    actorRole: String,
    at: Date,
    note: String | null
  }],

  createdAt: Date,
  updatedAt: Date,
  acceptedAt: Date | null,
  readyAt: Date | null,
  pickedUpAt: Date | null,
  deliveredAt: Date | null,
  cancelledAt: Date | null
}
```

Rules:
- Client-supplied prices are never authoritative. Fetch current menu prices server-side and calculate totals.
- Verify every menu item belongs to the selected shop and is active/orderable.
- Keep name/price snapshots so later menu edits do not alter historical orders.
- Validate quantity as a positive integer with a reasonable maximum.
- Add indexes for unique order number, student history, shop queue, rider active jobs, and status/date filters.

## 3.2 Payment document

Track food and delivery/platform obligations separately where required by product rules.

```js
{
  _id: ObjectId,
  orderId: ObjectId,
  payerStudentId: ObjectId,
  beneficiaryType: "SHOP" | "PLATFORM",
  shopId: ObjectId | null,
  amountPaisa: Number,
  currency: "BDT",
  method: "BKASH_MANUAL" | "OFFICIAL_PROVIDER",
  providerReference: String | null,
  status: "UNPAID" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "REFUNDED",
  submittedAt: Date | null,
  verifiedAt: Date | null,
  verifiedByAdminId: ObjectId | null,
  rejectionReason: String | null,
  idempotencyKey: String,
  createdAt: Date,
  updatedAt: Date
}
```

Create suitable idempotency indexes. Do not assume provider references are globally unique unless actual provider rules establish that.

## 3.3 Append-only ledger document

```js
{
  _id: ObjectId,
  accountType: "STUDENT" | "SHOP" | "RIDER" | "PLATFORM",
  accountId: ObjectId | null,
  orderId: ObjectId | null,
  paymentId: ObjectId | null,
  payoutId: ObjectId | null,
  entryType: String,
  direction: "CREDIT" | "DEBIT",
  amountPaisa: Number,               // positive integer
  currency: "BDT",
  idempotencyKey: String,            // unique per logical posting
  metadata: Object,
  createdAt: Date
}
```

Do not rely on a mutable balance field as the only financial record. If cached balances exist, update them transactionally and reconcile them against ledger entries.

## 3.4 Rider profile and availability

Reuse the existing user/profile design. Ensure rider eligibility, active status, availability, and active-job limits are enforced on the server. UI state alone is not enforcement.

## 3.5 Persistent notification document

```js
{
  _id: ObjectId,
  recipientUserId: ObjectId,
  type: String,
  title: String,
  body: String,
  relatedOrderId: ObjectId | null,
  readAt: Date | null,
  createdAt: Date
}
```

Add indexes for recipient + newest-first list and unread queries.

## 3.6 Payout document (only if rider wallet/payout is in product scope)

```js
{
  _id: ObjectId,
  riderId: ObjectId,
  amountPaisa: Number,
  status: "REQUESTED" | "APPROVED" | "PROCESSING" | "PAID" | "REJECTED" | "FAILED",
  requestedAt: Date,
  reviewedAt: Date | null,
  reviewedByAdminId: ObjectId | null,
  paidAt: Date | null,
  externalTransferReference: String | null,
  idempotencyKey: String,
  rejectionReason: String | null
}
```

`PAID` must mean a real transfer has been completed and confirmed. Mock references must never release real funds.

### Acceptance criteria

- Models validate required fields and enum values.
- Indexes are documented and created safely.
- Existing data compatibility is considered; migrations are non-destructive.
- Money uses integer paisa.
- Verification codes are never stored in plaintext.

---

# Phase 4 — Authentication, authorization, and ownership

## Copilot task

Implement reusable server-side authorization helpers and use them for every protected delivery endpoint.

### Steps

1. Verify the Better Auth session with the installed version's supported server API.
2. Reuse or create helpers conceptually equivalent to:
   - `requireSession(request)`
   - `requireRole(session, allowedRoles)`
   - `requireActiveAccount(session)`
   - `requireOrderParticipant(order, session)`
   - `requireShopOwnership(shop, session)`
   - `requireAssignedRider(order, session)`
   - `requireAdmin(session)`
3. Use the project's actual role schema, such as `student`, `shop_owner`, `rider`, `admin`.
4. Never trust client-supplied actor IDs or role fields.
5. Students access only their own orders; shop owners access only shops they own/manage; riders access only available jobs and orders assigned to them; admin operations require admin authorization.
6. Suspended/deactivated accounts cannot perform protected operations.
7. Return consistent `401`, `403`, `404`, `409`, `422`, and `500` errors without leaking private resource existence.
8. Client-side route protection is not a substitute for server checks.

### Acceptance criteria

- Unauthenticated requests fail with `401`.
- Wrong-role requests fail with `403` or a non-disclosing `404`.
- Users cannot access another user's order by changing an ID.
- Public signup cannot create privileged accounts.

---

# Phase 5 — Central order state machine

## Copilot task

Implement one server-side transition service. Do not scatter arbitrary status updates across controllers.

### Suggested lifecycle

```text
PENDING_ACCEPTANCE
  ├── ACCEPTED
  │     └── PREPARING
  │           └── READY_FOR_PICKUP
  │                 └── RIDER_ASSIGNED
  │                       └── PICKED_UP
  │                             └── DELIVERED
  ├── REJECTED
  └── CANCELLED
```

Cancellation from later states must follow explicit business rules. After pickup, do not allow ordinary student/shop cancellation to bypass support/refund handling. If existing docs specify a different lifecycle, document and migrate it instead of keeping conflicting state machines.

### Allowed actions

| Action | Actor | Preconditions |
|---|---|---|
| Create order | Student | Valid session, active menu items, valid quantities |
| Accept order | Owning shop owner | `PENDING_ACCEPTANCE` |
| Reject order | Owning shop owner | `PENDING_ACCEPTANCE`, reason captured |
| Start preparing | Owning shop owner | `ACCEPTED` |
| Mark ready | Owning shop owner | `PREPARING` |
| Claim job | Eligible rider | `READY_FOR_PICKUP`, no assigned rider |
| Confirm pickup | Assigned rider | `RIDER_ASSIGNED`, valid pickup code |
| Confirm delivery | Assigned rider | `PICKED_UP`, valid delivery code |
| Cancel | Authorized actor | Only where business policy permits |
| Admin correction | Admin | Audited reason and narrow permission |

### Implementation rules

1. A service validates every transition and actor.
2. Use atomic conditional updates matching order ID and expected current status.
3. Record status history for every successful transition.
4. Use server timestamps.
5. Reject invalid transitions with `409 Conflict`.
6. Never accept generic client patches such as `{ "status": "DELIVERED" }`.
7. Make retries safe and prevent repeated side effects.
8. Emit domain events only after the state change commits.

### Acceptance criteria

- Illegal state jumps fail.
- Only the authorized actor can perform each transition.
- Concurrent requests cannot create contradictory states.
- Status history matches committed transitions.

---

# Phase 6 — Student order creation

## Copilot task

Implement the end-to-end order-creation flow.

1. Require an authenticated, active student.
2. Validate request input using the existing validation library/convention.
3. Require a non-empty list of menu items and positive integer quantities.
4. Load the shop and menu items from MongoDB.
5. Verify all items are active, orderable, and belong to that shop.
6. Calculate food total, delivery fee, platform fee, and grand total server-side in integer paisa.
7. Reject malformed, negative, fractional, or out-of-range amounts.
8. Create the order and initial payment records safely, using a transaction where supported.
9. Set initial state to `PENDING_ACCEPTANCE` and record status history.
10. Emit `ORDER_CREATED` only after persistence succeeds.
11. Return a safe summary without secrets or verification hashes.
12. Use idempotency if supported by the existing API design.

### Acceptance criteria

- Client cannot manipulate price or totals.
- Cross-shop/inactive menu items are rejected.
- Retries do not create duplicate orders or side effects when idempotency is supported.
- Order appears in the student's history and correct shop queue.

---

# Phase 7 — Shop-owner order workflow

## Copilot task

1. Query only orders for shops the authenticated owner manages.
2. Add pagination/filters for states and dates.
3. Allow accept/reject only from `PENDING_ACCEPTANCE`.
4. Require a rejection reason.
5. Allow preparation start only from `ACCEPTED`.
6. Allow ready-for-pickup only from `PREPARING`.
7. On ready-for-pickup, generate a cryptographically secure, short-lived pickup code and store only a hash and expiry.
8. Disclose the pickup code only to authorized shop staff through the intended handover flow. Never include it in broad admin logs or rider job listings.
9. Notify the student and eligible riders after committed state changes.
10. Prevent shop owners from changing totals, assigning arbitrary riders, or marking an order delivered.

### Acceptance criteria

- A shop owner cannot operate on another shop's order.
- Invalid transitions return `409`.
- Ready jobs become visible to eligible riders.
- Pickup secret disclosure is restricted.

---

# Phase 8 — Rider job discovery and atomic claiming

## Copilot task

### Job list

1. Require an authenticated, active, eligible rider.
2. Return only `READY_FOR_PICKUP` orders with no assigned rider.
3. Return only information needed to decide whether to accept a job.
4. Do not return pickup/delivery codes or payment secrets.
5. Apply pagination and query limits.

### Atomic claim

Implement equivalent semantics using the project's actual MongoDB driver/Mongoose version:

```js
// Pseudocode — adapt return shape and syntax to the installed library.
const claimedOrder = await orders.findOneAndUpdate(
  {
    _id: orderId,
    status: "READY_FOR_PICKUP",
    riderId: null
  },
  {
    $set: {
      riderId,
      status: "RIDER_ASSIGNED",
      updatedAt: new Date()
    }
  },
  { returnDocument: "after" }
);
```

Ensure status history is written safely, using a transaction if needed.

### Additional checks

- Verify rider is eligible, active, and available.
- Enforce any one-active-job rule race-safely.
- If no order matches the conditional update, return `409 Conflict` and do not claim success.
- Send assignment notifications only after the claim commits.
- Make retries idempotent where practical.

### Acceptance criteria

- Two riders claiming one job concurrently produce exactly one winner.
- The losing rider gets `409`.
- An order cannot have two assigned riders.
- Ineligible/unavailable riders cannot claim jobs.

---

# Phase 9 — Separate secure pickup and delivery codes

## Copilot task

Implement two independent verification workflows. Pickup code and delivery code are not interchangeable.

### Pickup flow

1. Generate a code with a cryptographically secure server-side generator.
2. Set a short expiry based on product policy.
3. Store only a secure hash, never plaintext.
4. Reveal the pickup code only to authorized shop staff responsible for handover.
5. Assigned rider submits the code through a protected endpoint.
6. Verify order state is `RIDER_ASSIGNED`, rider ID matches session, code is unexpired and unused.
7. Rate-limit failed attempts by relevant account/order/IP dimensions.
8. Atomically consume the code, transition to `PICKED_UP`, set `pickedUpAt`, and record status history.
9. Invalidate code after use. Never log it.

### Delivery flow

1. Generate a separate code at the appropriate delivery stage.
2. Store only a hash and expiry.
3. Reveal it to the student who owns the order at the appropriate time.
4. Assigned rider submits it during handover.
5. Verify order state is `PICKED_UP`, rider ID matches, and code is unexpired/unused.
6. Rate-limit failures and use constant-time comparison where appropriate.
7. Atomically consume code, transition to `DELIVERED`, set `deliveredAt`, and record history.
8. Invalidate the code after use.

### Security requirements

- Codes must not appear in public job lists, URLs, analytics, logs, or general notifications.
- Do not persist plaintext codes for convenience. Design controlled issuance/disclosure so only the intended recipient sees the plaintext.
- Do not return codes in generic order responses.
- Enforce expiry, attempt limits, and one-time use.
- Never let a rider confirm pickup/delivery using a status patch.

### Acceptance criteria

- Wrong, expired, reused, or rate-limited codes fail safely.
- Only the assigned rider can submit a code.
- Pickup and delivery codes cannot be interchanged.
- Verification changes state exactly once.

---

# Phase 10 — Persistent notifications and event handling

## Copilot task

### Suggested events

`ORDER_CREATED`, `ORDER_ACCEPTED`, `ORDER_REJECTED`, `ORDER_PREPARING`, `ORDER_READY_FOR_PICKUP`, `RIDER_ASSIGNED`, `ORDER_PICKED_UP`, `ORDER_DELIVERED`, `ORDER_CANCELLED`, `PAYMENT_SUBMITTED`, `PAYMENT_VERIFIED`, `PAYMENT_REJECTED`, `PAYOUT_REQUESTED`, `PAYOUT_APPROVED`, `PAYOUT_PAID`, `PAYOUT_REJECTED`.

### Steps

1. Implement one central notification service with an allowlisted event-to-recipient mapping.
2. Persist notifications in MongoDB.
3. Determine recipients from committed server-side records, never client-supplied `recipientUserId`.
4. Create notifications only after the triggering operation commits.
5. Make event processing idempotent to avoid duplicates after retries.
6. Implement authenticated endpoints for list, unread count, and mark-read.
7. Users may read/mark-read only their own notifications.
8. Use toasts only for immediate UI feedback; important events must persist.
9. If real-time delivery exists, build it on top of persisted notifications.
10. If using a queue/outbox, implement retries and a safe terminal-failure state.

### Acceptance criteria

- Correct recipients receive each event.
- Notification history survives refresh and relogin.
- Users cannot read another user's notifications.
- Retries do not create unbounded duplicates.

---

# Phase 11 — Manual bKash payment submission and admin verification

## Copilot task

Implement honest manual-payment tracking. A text reference alone is not proof of payment.

### Separate obligations

Track food amount payable to the shop and delivery fee/platform fee payable to the platform separately if required by existing business rules. Do not invent allocation percentages or fees; use documented rules or ask the product owner.

### Student submission

1. Require the student to own the order.
2. Validate the payment record and expected amount.
3. Accept a reference as a student-submitted claim only.
4. Set status to `PENDING_VERIFICATION`.
5. Do not mark verified, credit a wallet, release a payout, or call the order financially settled.
6. Avoid exposing full references unnecessarily.
7. Use idempotency to prevent accidental duplicate submissions.
8. Notify the authorized payment-review queue and student.

### Admin verification

1. Require an active admin session and payment-review permission.
2. Show enough context to compare against trusted bKash/merchant records.
3. Require explicit verify/reject action; require a rejection reason.
4. Record admin ID, timestamp, decision, and audit record.
5. Verify only after an authorized operator checks trusted records, unless a real official provider integration performs verification.
6. Prevent one payment from being verified twice or applied to another order.
7. On successful verification, post ledger entries exactly once and transactionally where supported.
8. Reject mock references in production.
9. If the official API is not configured, expose a clear manual-verification workflow. Do not invent provider endpoints, credentials, or responses.

### Acceptance criteria

- Student cannot self-verify.
- Admin decisions are authorized and audited.
- A submitted reference alone cannot credit balances.
- Duplicate verification cannot double-credit ledger.
- Pending/rejected payments remain visible with accurate states.

---

# Phase 12 — Ledger, wallet, and reconciliation

## Copilot task

1. Define account types and allowed ledger entry types.
2. Use integer paisa; validate amounts.
3. Give each logical posting a unique idempotency key.
4. Keep ledger append-only; corrections use compensating entries and an audit reason.
5. Create related ledger entries and cached balance updates in a MongoDB transaction where supported.
6. Never create spendable balance from `PENDING_VERIFICATION`.
7. Follow existing documented allocation rules for food, delivery fee, platform fee, shop receivable, and rider earnings. If absent, ask before implementing a financial allocation.
8. Build a reconciliation report comparing cached balances to ledger totals.
9. Audit manual adjustments with admin ID, reason, timestamp, and references.
10. Prevent replay, double click, retries, and concurrent verification from duplicating entries.
11. Never allow client requests to set wallet balances.
12. Document rounding rules and smallest currency unit.

### Acceptance criteria

- Reprocessing the same event cannot duplicate ledger entries.
- Pending payments do not create spendable funds.
- Ledger is auditable and balances can be reconciled.

---

# Phase 13 — Rider earnings and payouts (only if in scope)

## Copilot task

- If documented minimum payout is ৳200, represent it as `20000` paisa. If project docs specify another threshold, follow the docs and record the decision.
- Rider can request only their own available balance.
- Reserve funds atomically so they cannot be spent or requested twice.
- Validate payout destination according to established secure profile rules.
- Admin decisions require role checks and audit records.
- Mark payout `PAID` only after a real transfer is completed and confirmed.
- Store a real external transfer reference where applicable; reject mock references in production.
- On rejection/failure, release reserved funds exactly once with an appropriate compensating ledger entry.
- Use idempotency for all payout transitions.
- Prevent self-approval if required by business policy.

### Acceptance criteria

- Concurrent payout requests cannot reserve more than available.
- Rejection releases reservation once.
- A payout cannot be paid twice.
- Test-mode payouts cannot create real withdrawable money.

---

# Phase 14 — Email and outbox (optional, if required/configured)

## Copilot task

1. Use the existing mail library if present. Use Nodemailer only if appropriate to the established stack.
2. Read SMTP settings only from environment variables.
3. Put placeholders only in `.env.example`.
4. Validate config without logging credentials.
5. Persist an outbox/job record so temporary SMTP failures do not lose important messages.
6. Process asynchronously with retries, backoff, and terminal failure state.
7. Resolve recipient email from a trusted, verified user record at send time.
8. Prevent arbitrary client-supplied recipients/open relay behavior.
9. Do not email pickup/delivery codes or full payment references unless a documented, threat-reviewed flow specifically requires it.
10. Use Better Auth-supported email verification/password-reset flows; do not invent a parallel reset system.
11. Use idempotency keys to prevent duplicate emails on retries.

### Acceptance criteria

- If SMTP is absent, email is clearly disabled rather than falsely successful.
- Failures retry safely without logging secrets.
- Client cannot use the app to send arbitrary email.

---

# Phase 15 — Admin operations and audit trail

## Copilot task

Implement minimum operational tools for delivery/payment support.

### Capabilities

- Search/view orders with pagination and filters.
- Inspect order state history and relevant payment state.
- Review pending manual payments.
- Verify/reject payments with reason and audit trail.
- Review payout requests if payouts exist.
- Suspend/reactivate accounts if supported by the existing product.
- Make narrow, audited corrections.

### Rules

1. All admin APIs require server-side admin authorization.
2. Never expose passwords, session tokens, password hashes, or verification secrets.
3. Normal signup can never set `admin`.
4. Never rewrite ledger history silently; use compensating entries.
5. Require a reason for sensitive decisions/corrections.
6. Audit actor ID, action, target type/ID, timestamp, reason, and safe before/after metadata.
7. Do not log codes, credentials, or full payment details.
8. Apply pagination, validation, and rate limits.

### Acceptance criteria

- Unauthorized users cannot access admin routes.
- Sensitive decisions are auditable.
- Admin corrections preserve history.

---

# Phase 16 — API contracts and UI integration

## Copilot task

Adapt endpoint names to existing API conventions. Reuse equivalents rather than duplicating routes.

| Capability | Suggested endpoint/action | Auth/role |
|---|---|---|
| Create order | `POST /api/orders` | Student |
| List own orders | `GET /api/orders/mine` | Student |
| Get order detail | `GET /api/orders/:orderId` | Authorized participant |
| Shop order queue | `GET /api/shop/orders` | Shop owner |
| Accept order | `POST /api/orders/:orderId/accept` | Owning shop owner |
| Reject order | `POST /api/orders/:orderId/reject` | Owning shop owner |
| Start preparation | `POST /api/orders/:orderId/start-preparing` | Owning shop owner |
| Mark ready | `POST /api/orders/:orderId/ready` | Owning shop owner |
| List available jobs | `GET /api/rider/jobs` | Rider |
| Claim job | `POST /api/rider/jobs/:orderId/claim` | Eligible rider |
| Confirm pickup | `POST /api/rider/orders/:orderId/confirm-pickup` | Assigned rider |
| Confirm delivery | `POST /api/rider/orders/:orderId/confirm-delivery` | Assigned rider |
| Submit payment reference | `POST /api/orders/:orderId/payments/:paymentId/submit` | Owning student |
| Admin payment queue | `GET /api/admin/payments?status=PENDING_VERIFICATION` | Admin |
| Verify payment | `POST /api/admin/payments/:paymentId/verify` | Admin |
| Reject payment | `POST /api/admin/payments/:paymentId/reject` | Admin |
| List notifications | `GET /api/notifications` | Authenticated user |
| Unread count | `GET /api/notifications/unread-count` | Authenticated user |
| Mark notification read | `POST /api/notifications/:notificationId/read` | Owner |
| Request payout | `POST /api/rider/payouts` | Rider |
| List own payouts | `GET /api/rider/payouts` | Rider |
| Admin payout queue | `GET /api/admin/payouts` | Admin |
| Approve/reject payout | `POST /api/admin/payouts/:payoutId/approve` / `reject` | Admin |
| Mark payout paid | `POST /api/admin/payouts/:payoutId/mark-paid` | Admin with payout permission |

### API requirements

1. Document request payload, success response, validation errors, auth errors, conflict errors, and side effects for each endpoint.
2. Use the existing JSON response convention.
3. Never return code hashes, plaintext codes, credentials, or unrelated user data.
4. Use correct methods/status codes.
5. Add validation, pagination caps, request-size limits, and rate limits where needed.
6. Do not create generic update endpoints that let clients set arbitrary order/payment/payout statuses.

### UI requirements

- Public homepage remains viewable without login.
- Protected pages require authentication and role authorization.
- Render role dashboards from the verified session, not a client-selected role.
- Server/API response is the source of truth for order status.
- UI may disable unavailable actions for usability, but server enforces the same rule.
- Use toasts for immediate feedback and persistent notifications for asynchronous events.
- Handle loading, empty, conflict, retry, and offline states.
- Do not claim real-time updates unless actually implemented.

### Acceptance criteria

- Every endpoint has examples and error cases in docs.
- UI never treats optimistic status changes as authoritative.
- Role-specific pages and actions are protected.

---

# Phase 17 — Tests

## Copilot task

Use the repository's existing test framework. Do not add another framework without a reason.

### MongoDB/config

- Missing database config fails clearly.
- Connection failures do not expose credentials.
- Model validation and indexes are checked where practical.

### Authorization

- Unauthenticated requests return `401`.
- Wrong roles are rejected.
- Student A cannot read/mutate Student B's order.
- Shop owner A cannot manage Shop B's orders.
- Rider A cannot submit codes for another rider's order.
- Non-admin cannot verify payment or approve payouts.

### Order lifecycle

- Student creates order with server-derived prices.
- Invalid/cross-shop menu items are rejected.
- Shop owner can accept only their own pending order.
- Illegal transitions fail.
- Correct status history is recorded.
- Duplicate requests do not repeat financial/notification side effects.

### Rider assignment

- Only eligible riders see/claim available jobs.
- Concurrent claims for one job yield exactly one winner.
- Losing claim returns `409`.
- Suspended/unavailable rider cannot claim.
- Active-job restrictions are enforced if required.

### Verification codes

- Correct pickup code transitions `RIDER_ASSIGNED` to `PICKED_UP`.
- Wrong, expired, reused, and rate-limited pickup codes fail.
- Correct delivery code transitions `PICKED_UP` to `DELIVERED`.
- Pickup code cannot be used as delivery code.
- Only assigned rider can confirm.
- Codes do not appear in logs or general API payloads.

### Payments/ledger

- Student submission leaves payment `PENDING_VERIFICATION`.
- Student cannot self-verify.
- Admin verification requires authorization and creates an audit record.
- Replaying verification cannot double-credit ledger.
- Pending payment creates no spendable funds.
- Mock references are rejected in production.
- Ledger reconciliation matches cached balances.

### Notifications/email

- Correct recipients receive persistent notifications.
- Users cannot read another user's notifications.
- Retried events do not duplicate notifications.
- SMTP failure retries and never reports false success.

### Payouts

- Rider cannot request more than available balance.
- Concurrent requests cannot over-reserve.
- Rejection releases reservation once.
- A paid payout cannot be paid again.

### Testing rules

- Use isolated test data/database; never production data.
- Never include live secrets in fixtures.
- Avoid arbitrary sleeps.
- Concurrency tests must issue competing operations and verify the single-winner invariant.
- If transactions are required, use a transaction-capable test setup and document that requirement.

### Acceptance criteria

- New critical tests pass.
- Existing tests still pass or existing failures are explicitly listed.
- Never claim unrun tests passed.

---

# Phase 18 — Observability, resilience, and final security review

## Copilot task

Review the full implementation.

- [ ] Structured logs/correlation IDs without secrets.
- [ ] Rate limits for code verification, auth-sensitive endpoints, payment submissions, and admin actions.
- [ ] Safe production errors; no stack traces exposed to clients.
- [ ] Correct indexes and bounded/paginated queries.
- [ ] No unbounded order/notification reads in dashboards.
- [ ] Transactions or documented safe alternatives for related financial/state changes.
- [ ] Atomic rider claims and one-time code consumption.
- [ ] Idempotency for state changes, payment verification, ledger posting, notifications, and payouts.
- [ ] No client-authoritative roles, prices, statuses, balances, or ownership fields.
- [ ] No plaintext pickup/delivery code persistence.
- [ ] No secrets committed, logged, or returned.
- [ ] `.env.example` contains placeholders only.
- [ ] Production rejects mock payment/payout behavior.
- [ ] Sensitive admin decisions are audited.
- [ ] Health checks reveal no infrastructure secrets.
- [ ] README documents setup, env variable names, DB setup, test commands, and transaction requirements.
- [ ] API docs contain sample request/response/error bodies.
- [ ] No destructive migration or database reset was introduced.

### Final checks

Inspect `package.json` before selecting commands. Run only commands that actually exist, such as:

```bash
npm run lint
npm test
npm run build
```

Report unavailable commands rather than pretending they ran.

### Final report required from Copilot

1. Architecture discovered.
2. Features implemented per phase.
3. Files created/changed.
4. MongoDB configuration, document, and index summary.
5. API endpoint inventory with roles and example payloads.
6. Order state machine and rider-claim guarantees.
7. Payment verification and ledger safeguards.
8. Required environment variable names only — never values.
9. Exact setup/migration commands.
10. Tests run and actual results.
11. Known limitations, especially any provider integration not actually connected.
12. Remaining work prioritized by security and business impact.

---

# Implementation order — do not skip ahead

1. Repository audit and implementation map.
2. Environment validation and canonical MongoDB connection.
3. Models/documents, validation, and indexes.
4. Better Auth session checks and authorization helpers.
5. Central order state machine.
6. Student order creation.
7. Shop-owner workflow.
8. Atomic rider job claim.
9. Secure pickup and delivery codes.
10. Persistent notifications and event handling.
11. Manual bKash submission and admin verification.
12. Ledger and reconciliation.
13. Rider payouts, if required by existing product docs.
14. Email outbox/Nodemailer, if required/configured.
15. Admin operations and audit trail.
16. API documentation and UI integration.
17. Tests, including concurrency tests.
18. Security review, README, and final report.

**Start with Phase 1 only.** Inspect the repository, map the implementation to actual files, record baseline checks, and do not generate large amounts of implementation code until the architecture is understood.
