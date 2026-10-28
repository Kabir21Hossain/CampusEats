# API Examples: Rider Delivery Operations

---

## 1. List Available Orders

- **Method**: `GET`
- **Path**: `/api/rider/available-orders?page=1&limit=50`
- **Auth**: Required (`rider`, active and approved, and online)
- **Pagination**: `page` defaults to `1` and is limited to `1–1000000`;
  `limit` defaults to `50` and is limited to `1–100`. Only unassigned
  `ready_for_pickup` orders are listed. Riders with an active delivery receive
  an empty job list until that delivery is completed.

### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 1,
  "orders": [
    {
      "id": "ord_1710499200000_x9y8z7",
      "orderNumber": "CE-481920",
      "shopName": "Campus Grill & Cafe",
      "status": "ready_for_pickup",
      "deliveryAddressSnapshot": "Al Beruni Hall, Room 314"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 2. Atomic Order Claim

- **Method**: `POST`
- **Path**: `/api/rider/claim`
- **Auth**: Required (`rider`, active and approved, and online)

### Request Example
```http
POST /api/rider/claim HTTP/1.1
Host: localhost:5000
Cookie: campuseats_user_id={{RIDER_USER_ID}}; campuseats_role=rider
Content-Type: application/json

{
  "orderId": "ord_1710499200000_x9y8z7"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Order claimed successfully.",
  "order": {
    "id": "ord_1710499200000_x9y8z7",
    "riderId": "{{RIDER_USER_ID}}",
    "riderName": "Tariqul Hasan",
    "status": "rider_assigned",
    "riderAssignedAt": "2026-03-15T12:35:00.000Z"
  }
}
```

The claim is an atomic order transition and a unique partial index permits
only one active order per rider. Retrying a claim for the same order while it
is still active returns that claim; a different active claim receives
`409 RIDER_HAS_ACTIVE_DELIVERY`.

### Double Claim Race Rejection (`409 Conflict`)
```json
{
  "success": false,
  "error": "Conflict: This order has already been claimed by another rider or is not eligible.",
  "code": "ORDER_ALREADY_CLAIMED"
}
```

### Rider Already Has an Active Delivery (`409 Conflict`)
```json
{
  "success": false,
  "error": "Complete your active delivery before claiming another order.",
  "code": "RIDER_HAS_ACTIVE_DELIVERY"
}
```

---

## 3. Verify Pickup (Issues the Delivery Code)

- **Method**: `POST`
- **Path**: `/api/rider/verify-pickup`
- **Auth**: Required (the assigned, active rider)
- **Code lifecycle**: The shop handover code is shown only in the owning shop
  account's authorized order detail after readiness. The assigned rider submits
  it here. Success consumes it and issues a distinct delivery code to the order
  record; that delivery code is revealed only to the student after pickup.

### Request Example
```http
POST /api/rider/verify-pickup HTTP/1.1
Host: localhost:5000
Cookie: campuseats_user_id={{RIDER_USER_ID}}; campuseats_role=rider
Content-Type: application/json

{
  "orderId": "ord_1710499200000_x9y8z7",
  "shopHandoverCode": "A2BCDE"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Pickup verified. Student and shop owner notified.",
  "order": {
    "id": "ord_1710499200000_x9y8z7",
    "status": "picked_up",
    "pickedUpAt": "2026-03-15T12:40:00.000Z"
  }
}
```

---

## 4. Verify Delivery (Customer Drop-off & Settlement)

- **Method**: `POST`
- **Path**: `/api/rider/verify-delivery`
- **Auth**: Required (the assigned, active rider)
- **Code lifecycle**: The student sees the delivery code only after pickup.
  The rider must ask the student for it at handover; generic rider order
  responses never disclose it.

### Request Example
```http
POST /api/rider/verify-delivery HTTP/1.1
Host: localhost:5000
Cookie: campuseats_user_id={{RIDER_USER_ID}}; campuseats_role=rider
Content-Type: application/json

{
  "orderId": "ord_1710499200000_x9y8z7",
  "studentDeliveryCode": "F3GHJK"
}
```

Verification codes are six characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`,
expire after two hours, and allow at most five failed attempts per order. Both
verification endpoints also apply a 15-minute account-and-IP rate limit.
Expired, invalid, exhausted, reused, and wrong-stage submissions do not
advance the order.

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Order successfully delivered! Escrow funds released.",
  "order": {
    "id": "ord_1710499200000_x9y8z7",
    "status": "delivered",
    "escrowStatus": "released_to_merchant_and_rider",
    "deliveredAt": "2026-03-15T13:05:00.000Z"
  }
}
```
