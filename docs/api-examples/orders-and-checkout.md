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

{
  "shopId": "shop-1",
  "items": [
    { "id": "item-101", "quantity": 2 },
    { "id": "item-103", "quantity": 1 }
  ],
  "deliveryLocation": "Al Beruni Hall, Room 314",
  "deliveryNotes": "Call when entering main gate",
  "paymentMethod": "bkash"
}
```

### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "id": "ord_1710499200000_x9y8z7",
    "orderNumber": "CE-481920",
    "studentId": "{{STUDENT_USER_ID}}",
    "customerName": "Nafis Fuad",
    "customerEmail": "nafis.fuad@example.com",
    "shopId": "shop-1",
    "shopName": "Campus Grill & Cafe",
    "items": [
      {
        "id": "item-101",
        "name": "Classic Cafeteria Smash Burger",
        "price": 180,
        "quantity": 2,
        "subtotal": 360
      },
      {
        "id": "item-103",
        "name": "Peri Peri French Fries",
        "price": 80,
        "quantity": 1,
        "subtotal": 80
      }
    ],
    "subtotal": 440,
    "deliveryFee": 20,
    "platformFee": 5,
    "total": 465,
    "status": "placed",
    "escrowStatus": "held",
    "deliveryCode": "DEL982",
    "pickupOtp": "5124"
  }
}
```

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

### IDOR Violation (`403 Forbidden`)
```json
{
  "success": false,
  "error": "Forbidden: You are not authorized to view this order"
}
```
