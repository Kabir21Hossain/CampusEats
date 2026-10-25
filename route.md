# CampusEats Backend – Complete API Route Reference

**Base URL:** `http://localhost:5000/api`  
**Authentication:** Send session cookie (credentials: include) **or** `Authorization: Bearer <token>` **or** `x-user-id` header.

Use this file when connecting the frontend or instructing AI agents.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| Public | No authentication required |
| Protected | Requires valid session (`requireSession`) |
| Role | Must have one of the listed roles (`requireRole`) |

---

## 1. Health

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/health` | Public | Server + MongoDB health check |

---

## 2. Authentication (`/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/auth/me` | Protected | Get current logged-in user + session |
| POST | `/auth/register` | Public | Register a new **student** account only |
| * | `/auth/*` | Public / Better Auth | All other Better Auth routes (sign-in, sign-out, session, etc.) are handled by Better Auth handler |

### Register Body Example
```json
{
  "email": "student@du.ac.bd",
  "password": "securePassword123",
  "name": "Student Name",
  "role": "student",
  "studentId": "2023-12345",
  "department": "CSE",
  "hall": "Fazlul Haque Muslim Hall",
  "phone": "017XXXXXXXX"
}
```

> Note: Only `role: "student"` is allowed on public registration. Shop Owner, Rider, and Admin accounts must be created by an Admin.

---

## 3. Shops (`/shops`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/shops` | Public | List all shops |
| GET | `/shops/:id` | Public | Get single shop details |
| GET | `/shops/:id/menu` | Public | Get menu items of a shop |
| POST | `/shops` | Protected + Role: `shop_owner`, `admin` | Create a new shop |
| PUT | `/shops/:id` | Protected + Role: `shop_owner` (own shop), `admin` | Update shop details |

### Create Shop Body Example
```json
{
  "name": "New Campus Canteen",
  "campusZone": "Science Building Area",
  "location": "Near Gate 3",
  "description": "Fresh meals every day",
  "cuisine": "Bengali",
  "logo": "/images/shops/new-logo.jpg",
  "banner": "/images/shops/new-banner.jpg"
}
```

---

## 4. Orders (`/orders`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/orders` | Protected + Role: `student`, `admin` | Place a new order (checkout) |
| GET | `/orders` | Protected | List orders (filtered by role automatically) |
| GET | `/orders/:id` | Protected | Get single order (IDOR protected) |
| PATCH | `/orders/:id/status` | Protected + Role: `shop_owner`, `admin` | Update order status (accept, preparing, ready_for_pickup, cancelled) |

### Place Order Body Example
```json
{
  "shopId": "shop_001",
  "items": [
    { "id": "menu_001", "quantity": 1 },
    { "id": "menu_004", "quantity": 2 }
  ],
  "deliveryLocation": "Fazlul Haque Muslim Hall, Room 214",
  "deliveryNotes": "Call when you arrive",
  "paymentMethod": "bkash"
}
```

### Update Status Body Example
```json
{
  "status": "ready_for_pickup"
}
```

Allowed status values for shop owner: `accepted`, `preparing`, `ready_for_pickup`, `cancelled`

---

## 5. Rider (`/rider`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/rider/available-orders` | Protected + Role: `rider`, `admin` | List orders ready to be claimed |
| POST | `/rider/claim` | Protected + Role: `rider`, `admin` | Claim an order (atomic) |
| POST | `/rider/verify-pickup` | Protected + Role: `rider`, `admin` | Confirm pickup at shop (moves to in_transit) |
| POST | `/rider/verify-delivery` | Protected + Role: `rider`, `admin` | Confirm delivery to student (releases escrow) |

### Claim Order Body
```json
{
  "orderId": "ord_002"
}
```

### Verify Pickup Body
```json
{
  "orderId": "ord_002",
  "pickupOtp": "B3N8"
}
```

### Verify Delivery Body
```json
{
  "orderId": "ord_001",
  "deliveryCode": "X2M4P8"
}
```

---

## 6. Admin (`/admin`)

All admin routes require `requireSession` + `requireRole("admin")`.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/overview` | Protected + Role: `admin` | Platform statistics (users, orders, revenue) |
| GET | `/admin/users` | Protected + Role: `admin` | List all users |
| PATCH | `/admin/users/:id` | Protected + Role: `admin` | Update user role / approval / suspension |

### Update User Body Example
```json
{
  "role": "shop_owner",
  "isApproved": true,
  "isSuspended": false
}
```

---

## 7. Order Status Flow (Reference)

```
placed
  → accepted          (shop owner)
  → preparing         (shop owner)
  → ready_for_pickup  (shop owner)
  → in_transit        (rider after verify-pickup)
  → delivered         (rider after verify-delivery)
```

Possible cancellation: `cancelled` (by shop owner or admin)

---

## 8. Quick Frontend Integration Tips

1. Always send `credentials: "include"` for cookie-based sessions.
2. Or store the session token and send it as:
   ```
   Authorization: Bearer <token>
   ```
3. After successful login, call `GET /api/auth/me` to get the current user and role.
4. Protect frontend routes according to the role returned by `/auth/me`.
5. Public pages (Home, Shop list, Shop menu) do **not** need a token.
6. All order, rider, and admin actions **must** send a valid token/session.

---

## 9. Error Response Format (Standard)

```json
{
  "success": false,
  "error": "Human readable message",
  "code": "UNAUTHORIZED" | "FORBIDDEN" | "ORDER_ALREADY_CLAIMED" | etc.
}
```

Success responses always include `"success": true`.

---

**File generated for CampusEats project – use this as the single source of truth for backend routes.**
