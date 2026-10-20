# MongoDB Collections, Schema Rules, and Index Specifications

This document defines the schema design, collection purposes, ownership boundaries, and index strategies for the CampusEats platform.

---

## 1. Collections Overview

| Collection | Purpose | Owner / Authority | Retention & Privacy |
|---|---|---|---|
| `users` | User profiles, student identity, approved role | System / Better Auth | Email & names public only in appropriate context. Passwords managed by Better Auth. |
| `shops` | Campus restaurant details, menus, hours | Shop Owner / Admin | Publicly discoverable. Financial earnings visible only to owner and admin. |
| `menuItems` | Dish offerings, prices, availability, tags | Shop Owner / Admin | Public read access. Updates restricted to shop owner. |
| `orders` | End-to-end order lifecycle, items, codes | Multi-actor / Escrow engine | Scoped visibility: student reads own, shop owner reads shop's, rider reads assigned. Delivery codes and OTPs visible only to relevant parties. |
| `riderProfiles` | Rider vehicle, status, active status | Rider / Admin | Location and status used for matching. Identity verified by admin. |
| `shopApplications` | Applications to open campus food stalls | Applicant / Admin | Reviewed and approved by platform administrators only. |
| `notifications` | In-app alerts and delivery event feeds | Recipient user | Private to target user (`userId`). Automatically retained for 30 days. |
| `disputes` | Order disputes, complaints, escrow hold | Student / Shop / Admin | Audited dispute tickets resolved by administrators. |
| `ratings` | Reviews and star ratings for shops/riders | Reviewer student | Public aggregate scores; reviewer identities can be anonymized. |

---

## 2. Index Specifications

### Collection: `users`
- `{ email: 1 }` (unique, sparse) — Quick login lookup and prevents duplicate accounts.
- `{ id: 1 }` (unique) — Fast primary key lookups.
- `{ role: 1 }` — Efficient filtering of shop owners, riders, and admins.

### Collection: `shops`
- `{ id: 1 }` (unique) — Primary identifier.
- `{ ownerId: 1 }` — Fast lookup of all shops owned by a merchant.
- `{ approvalStatus: 1 }` — Filter only approved shops for students.

### Collection: `menuItems`
- `{ id: 1 }` (unique) — Primary item identifier.
- `{ shopId: 1 }` — Fetch all menu items for a restaurant in single query.
- `{ isAvailable: 1 }` — Filter active items.

### Collection: `orders`
- `{ id: 1 }` (unique) — Primary order ID.
- `{ orderNumber: 1 }` (unique) — Human-readable order lookup.
- `{ status: 1 }` — High-frequency state filtering (e.g. `ready_for_pickup`).
- `{ studentId: 1, createdAt: -1 }` — Customer order history.
- `{ shopId: 1, createdAt: -1 }` — Restaurant queue and kitchen display.
- `{ riderId: 1, status: 1 }` — Active rider assignment.

### Collection: `notifications`
- `{ userId: 1, createdAt: -1 }` — User inbox retrieval.
- `{ isRead: 1 }` — Unread count badge.

---

## 3. Financial and Security Guarantees
1. **Server-calculated totals**: Price calculation is strictly performed on the server by looking up current `menuItems` records. Client price inputs are never trusted.
2. **Atomic rider claim**: Claim operations use `findOneAndUpdate({ id: orderId, riderId: null, status: "ready_for_pickup" })` ensuring no two riders can ever claim the same order.
3. **Escrow lifecycle**: Payment is marked as `held` in escrow upon order placement and only transitions to `released_to_merchant_and_rider` upon valid delivery code verification.
