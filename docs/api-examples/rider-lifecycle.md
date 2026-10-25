# API Examples: Rider Operations & Dual Pickup Notification

---

## 1. List Available Orders

- **Method**: `GET`
- **Path**: `/api/rider/available-orders`
- **Auth**: Required (`rider` or `admin`)

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
      "deliveryLocation": "Al Beruni Hall, Room 314"
    }
  ]
}
```

---

## 2. Atomic Order Claim

- **Method**: `POST`
- **Path**: `/api/rider/claim`
- **Auth**: Required (`rider` or `admin`)

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
  "message": "Order claimed successfully",
  "order": {
    "id": "ord_1710499200000_x9y8z7",
    "riderId": "{{RIDER_USER_ID}}",
    "riderName": "Tariqul Hasan",
    "claimedAt": "2026-03-15T12:35:00.000Z"
  }
}
```

### Double Claim Race Rejection (`409 Conflict`)
```json
{
  "success": false,
  "error": "Conflict: This order has already been claimed by another rider or is not eligible.",
  "code": "ORDER_ALREADY_CLAIMED"
}
```

---

## 3. Verify Pickup (Sends Dual Email to Student + Merchant)

- **Method**: `POST`
- **Path**: `/api/rider/verify-pickup`
- **Auth**: Required (`rider` assigned to order, or `admin`)

### Request Example
```http
POST /api/rider/verify-pickup HTTP/1.1
Host: localhost:5000
Cookie: campuseats_user_id={{RIDER_USER_ID}}; campuseats_role=rider
Content-Type: application/json

{
  "orderId": "ord_1710499200000_x9y8z7",
  "pickupOtp": "5124"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Pickup verified successfully. Customer and shop owner notified.",
  "order": {
    "id": "ord_1710499200000_x9y8z7",
    "status": "in_transit",
    "pickedUpAt": "2026-03-15T12:40:00.000Z"
  }
}
```

---

## 4. Verify Delivery (Customer Drop-off & Escrow Release)

- **Method**: `POST`
- **Path**: `/api/rider/verify-delivery`
- **Auth**: Required (`rider` assigned to order, or `admin`)

### Request Example
```http
POST /api/rider/verify-delivery HTTP/1.1
Host: localhost:5000
Cookie: campuseats_user_id={{RIDER_USER_ID}}; campuseats_role=rider
Content-Type: application/json

{
  "orderId": "ord_1710499200000_x9y8z7",
  "deliveryCode": "DEL982"
}
```

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
