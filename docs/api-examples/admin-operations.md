# API Examples: Admin Operations

---

## 1. System Overview Metrics

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

## 2. Admin User Moderation

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
