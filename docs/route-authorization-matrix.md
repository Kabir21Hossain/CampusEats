# CampusEats Route Authorization Matrix

This document provides a comprehensive authorization specification for every frontend route, Next.js Route Handler, and Express backend endpoint in CampusEats.

---

## 1. Role Definitions

- **`student`**: University student; discovers restaurants, places orders, tracks own deliveries.
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
| **POST** | `/api/auth/register` | Public | Student only | Role strictly locked to `student` | `400`, `403`, `409` | Rejects registration with role `admin` or `shop_owner` |
| **GET** | `/api/shops` | Public | Any | Approved shops only | None | Returns shop list |
| **GET** | `/api/shops/:id` | Public | Any | None | `404 NOT_FOUND` | Returns single shop or 404 |
| **GET** | `/api/shops/:id/menu`| Public | Any | None | `404 NOT_FOUND` | Returns menu items |
| **POST** | `/api/shops` | Protected | `shop_owner`, `admin` | Sets `ownerId = req.user.id` | `401`, `403` | Denies student attempting to create shop |
| **PUT** | `/api/shops/:id` | Protected | `shop_owner`, `admin` | Must be shop owner (`shop.ownerId === req.user.id`) or admin | `401`, `403 FORBIDDEN`, `404` | Denies Shop Owner A editing Shop Owner B's shop |
| **POST** | `/api/orders` | Protected | `student`, `admin` | Authoritative server price calculation | `400`, `401`, `403` | Denies unauthenticated checkout |
| **GET** | `/api/orders` | Protected | All authenticated | Role-filtered: student sees own, owner sees shop's, rider sees assigned/ready | `401` | Verifies Student A does not see Student B's orders |
| **GET** | `/api/orders/:id` | Protected | All authenticated | Must be order student, shop owner, assigned rider, or admin | `401`, `403 FORBIDDEN`, `404` | Denies unrelated student accessing order detail |
| **PATCH**| `/api/orders/:id/status`| Protected | `shop_owner`, `admin` | Must own the shop associated with this order | `400`, `401`, `403 FORBIDDEN`, `404` | Denies other shop owner changing order status |
| **GET** | `/api/rider/available-orders`| Protected | `rider`, `admin` | Unassigned orders (`riderId === null`) | `401`, `403 FORBIDDEN` | Denies student access to rider order queue |
| **POST** | `/api/rider/claim` | Protected | `rider`, `admin` | Atomic conditional update (`riderId === null`) | `400`, `401`, `403`, `409 CONFLICT` | Prevents two riders from claiming the same order |
| **POST** | `/api/rider/verify-pickup`| Protected | `rider`, `admin` | Must be assigned rider; triggers dual email to student + merchant | `400`, `401`, `403 FORBIDDEN`, `404` | Denies unassigned rider pickup verification |
| **POST** | `/api/rider/verify-delivery`| Protected | `rider`, `admin` | Validates delivery code, releases escrow funds | `400`, `401`, `403 FORBIDDEN`, `404` | Rejects mismatched delivery code |
| **GET** | `/api/admin/overview` | Protected | `admin` | System-wide aggregates only | `401`, `403 FORBIDDEN` | Denies non-admin access |
| **GET** | `/api/admin/users` | Protected | `admin` | Sensitive fields (`passwordHash`) excluded | `401`, `403 FORBIDDEN` | Denies non-admin access |
| **PATCH**| `/api/admin/users/:id` | Protected | `admin` | Admin moderation only | `401`, `403 FORBIDDEN` | Denies non-admin updating user roles |
