# API Examples: Orders & Checkout

---

## 1. Create Order (Checkout)

- **Method**: `POST`
- **Path**: `/api/orders`
- **Auth**: Required (`student` or `admin`)
- **Note**: Pricing is verified and calculated server-side.

### Request Example
```http
POST /api/orders HTTP/1.1
Host: localhost:5000
Cookie: campuseats_user_id={{STUDENT_USER_ID}}; campuseats_role=student
Content-Type: application/json
Idempotency-Key: {{CHECKOUT_ATTEMPT_UUID}}

{
  "shopId": "shop-1",
  "items": [
    { "id": "item-101", "quantity": 2 },
    { "id": "item-103", "quantity": 1 }
  ],
  "deliveryLocation": "Al Beruni Hall, Room 314",
  "deliveryNotes": "Call when entering main gate",
  "paymentMethod": "bKash"
}
```

Send a fresh UUID as `Idempotency-Key` for each distinct checkout. Retrying the
same normalized request with the same key returns the already-created order;
reusing a key with different order details returns `409 IDEMPOTENCY_KEY_REUSED`.

### Success Response (`201 Created`; retry replay: `200 OK`)
```json
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "id": "ord_9dbd8f56-9903-4f34-8f31-bd6cc19d7dc0",
    "orderNumber": "CE-9DBD8F5699034F348F31BD6CC19D7DC0",
    "shopId": "shop-1",
    "shopName": "Campus Grill & Cafe",
    "items": [
      {
        "id": "item-101",
        "name": "Classic Cafeteria Smash Burger",
        "unitPricePaisa": 18000,
        "unitPriceBdt": 180,
        "quantity": 2,
        "linePaisa": 36000,
        "lineBdt": 360
      },
      {
        "id": "item-103",
        "name": "Peri Peri French Fries",
        "unitPricePaisa": 8000,
        "unitPriceBdt": 80,
        "quantity": 1,
        "linePaisa": 8000,
        "lineBdt": 80
      }
    ],
    "subtotalPaisa": 44000,
    "subtotalBdt": 440,
    "deliveryFeePaisa": 2000,
    "deliveryFeeBdt": 20,
    "platformFeePaisa": 500,
    "platformFeeBdt": 5,
    "totalPaisa": 46500,
    "totalBdt": 465,
    "status": "pending_shop_acceptance",
    "paymentStatus": "pending_verification",
    "createdAt": "2026-10-28T00:00:00.000Z"
  }
}
```

The create response is a summary only; verification codes, code hashes,
encrypted code material, and payment recipient records are not included.

---

## 2. Get Order Detail (IDOR Protection)

- **Method**: `GET`
- **Path**: `/api/orders/{{ORDER_ID}}`
- **Auth**: Required (Owner student, merchant owner, assigned rider, or admin)

### Success Response (`200 OK`)
```json
{
  "success": true,
  "order": {
    "id": "{{ORDER_ID}}",
    "orderNumber": "CE-481920",
    "status": "ready_for_pickup",
    "total": 465
  }
}
```

### Shop-owner queue

The shop-owner `GET /api/orders` response is restricted to shops owned by the
authenticated account. It is paginated (50 per page by default, maximum 100)
and accepts `page`, `limit`, `status`, `from=YYYY-MM-DD`, and
`to=YYYY-MM-DD` filters. The end date is inclusive. `meta` reports the current
page, page size, result total, and total pages.

Order-list responses never include the pickup code. After the order is ready
and a rider has claimed it, the shop owner may retrieve its fresh, short-lived
pickup code from the authorized `GET /api/orders/{{ORDER_ID}}` detail response.
The code is generated when the shop marks the order ready, and is persisted as
a hash plus encrypted disclosure material and expiry; plaintext legacy code
fields are removed.

The separate student delivery code is issued only when the assigned rider
successfully verifies pickup. It is returned only to the owning student in
order detail while the order is `picked_up`; rider, shop-owner, and admin
serializations never include it. Verification codes expire after 24 hours,
allow five failed attempts per order, and are atomically consumed on success.

### Shop status transition examples

- Accept only a pending order with `PATCH /api/orders/{{ORDER_ID}}/status` and
  `{"status":"accepted"}`.
- Begin kitchen preparation only from accepted with `{"status":"preparing"}`.
- Mark ready only from preparing with `{"status":"ready_for_pickup"}`; both
  payment obligations must already be verified.
- Reject only a pending order with a non-empty `rejectionReason` (maximum 500
  characters). The reason is recorded in status history and shared with the
  student.

### IDOR Violation (`404 Not Found`)
```json
{
  "success": false,
  "error": "Order not found."
}
```
