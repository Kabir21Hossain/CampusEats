# CampusEats API and workflow test guide

The API is served by the Express application in `backend/src`. Endpoints below
are mounted under `/api`. Protected endpoints require a Better Auth session
cookie or bearer token; the server resolves the user and role from that
session. Never copy a real session token, password, bKash number, or transaction
reference into this guide or the Postman collection.

## Run locally

1. Use a dedicated non-production MongoDB database and configure the backend
   environment described in `backend/.env.example`. Do not use a production
   database for this sequence.
2. Set `FRONTEND_URL=http://localhost:3000` and
   `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api` in the local web
   environment.
3. To exercise mock payment references, set `PAYMENT_TEST_MODE=true` only for a
   non-production backend. The backend rejects these references in production
   or when the flag is disabled.
4. Start the API with `npm run dev --prefix backend` and the web app with
   `npm run dev`. Verify `GET http://localhost:5000/api/health` reports a
   healthy database before proceeding.
5. Import `CampusEats.postman_collection.json` into Postman. Set `baseUrl` to
   `http://localhost:5000/api` and `testRunId` to a unique alphanumeric value
   for this run.

Postman sends and stores Better Auth cookies in its cookie jar. Use a separate
Postman instance/cookie jar (or clear the API host cookies and sign in again)
for each student, shop owner, rider, and administrator. The collection
intentionally includes no credentials or session values. Register/login with
dedicated test accounts through the UI or the documented auth endpoints.
Shop-owner and rider accounts need administrator approval before protected
workflow requests are available.

Run the normal isolated test suite with `npm test --prefix backend`. The
simultaneous-claim integration test is skipped unless both
`CAMPUS_EATS_TEST_MONGO_URI` and `CAMPUS_EATS_TEST_MONGO_DB` are supplied. The
database name must match `campuseats_test_*`; set these variables only for a
disposable test deployment, never for production.

## Response and error conventions

Successful Express endpoints return `success: true` and a resource-specific
field (`order`, `payments`, `wallet`, etc.). Errors return `success: false`
with an `error` message; some include a stable `code`. Important expected
statuses are:

| Status | Meaning | Example |
| --- | --- | --- |
| 400 | Malformed or missing input | missing order ID |
| 401 | No valid Better Auth session | request a protected route signed out |
| 403 | Authenticated but role/ownership is insufficient | another student's order |
| 404 | Resource does not exist or is not visible to this user | unknown order |
| 409 | Current state conflicts with the requested action | second rider claims an order |
| 422 | Input is present but invalid | malformed payment reference |
| 429 | Rate limit reached | repeated handover-code attempts |
| 503 | Required dependency/configuration unavailable | database/payment recipient unavailable |

## State and accounting rules

The canonical forward order flow is
`pending_shop_acceptance → accepted → preparing → ready_for_pickup →
rider_assigned → picked_up → delivered`. The shop can reject before
acceptance; student cancellation is allowed only before rider assignment.
Illegal, skipped, repeated, or backward transitions conflict. Pickup and
delivery are separate rider transitions, each verified with its own expiring,
role-scoped code.

Each order creates two separate paisa-denominated payment obligations.
Submitting references leaves them pending; only an authorized admin can
manually verify against merchant records. Both must be verified before rider
fulfillment. Verified payments are held in pending wallet balances until
delivery. The delivery settlement transaction then makes the shop subtotal
available to the shop owner, credits the delivery fee to the rider, and makes
the platform fee available to the platform. Unique ledger idempotency keys
prevent duplicate releases. Cancellation does not claim an automatic external
refund; it records manual refund/review state. Rider payout requests have a
20,000-paisa minimum and reserve available funds atomically; rejection/failure
returns the reservation, while `paid` requires an external payout reference.

Financial operations require MongoDB transactions. A standalone MongoDB
deployment that cannot support transactions returns an explicit unavailable
error rather than silently applying partial financial changes.

## API inventory

`{id}` denotes a resource ID. `page` is one-based and `limit` is capped at
100 where pagination is supported. All resource ownership is checked by the
server; changing an ID in a request does not grant access.

### Health and authentication

| Method and path | Authentication / ownership | Request and side effects |
| --- | --- | --- |
| `GET /health` | Public | Returns API and database readiness; does not return connection details. |
| `POST /send-email` | Admin session, rate limited | `{recipientUserId,subject,text}`. Sends only to an existing account with a verified email. Arbitrary `to` addresses and client HTML are not accepted. Returns `503 SENDMAIL_UNAVAILABLE` until a local sendmail-compatible executable is available. |
| `POST /auth/register` | Public | `{email,password,name,phone,role,...profileFields}`. Creates student accounts or pending rider/shop-owner applications. Admin registration is limited to configured bootstrap policy. |
| `GET /auth/me` | Any session | Returns the current server-verified user/session. |
| `POST /auth/admin-recovery` | Public, configured one-time recovery | Bootstrap only; rate limited and expires. |
| `POST /auth/sign-in/email` | Better Auth | Installed Better Auth email/password sign-in endpoint; cookie is stored by Postman. |
| `POST /auth/sign-out` | Better Auth session | Ends the current session. |
| `GET /auth/get-session` | Better Auth session | Returns current session state. |
| `POST /auth/request-password-reset` | Public | Better Auth password reset request path for the installed version. The route exists, but the current Better Auth configuration does not register an email sender callback; reset email delivery is not implemented yet. |
| `POST /auth/reset-password` | Public, single-use reset token | Better Auth reset endpoint. Do not put real reset tokens in a collection or logs. |
| `POST /auth/send-verification-email`, `GET /auth/verify-email` | Better Auth | Installed-version email verification endpoints. The current Better Auth configuration does not register an email sender callback; verification email delivery is not implemented yet. |

The backend deliberately rejects Better Auth's direct
`POST /auth/sign-up/email`; use the validated CampusEats
`POST /auth/register` endpoint instead.

### Shops and menu

| Method and path | Authentication / ownership | Request and side effects |
| --- | --- | --- |
| `GET /shops` | Public | Browse approved shops. |
| `GET /shops/{id}` | Public | Read an approved shop. |
| `GET /shops/{id}/menu` | Public | Read the shop's menu and availability flags. |
| `POST /shops` | Shop owner/admin | Create a shop resource. |
| `PUT /shops/{id}` | Owning shop owner/admin | Update allowed shop fields. |
| `GET /shops/{id}/payment-settings`, `PUT /shops/{id}/payment-settings` | Owning shop owner/admin | Read/update the shop's bKash recipient. |
| `POST /menu` | Shop owner/admin | Create an item for an owned shop. |
| `PATCH /menu/{id}` | Owning shop owner/admin | Update an item. |
| `DELETE /menu/{id}` | Owning shop owner/admin | Delete an item. |

### Orders and delivery

| Method and path | Authentication / ownership | Request and side effects |
| --- | --- | --- |
| `POST /orders` | Student | `{shopId,items:[{id,quantity}],deliveryLocation,deliveryNotes,paymentMethod:"bKash"}` plus required `Idempotency-Key`. Server validates approved/orderable shop and menu items, calculates integer-paisa prices, and transactionally creates the order and two payment obligations. An identical retry replays the safe order summary; changed intent under the same key returns `409`. Notifications follow persistence; client totals are ignored. |
| `GET /orders` | Any session | Student's orders, shop owner's own-shop orders, a rider's assigned-order history, or admin's audit list. Unclaimed rider jobs are available only from the online-only, paginated `/rider/available-orders` endpoint. Shop owners can pass `page` (default 1), `limit` (default 50, max 100), `status`, `from=YYYY-MM-DD`, and `to=YYYY-MM-DD`; response `meta` contains pagination totals. |
| `GET /orders/{id}` | Student/shop owner/assigned rider/admin | Reads a serialized order; the shop handover code is returned only to the owning shop owner on this detail endpoint after the order is ready and before code expiry. The delivery code is returned only to the owning student after pickup and before expiry. Riders/admins and order-list responses never disclose either code. |
| `PATCH /orders/{id}/status` | Owning shop owner | `{status:"accepted"|"rejected"|"preparing"|"ready_for_pickup",rejectionReason?}`. Only the canonical next transition is allowed; rejecting requires a reason. Marking ready requires both verified payments and atomically issues a fresh short-lived pickup code. |
| `POST /orders/{id}/admin-correction` | Admin | `{status,reason}`. Allows only a legal one-step shop transition or eligible cancellation, requires a reason, writes status history and audit log atomically, and requires transaction-capable MongoDB. Payment-refund completion remains in the audited payment flow. |
| `POST /orders/{id}/codes/reissue` | Order's student for `delivery`; owner for `shop_handover` | `{codeType:"delivery"|"shop_handover"}`. Delivery codes can be reissued only after pickup; shop handover codes only while ready or rider-assigned. Reissue is rate-limited, conditionally replaces the prior code, and records an audit event. |
| `POST /orders/{id}/cancel` | Owning student | Cancels only before rider assignment; verified payments require manual refund review. |
| `POST /orders/{id}/rating` | Owning student, delivered order | `{shopRating:1..5,reviewText?}`. A rating is accepted once. |
| `GET /rider/availability` | Rider | Reads current online status. |
| `PATCH /rider/availability` | Rider | `{isOnline:boolean}`. |
| `GET /rider/available-orders` | Active, approved online rider | Lists unclaimed, ready orders with bounded pagination; the feed is empty while the rider has an active delivery. |
| `POST /rider/claim` | Active, approved online rider | `{orderId}`. The central transition service atomically assigns one rider and appends status history; a unique active-rider index enforces one active delivery per rider. |
| `POST /rider/verify-pickup` | Assigned rider | `{orderId,shopHandoverCode}`. IP/account rate limited; verifies the unexpired shop code and atomically consumes it, records pickup/history, and issues the separate delivery code to the order. |
| `POST /rider/verify-delivery` | Assigned rider | `{orderId,studentDeliveryCode}`. IP/account rate limited; verifies the student's unexpired code, atomically consumes it and records delivery history, then settles the delivery once. |

### Payments, wallets, payouts

| Method and path | Authentication / ownership | Request and side effects |
| --- | --- | --- |
| `POST /payments/orders/{orderId}/shop-reference` | Owning student | `{reference}`. Submits the food payment reference; remains pending manual verification. |
| `POST /payments/orders/{orderId}/platform-reference` | Owning student | `{reference}`. Submits the separate delivery/platform reference; remains pending manual verification. |
| `GET /payments/orders/{orderId}` | Student/order owner, shop owner, assigned rider, admin | Lists the order's two payment records. Sensitive references/metadata are removed for non-admins. |
| `GET /payments?page=1&limit=20&status=pending_verification` | Admin | Paginated payment review list. `status` may be `not_submitted`, `pending_verification`, `verified`, `rejected`, `refunded`, `expired`, or `all`; `limit` is capped at 100. Invalid filters return `422`. |
| `POST /payments/{id}/verify` | Admin | Records an authorized manual verification against trusted merchant records and posts an idempotent pending wallet ledger credit. It is not an automated provider check or a mock-success shortcut. |
| `POST /payments/{id}/reject` | Admin | `{reason}`. Records a safe rejection and notifies the payer. |
| `POST /payments/{id}/refund` | Admin | `{refundReference,reason}`. Records an externally completed refund and compensating ledger entries when eligible. |
| `GET /wallet/me` | Wallet owner | Own available/pending/reserved paisa balances. |
| `GET /wallet/me/ledger?page=1&limit=20` | Wallet owner | Own paginated ledger. Pagination is strict and bounded. |
| `POST /wallet/me/payouts` | Rider | `{amountPaisa,idempotencyKey}` (or `Idempotency-Key` header). Minimum 20,000 paisa; reserves funds atomically. |
| `GET /wallet/me/payouts?page=1&limit=20` | Rider | Own payout history. Pagination is strict and bounded. |
| `GET /admin/payouts?page=1&limit=20&status=requested` | Admin | Paginated payout queue; status is one of `requested`, `approved`, `processing`, `paid`, `rejected`, `failed`, or `all`. |
| `POST /admin/payouts/{id}/approve` | Admin | Approves a requested payout. |
| `POST /admin/payouts/{id}/reject` | Admin | `{reason}`; releases its reserved amount. |
| `POST /admin/payouts/{id}/processing` | Admin | Records that the external payout process began. |
| `POST /admin/payouts/{id}/mark-paid` | Admin | `{payoutReference}`; records actual external payment confirmation. A normalized payout reference can be used only once; mock references are rejected. |
| `POST /admin/payouts/{id}/fail` | Admin | `{reason}`; releases the reservation. |
| `GET /admin/finance/reconciliation` | Admin | Read-only wallet/ledger discrepancy report, aggregated across posted ledger groups; also writes an audit record for the run. It identifies ledger-only balances and does not repair data. |
| `GET /admin/audit-logs?page=1&limit=20&action=...&actorId=...&targetId=...` | Admin | Newest-first, bounded, read-only audit history with exact optional filters. |

Never treat a submitted payment reference as payment proof. Without a real
provider verification integration, a human admin must check the merchant
records. Mock references use distinct `MOCK-SHOP-...` and
`MOCK-PLATFORM-...` prefixes and are accepted only when
`PAYMENT_TEST_MODE=true` outside production. Test balances cannot be paid out.

### Notifications

| Method and path | Authentication / ownership | Request and side effects |
| --- | --- | --- |
| `GET /notifications?page=1&limit=20` | Any session | Paginated current-user notifications only. |
| `GET /notifications/unread-count` | Any session | Current-user unread count. |
| `PATCH /notifications/{id}/read` | Any session | Marks only the caller's notification as read; another user's ID returns `404`. |
| `POST /notifications/read-all` | Any session | Marks only the caller's unread notifications as read. |

Important business notifications are persisted with recipient-specific
idempotency keys. Transient MongoDB write failures receive up to three
idempotent attempts; duplicate-key races are treated as already persisted.
There is no background outbox/worker: a notification that remains unavailable
after retries is logged and reported unsuccessful by the notification service;
the business operation is not rolled back. Handlers that return a
`notificationsSent` field expose that outcome. The current notification
endpoints do not expose private payment references or handover codes.

### Profile and administration

| Method and path | Authentication / ownership | Request and side effects |
| --- | --- | --- |
| `GET /profile/me` | Any session | Reads the caller's allowlisted profile view. |
| `PATCH /profile/me` | Any session | Updates allowlisted fields only; protected account, email, role, and balance fields are rejected. |
| `POST /profile/me/photo` | Any session | Multipart `photo`; JPEG/PNG/WebP signature and 5 MB limit; stores in MongoDB GridFS under the caller's identity. |
| `GET /profile/photo/{id}` | Owner/admin | Streams an authorized image with `nosniff` and private cache headers. |
| `GET /admin/overview` | Admin | System overview. |
| `GET /admin/users?page=1&limit=25&role=rider&search=...` | Admin | Bounded user directory; role/search filters are allowlisted and validated. |
| `GET /admin/shops?page=1&limit=20` | Admin | Bounded pending shop application queue. |
| `GET /admin/disputes?page=1&limit=20` | Admin | Bounded dispute queue. |
| `PATCH /admin/users/{id}` | Admin | Allowlisted role/approval/suspension action; audited, sessions revoked for security changes, last-admin protection enforced. |
| `POST /admin/shops/review` | Admin | Reviews a shop application; approved shop becomes available to its owner. |
| `POST /admin/disputes/{id}/resolve` | Admin | Applies an audited dispute decision. |
| `GET /admin/payment-settings`, `PUT /admin/payment-settings` | Admin | Reads/updates the platform bKash recipient. Do not include real numbers in shared test artifacts. |
| Email change and shop ownership transfer | Not currently exposed | Do not substitute direct user-email edits or unaudited ownership writes; no verified email-change or ownership-transfer workflow is implemented. |

## Suggested end-to-end test sequence

Run with test identities and a disposable database only. Use distinct clients
or cookie jars for the student, shop owner, rider, and admin:

1. Create/sign in each test account. Ensure the shop owner and rider are
   approved and the shop has a test payment recipient configured.
2. As the student, create an order with item IDs from the shop's current menu.
   Confirm returned totals are server-calculated and two separate payment
   records exist.
3. Submit distinct `MOCK-SHOP-{{testRunId}}` and
   `MOCK-PLATFORM-{{testRunId}}` references only on a non-production backend
   with `PAYMENT_TEST_MODE=true`. Confirm both remain pending.
4. As an administrator, verify each test payment using the test workflow.
   Confirm one verification event creates one pending ledger entry and a
   repeated verification does not credit it twice.
5. As the shop owner, accept, start preparation, and mark the order ready.
   Before both verifications, ready must return `409`. Confirm an unrelated
   shop owner receives `403` and an unrelated rider cannot see the shop code.
6. As the online rider, list available jobs and submit two competing claims
   (two clients/processes); exactly one wins and the other gets `409`.
7. As the shop owner, read the pickup code; as the assigned rider, verify
   that six-character code. Confirm wrong, expired, and replayed codes are
   rejected and only one pickup transition is recorded. Pickup atomically
   issues the separate delivery code.
8. As the student, read the delivery code only after pickup. As the assigned
   rider, submit the student's code to complete delivery. Confirm the rider
   never receives the code in a generic order response, and confirm one
   settlement and no duplicate ledger entries after a retry.
9. As the rider, read wallet/ledger/payout history, then request an amount
   above available balance and an amount below 20,000 paisa; both should fail.
   A valid request reserves funds. As admin, reject/fail a test payout and
   confirm the reservation is released. Do not mark a payout paid without an
   externally confirmed transaction reference.
10. List notifications and unread count for each participant; mark one and all
    read; verify another user's notification ID is not writable.
11. Update only permitted profile fields and upload a valid small image. Verify
    another user's image, a fake PNG signature, a spoofed MIME type, and an
    oversized upload are rejected.
12. Password-reset and email-verification email end-to-end tests are blocked
    until Better Auth sender callbacks are implemented as noted below. Do not
    treat an API response as evidence an email was sent.
13. As a non-admin, call admin payment verification, payout transitions, user
    management, and reconciliation; each must be denied.

## Current implementation boundaries

Notification HTTP handlers are split into route registration,
`controllers/notifications.js`, and `repositories/notifications.js`. The
existing order/payment/admin/profile route modules still contain some
request validation and database reads inline; rider job claiming is
centralized in `repositories/orders.js`, financial mutations are centralized
in `services/finance.js`, and state transitions/role-scoped order DTOs are in
`services/order-workflow.js`. This is a partial MVC extraction, not a claim
that every legacy endpoint has been refactored.

| Finding | Evidence | Status |
| --- | --- | --- |
| Business route modules still combine HTTP handling and persistence | `backend/src/routes/orders.js`, `payments.js`, `admin.js`, and `profile.js` access MongoDB from route callbacks. | Notification HTTP handling and rider atomic claims now have dedicated controller/repository modules; remaining route refactoring is incomplete. |
| Better Auth reset and email-verification endpoints exist without configured sender callbacks | `backend/src/config/auth.js` does not configure `emailAndPassword.sendResetPassword` or `emailVerification.sendVerificationEmail`. | Endpoint paths are documented, but email delivery is not represented as functional. |
| Email has no durable retry outbox | `backend/src/services/mailer.js`; no email-job repository/worker is mounted. | Not implemented or tested. |
| bKash and payout actions need human operator confirmation | Manual admin verify route in `backend/src/routes/payments.js`; payout `mark-paid` requires an admin-supplied external reference. | No provider integration is claimed. |
| Mongo concurrency validation requires an isolated fixture | `backend/tests/order-claim.integration.test.js` requires dedicated `CAMPUS_EATS_TEST_MONGO_*` variables. | Not run without a dedicated test database; do not substitute production. |

The default backend unit suite does not connect to the configured application
database. Sendmail delivery, real bKash provider verification, and real external
payout execution are not claimed as tested integrations. Use
`npm test --prefix backend` for isolated tests, and complete the setup above
before running end-to-end requests.

## Configure email when ready

The backend uses Nodemailer's local sendmail transport, not a network mail
transport. Install and configure a sendmail-compatible executable and local
mail transfer agent (MTA) on the backend host. Set `SENDMAIL_PATH` only
when the executable is not available as `sendmail` on `PATH`, and set
`EMAIL_FROM` to the authorized sender address. The current Windows development
host has no detected sendmail executable, so email requests return
`503 SENDMAIL_UNAVAILABLE` until one is installed/configured. A sendmail
process accepting a message does not guarantee inbox delivery.

Order-created, pickup, and delivery handlers call the shared mailer service
after persisting the business event. They do not make loopback HTTP requests
to `/send-email`; that endpoint is an admin-triggered, account-recipient-only
operation using the same mailer. Email failures do not roll back order
transitions, but durable queued retries are not implemented yet.
