# CampusEats Route Authorization Matrix

This document provides a comprehensive authorization specification for every frontend route, Next.js Route Handler, and Express backend endpoint in CampusEats.

---

## 1. Role Definitions

- **`student`**: Jahangirnagar University student; discovers restaurants, places orders, tracks own deliveries.
- **`shop_owner`**: Food stall or restaurant merchant; manages shop profile, menu, and processes incoming orders for their own shop only.
- **`rider`**: Campus student delivery runner; views unassigned orders, claims orders, verifies restaurant pickup, and verifies drop-off to student.
- **`admin`**: System administrator; moderates users, handles disputes, audits escrow ledger, oversees all shops and platform configurations.

---

## 2. Frontend Page Route Authorization (`src/proxy.js`)

| Frontend Path | Access | Allowed Roles | Unauthenticated Behavior | Cross-Role Unauthorized Behavior |
|---|---|---|---|---|
| `/` | Public | All | Render Landing Page | Render Landing Page |
| `/login` | Public | All | Render Login Form | Redirect to user's assigned portal |
| `/signup` | Public | All | Render Registration Form | Redirect to user's assigned portal |
| `/student/*` | Protected | `student`, `admin` | Redirect to `/login?redirect=...` | Redirect to role portal (`/shop-owner/dashboard`, `/rider/available-orders`) |
| `/shop-owner/*` | Protected | `shop_owner`, `admin` | Redirect to `/login?redirect=...` | Redirect to role portal (`/student/home`, `/rider/available-orders`) |
| `/rider/*` | Protected | `rider`, `admin` | Redirect to `/login?redirect=...` | Redirect to role portal (`/student/home`, `/shop-owner/dashboard`) |
| `/admin/*` | Protected | `admin` | Redirect to `/login?redirect=...` | Redirect to role portal (`/student/home`, etc.) |

---

## 3. Backend & API Endpoint Authorization Matrix

Every backend operation independently validates the authoritative Better Auth session and checks resource ownership (IDOR defense).

| Method | Endpoint | Access | Allowed Roles | Ownership / IDOR Constraint | Error Codes | Test Case |
|---|---|---|---|---|---|---|
| **GET** | `/api/health` | Public | Any | None | None | Reports DB ping without leaking credentials |
| **GET** | `/api/auth/me` | Protected | Any authenticated | Returns current session identity | `401 UNAUTHORIZED` | Returns 401 when unauthenticated |
| **POST** | `/api/auth/register` | Public | `student`, `shop_owner`, `rider` applications | Role comes from the validated registration flow; admin is not a self-service role. Initial admin uses the separate recovery flow. | `400`, `403`, `409` | Rejects public administrator-role registration |
| **GET** | `/api/shops` | Public | Any | Approved shops only | None | Returns shop list |
| **GET** | `/api/shops/:id` | Public | Any | None | `404 NOT_FOUND` | Returns single shop or 404 |
| **GET** | `/api/shops/:id/menu`| Public | Any | None | `404 NOT_FOUND` | Returns menu items |
| **POST** | `/api/shops` | Protected | `shop_owner`, `admin` | Sets `ownerId = req.user.id` | `401`, `403` | Denies student attempting to create shop |
| **PUT** | `/api/shops/:id` | Protected | `shop_owner`, `admin` | Must be shop owner (`shop.ownerId === req.user.id`) or admin | `401`, `403 FORBIDDEN`, `404` | Denies Shop Owner A editing Shop Owner B's shop |
| **PATCH** | `/api/shops/:id` (Next.js legacy handler) | Protected | `shop_owner`, `admin` | Owner/admin only; ownership and approval fields are not editable | `401`, `403`, `404`, `422` | Denies another shop owner's mutation |
| **POST** | `/api/menu` | Protected | `shop_owner`, `admin` | Menu item is attached only to an owned shop or admin-authorized shop | `401`, `403`, `404` | Denies menu creation for another shop |
| **PATCH/DELETE** | `/api/menu/:itemId` | Protected | `shop_owner`, `admin` | Resolved through the menu item's shop; `shopId` cannot be changed | `401`, `403`, `404`, `422` | Denies cross-shop menu mutation |
| **POST** | `/api/orders` | Protected | `student` | Both Express and Next.js handlers reject admin and non-student checkout; actor identity comes from Better Auth | `400`, `401`, `403` | Denies unauthenticated and non-student checkout |
| **GET** | `/api/orders` | Protected | All authenticated | Role-filtered; verification codes are returned only to the student or shop owner who needs them | `401` | Verifies Student A does not see Student B's orders or another role's handover codes |
| **GET** | `/api/orders/:id` | Protected | All authenticated | Must be order student, owning shop manager, assigned rider, or admin; unrelated order IDs return non-disclosing `404`; verification codes are role-limited | `401`, `403`, `404` | Denies unrelated student access and prevents rider/admin code disclosure |
| **GET** | `/api/notifications` | Protected | All authenticated | Returns only the signed-in user's latest 50 notifications | `401` | Denies access to another user's notifications |
| **PATCH** | `/api/notifications/:id/read` | Protected | All authenticated | Marks only the signed-in user's notification read | `401`, `404` | Denies changing another user's notification |
| **PATCH** | `/api/notifications/read-all` | Protected | All authenticated | Marks the signed-in user's notifications read | `401` | Does not change other users' notifications |
| **PATCH**| `/api/orders/:id/status`| Protected | `shop_owner` | Central transition service checks shop ownership and legal next state; unrelated order IDs return non-disclosing `404`; every committed change appends actor/time history | `400`, `401`, `403`, `404`, `409` | Denies cross-shop writes and illegal state jumps |
| **POST** | `/api/orders/:id/admin-correction` | Protected | `admin` | Requires a reason; only legal one-step shop transitions or eligible cancellation are allowed, and status history/audit log commit transactionally; refunds remain in the payment flow | `400`, `401`, `403`, `404`, `409`, `503` | Rejects missing reasons, illegal jumps, and corrections without transaction support |
| **POST** | `/api/orders/:id/codes/reissue` | Protected | Owning `student` or `shop_owner` | Student may reissue only after pickup; shop owner may reissue only while ready or rider-assigned; IP/account rate limited and old code conditionally replaced | `400`, `401`, `403`, `404`, `409`, `429` | Prevents another role or an invalid order stage from disclosing/replacing a code |
| **GET** | `/api/rider/availability`| Protected | `rider` | Returns the server-persisted online state | `401`, `403 FORBIDDEN` | Rider availability survives navigation and reloads |
| **PATCH** | `/api/rider/availability`| Protected | `rider` | Persists `isOnline`; client cannot set the field through signup | `400`, `401`, `403 FORBIDDEN` | Rejects non-boolean availability changes |
| **GET** | `/api/rider/available-orders`| Protected | `active`, approved `rider` | Online riders receive bounded pages of ready, unassigned jobs; a rider with an active job receives an empty list | `400`, `401`, `403 FORBIDDEN`, `409` | Denies student/admin access and omits code material |
| **POST** | `/api/rider/claim` | Protected | `active`, approved `rider` | Atomic claim checks current and legacy assignments; unique active-rider index enforces one active order; rider must be online | `400`, `401`, `403`, `409` | Prevents duplicate-order and multiple-active-job claims |
| **POST** | `/api/rider/verify-pickup`| Protected | `rider` | Must be assigned rider in `rider_assigned`; a valid, unexpired shop code is atomically consumed before pickup | `400`, `401`, `403`, `404`, `409`, `410`, `429` | Denies unassigned riders and wrong, expired, reused, or exhausted codes |
| **POST** | `/api/rider/verify-delivery`| Protected | `rider` | Must be assigned rider in `picked_up`; valid, unexpired student code is atomically consumed before delivery | `400`, `401`, `403`, `404`, `409`, `410`, `429` | Denies unassigned riders and wrong, expired, reused, or exhausted codes |
| **GET** | `/api/wallet/me` | Protected | Wallet owner | Returns only the authenticated rider/shop owner's available, pending, and reserved balances | `401`, `403` | Denies unsupported wallet roles |
| **GET** | `/api/wallet/me/ledger` | Protected | Wallet owner | Bounded page scoped to the current user and wallet type | `400`, `401`, `403` | Rejects malformed pagination and cross-account reads |
| **POST** | `/api/wallet/me/payouts` | Protected | `rider` | Reserves available funds transactionally; per-account rate limited; idempotency key required | `401`, `403`, `409`, `422`, `429`, `503` | Rejects insufficient/test funds, duplicate key intent, and malformed amount |
| **GET** | `/api/wallet/me/payouts` | Protected | `rider` | Bounded payout history scoped to the current rider | `400`, `401`, `403` | Rejects malformed pagination and cross-rider reads |
| **GET** | `/api/admin/overview` | Protected | `admin` | System-wide aggregates only | `401`, `403 FORBIDDEN` | Denies non-admin access |
| **GET** | `/api/admin/users` | Protected | `admin` | Better Auth session and active account required; user secrets are excluded | `401`, `403` | Denies unauthenticated and non-admin access |
| **PATCH**| `/api/admin/users/:id` | Protected | `admin` | Admin moderation only | `401`, `403 FORBIDDEN` | Denies non-admin updating user roles |
| **GET** | `/api/admin/payouts` | Protected | `admin` | Strictly filtered, paginated system payout queue | `400`, `401`, `403` | Rejects unknown payout states and malformed pagination |
| **POST** | `/api/admin/payouts/:id/{approve,reject,processing,mark-paid,fail}` | Protected | `admin` | Legal transitions are transactional; paid reference is unique; each decision is audited | `401`, `403`, `404`, `409`, `422`, `503` | Rejects invalid transitions, duplicate external references, and missing reasons |
| **GET** | `/api/admin/finance/reconciliation` | Protected | `admin` | Read-only aggregated ledger-to-wallet comparison; run is audited | `401`, `403`, `503` | Reports missing/orphan and unsupported non-zero ledger balances without mutation |
| **GET** | `/api/admin/audit-logs` | Protected | `admin` | Bounded, newest-first audit history with exact filters | `400`, `401`, `403` | Denies non-admin and rejects malformed filters/pagination |
| **GET** | `/api/admin/kpis`, `/api/admin/shops`, `/api/admin/disputes` (Next.js) | Protected | `admin` | Active Better Auth admin session | `401`, `403` | Denies unauthenticated and non-admin access |
| **POST** | `/api/admin/shops/review`, `/api/admin/disputes` (Next.js) | Protected | `admin` | Active Better Auth admin session; review actor uses the session identity | `401`, `403`, `404`, `422` | Denies public admin mutations |

Order views, rider feeds, and authenticated notification lists refresh while open. Order lifecycle and application updates create persistent in-app notifications for affected students, shop owners, online riders, and administrators. A rider sees a pickup-code form immediately after claiming an order; the shop must first move it to `ready_for_pickup`. Sandbox payment and delivery completion do not transfer or settle real funds.

The legacy Next.js Route Handlers and the Express API still differ in some
delivery behavior and data shapes. Both enforce their own Better Auth session
and ownership checks; production should continue to prefer one canonical
delivery API until the overlapping handlers are retired or fully reconciled.
