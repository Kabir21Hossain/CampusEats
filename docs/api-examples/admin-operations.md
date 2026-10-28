# API Examples: Admin Operations

---

## 1. Manual Payment Review

Payment references are claims, not provider-confirmed payments. An admin must
compare each submitted reference with the trusted bKash merchant records before
verifying it. CampusEats does not query a bKash provider API.

- **Queue**: `GET /api/payments?status=pending_verification&page=1&limit=20`
- **Verify**: `POST /api/payments/{{PAYMENT_ID}}/verify`
- **Reject**: `POST /api/payments/{{PAYMENT_ID}}/reject` with
  `{"reason":"Reference not found in the merchant account."}`
- **Access**: Required (`admin` only)

The review queue is ordered newest first, is limited to 100 records per page,
and supports the `not_submitted`, `pending_verification`, `verified`,
`rejected`, `refunded`, `expired`, and `all` filters. Invalid filters or
pagination values return `422`. A submitted transaction reference remains
reserved until its payment is rejected; it cannot be claimed by another
payment. Rejected references can be resubmitted after review.

Verification and ledger posting run in a MongoDB transaction. Verify only after
checking the merchant account; TEST references are clearly marked and cannot
be paid out.

## 2. Rider Payout Operations

The admin queue is bounded and status-filtered:

- **Queue**: `GET /api/admin/payouts?page=1&limit=20&status=requested`
- **Approve**: `POST /api/admin/payouts/{{PAYOUT_ID}}/approve`
- **Begin transfer**: `POST /api/admin/payouts/{{PAYOUT_ID}}/processing`
- **Record completed transfer**: `POST /api/admin/payouts/{{PAYOUT_ID}}/mark-paid`
  with `{"payoutReference":"ACTUAL-TRANSFER-REFERENCE"}`
- **Reject/fail**: `POST /api/admin/payouts/{{PAYOUT_ID}}/reject` or `/fail`
  with a non-empty `reason`

Only mark a payout paid after confirming the transfer externally. The normalized
reference is globally unique; duplicate references return `409
DUPLICATE_PAYOUT_REFERENCE`. A rejected or failed payout releases the reserved
funds in the same transaction as the status and ledger updates. Payout actions
are recorded in the admin audit log.

### Wallet reconciliation

- **Method**: `GET`
- **Path**: `/api/admin/finance/reconciliation`
- **Auth**: Required (`admin` only)

The endpoint aggregates posted ledger entries and compares their supported
balance totals to each wallet. It also reports non-zero ledger balances without
a wallet. It never repairs balances or changes ledger entries; only the audit
record for the run is written. Financial transactions and auditable payout
decisions require a replica set or sharded MongoDB deployment.

## 3. Audit History

- **Method**: `GET`
- **Path**: `/api/admin/audit-logs?page=1&limit=25&action=admin.dispute_resolved`
- **Auth**: Required (`admin` only)

The endpoint returns newest-first, bounded audit events. Exact `action`,
`actorId`, and `targetId` filters may be combined. Results include the recorded
reason and metadata; audit history is read-only through this API.

---

## 4. System Overview Metrics

- **Method**: `GET`
- **Path**: `/api/admin/overview`
- **Auth**: Required (`admin` only)

### Success Response (`200 OK`)
```json
{
  "success": true,
  "stats": {
    "totalUsers": 7,
    "totalOrders": 3,
    "totalShops": 3,
    "completedDeliveries": 1,
    "grossVolumeBdt": 235,
    "platformRevenueBdt": 5
  }
}
```

### Non-Admin Access Rejection (`403 Forbidden`)
```json
{
  "success": false,
  "error": "Forbidden: Access restricted for role 'student'",
  "code": "FORBIDDEN"
}
```

---

## 5. Admin User Moderation

- **Method**: `PATCH`
- **Path**: `/api/admin/users/{{USER_ID}}`
- **Auth**: Required (`admin` only)

### Request Example
```http
PATCH /api/admin/users/student-2 HTTP/1.1
Host: localhost:5000
Cookie: campuseats_user_id={{ADMIN_USER_ID}}; campuseats_role=admin
Content-Type: application/json

{
  "role": "shop_owner",
  "isApproved": true
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "student-2",
    "name": "Sadia Islam",
    "email": "sadia.islam@example.com",
    "role": "shop_owner",
    "isApproved": true,
    "isSuspended": false,
    "updatedAt": "2026-03-15T15:00:00.000Z"
  }
}
```
