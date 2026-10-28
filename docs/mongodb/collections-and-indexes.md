# MongoDB Collections, Schema Rules, and Index Specifications

This document records the MongoDB collections and indexes currently used by
the Express backend. The running application uses the native MongoDB driver
and string `id` values; the illustrative ObjectId schemas in older product
design documents are not the persisted application schema. Better Auth uses
its own `user`, `session`, and `account` collections.

---

## 1. Collections Overview

| Collection | Purpose | Owner / Authority | Retention & Privacy |
|---|---|---|---|
| `user` | Better Auth users and application profile fields | System / Better Auth | Password credentials are managed by Better Auth. |
| `shops` | Campus restaurant details, menus, hours | Shop Owner / Admin | Publicly discoverable. Financial earnings visible only to owner and admin. |
| `menuItems` | Dish offerings, prices, availability, tags | Shop Owner / Admin | Public read access. Updates restricted to shop owner. |
| `orders` | End-to-end order lifecycle, items, and verification-code records | Order workflow / finance service | Scoped visibility: student reads own, shop owner reads shop's, rider reads assigned. Plaintext delivery codes are not stored. |
| `shopApplications` | Applications to open campus food stalls | Applicant / Admin | Reviewed and approved by platform administrators only. |
| `notifications` | Persistent in-app alerts and delivery event feeds | Recipient user | Private to target user (`userId`). |
| `disputes` | Order disputes, complaints, escrow hold | Student / Shop / Admin | Audited dispute tickets resolved by administrators. |
| `orderReviews` | Student reviews associated with a delivered order | Reviewer student | Unique per order; contains shop, item, and rider review data where available. |
| `payments` | Shop and platform payment obligations and manual references | Student / Admin | References are claims pending manual verification; not provider-confirmed payments. |
| `wallets` | Transactionally maintained integer-paisa balance projections | Finance service | Reconciled against append-only `ledger` entries. |
| `ledger` | Append-only financial postings | Finance service | Unique `idempotencyKey` per logical posting. |
| `payouts` | Rider payout requests and review/transfer state | Rider / Admin | `paid` is set only through the confirmation workflow; external transfer remains manual. |
| `auditLogs` | Administrative and financial audit events | Backend services | Records actor, action, target, reason, metadata, and timestamp. |

---

## 2. Index Specifications

### Collection: `user`
- `{ email: 1 }` (unique, sparse) — Quick login lookup and prevents duplicate accounts.
- `{ role: 1 }` — Efficient filtering of shop owners, riders, and admins.
- `{ role: 1, isOnline: 1, isApproved: 1, verificationStatus: 1 }` — Rider availability eligibility.

### Collection: `shops`
- `{ id: 1 }` (unique) — Primary identifier.
- `{ ownerId: 1 }` — Fast lookup of all shops owned by a merchant.
- `{ approvalStatus: 1 }` — Filter only approved shops for students.

### Collection: `menuItems`
- `{ id: 1 }` (unique) — Primary item identifier.
- `{ shopId: 1 }` — Fetch all menu items for a restaurant in single query.
- `{ shopId: 1, isAvailable: 1 }` — Filter available items within a shop.

### Collection: `orders`
- `{ id: 1 }` (unique) — Primary order ID.
- `{ orderNumber: 1 }` (unique for string values when legacy data is clean) — Human-readable order lookup. Startup checks for duplicates first; if legacy duplicates exist, it creates a non-unique lookup index and logs that cleanup is required before uniqueness can be enabled.
- An existing order-number index is preserved as-is. Migrating a pre-existing non-unique order-number index to unique requires a separately reviewed migration.
- `{ studentId: 1, idempotencyKey: 1 }` (unique, partial for string keys) — Prevents duplicate checkout orders for a student; legacy orders without keys are excluded.
- `{ status: 1 }` — High-frequency state filtering (e.g. `ready_for_pickup`).
- `{ studentId: 1, createdAt: -1 }` — Customer order history.
- `{ shopId: 1, status: 1, createdAt: -1 }` — Shop queue.
- `{ shopOwnerId: 1 }` — Owner order lookup.
- `{ riderId: 1 }` — Assigned rider lookup.
- `{ riderId: 1, status: 1, updatedAt: -1 }` — Rider active jobs.
- `{ status: 1, createdAt: -1 }` — Status/date filters.
- `{ status: 1, riderId: 1 }` — Atomic available rider claim.
- `{ activeRiderId: 1 }` (unique, partial for string values) — Reservation
  for newly claimed orders; delivery completion clears it.
- `{ riderId: 1 }` and `{ riderUserId: 1 }` (each unique, partial to active
  order statuses and string values) — Enforce one active order per rider for
  both canonical and legacy assignment fields. Startup checks for duplicate
  active assignments and skips the affected unique index with a warning rather
  than changing legacy data; resolve duplicates before relying on that field's
  database constraint.
- `{ createdAt: -1 }` — Newest-first order queries.

Checkout stores the idempotency key and a SHA-256 hash of normalized order
intent on the order record. A matching retry returns a code-free summary; reusing
the key with different intent is rejected.

### Collection: `orderReviews`
- `{ orderId: 1 }` (unique) — One review document per order.
- `{ shopId: 1, createdAt: -1 }` and `{ riderId: 1, createdAt: -1 }` — Review history for shops and riders.

### Collection: `notifications`
- `{ id: 1 }` (unique, sparse) — Application notification ID.
- `{ userId: 1, createdAt: -1 }` — User inbox retrieval.
- `{ userId: 1, isRead: 1 }` — User-scoped unread count.
- `{ userId: 1, isRead: 1, createdAt: -1 }` — User-scoped unread and recent list queries.
- `{ idempotencyKey: 1 }` (unique, sparse) — Prevents duplicate event notifications.

### Collections: `payments`, `wallets`, `ledger`, `payouts`, and `auditLogs`
- `payments`: `{ id: 1 }` (unique), `{ orderId: 1, obligation: 1 }` (unique), and `{ orderId: 1, createdAt: -1 }`. Normalized submitted and refund references retain partial non-unique lookup indexes for legacy compatibility. A partial unique `{ activeReference: 1 }` index reserves newly submitted references until rejection releases the claim. The submission path also checks normalized references on legacy active records. Existing indexes are preserved as-is; review legacy duplicate data and unique reference indexes before migration.
- `wallets`: `{ ownerId: 1, ownerType: 1 }` (unique) — One balance projection per account type.
- `ledger`: `{ idempotencyKey: 1 }` (unique), `{ ownerId: 1, createdAt: -1 }`, and `{ ownerId: 1, ownerType: 1, createdAt: -1 }`.
- `payouts`: `{ id: 1 }` (unique), `{ riderId: 1, idempotencyKey: 1 }` (unique, sparse), `{ riderId: 1, createdAt: -1 }`, `{ status: 1, createdAt: 1 }`, and a unique partial `{ payoutReferenceNormalized: 1 }` index for finalized transfers. Older records without the normalized field remain protected by an explicit normalized legacy-reference check.
- `auditLogs`: `{ id: 1 }` (unique), `{ createdAt: -1, id: -1 }` for paginated audit review, `{ targetId: 1, createdAt: -1 }`, and `{ actorId: 1, createdAt: -1 }`.

The backend validates newly constructed order, payment, wallet, ledger,
payout, notification, and audit documents in
`backend/src/models/documents.js`. Validation uses the persisted string IDs
and paisa-based balance fields. It does not rewrite, backfill, or reject
historical documents during startup.

The admin reconciliation endpoint aggregates all posted ledger entries once,
then compares each supported wallet balance projection and reports non-zero
ledger groups without a wallet. External clearing accounts are excluded from
wallet-owner comparisons. Reconciliation is read-only apart from its audit
record; it does not repair balances or rewrite ledger history.

---

## 3. Financial and Security Guarantees
1. **Server-calculated totals**: The Express checkout looks up current `menuItems` records and calculates totals in integer paisa. Client price inputs are not authoritative.
2. **Atomic rider claim**: The repository conditionally claims only an available order and checks both current and legacy rider-assignment fields. Unique partial indexes for `activeRiderId`, `riderId`, and `riderUserId` prevent concurrent multiple active claims when legacy duplicate active assignments have been resolved.
3. **Manual payment review**: Shop and platform obligations are separate records and remain unverified until an administrator confirms the submitted reference. This is not a provider-confirmed escrow integration.
4. **Append-only postings**: Finance updates wallet projections and unique-idempotency ledger records in MongoDB transactions.
