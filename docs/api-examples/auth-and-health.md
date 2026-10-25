# API Examples: Health & Authentication

This document provides schema specifications and request/response examples for health checks and authentication endpoints.

---

## 1. Safe Health Check

- **Method**: `GET`
- **Path**: `/api/health`
- **Auth**: Public (None)
- **Allowed Roles**: Any

### Request Example
```http
GET /api/health HTTP/1.1
Host: localhost:5000
Accept: application/json
```

### Success Response (`200 OK`)
```json
{
  "status": "healthy",
  "timestamp": "2026-03-15T10:00:00.000Z",
  "uptimeSeconds": 3600,
  "services": {
    "api": {
      "status": "running"
    },
    "database": {
      "connected": true,
      "database": "campuseats",
      "status": "ready"
    }
  }
}
```

### Degraded Response (`503 Service Unavailable`)
```json
{
  "status": "degraded",
  "timestamp": "2026-03-15T10:00:00.000Z",
  "uptimeSeconds": 12,
  "services": {
    "api": { "status": "running" },
    "database": {
      "connected": false,
      "database": "campuseats",
      "status": "degraded",
      "error": "Database unreachable"
    }
  }
}
```

---

## 2. Get Current Authenticated User & Session

- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: Required (`campuseats_user_id` cookie or Better Auth session)
- **Allowed Roles**: `student`, `shop_owner`, `rider`, `admin`

### Request Example
```http
GET /api/auth/me HTTP/1.1
Host: localhost:5000
Cookie: campuseats_user_id={{USER_ID}}; campuseats_role=student
Accept: application/json
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "{{USER_ID}}",
    "name": "Nafis Fuad",
    "email": "nafis.fuad@example.com",
    "role": "student",
    "studentId": "2021-CS-042",
    "department": "Computer Science & Engineering",
    "hall": "Al Beruni Hall",
    "phone": "+8801711000001",
    "isApproved": true,
    "isSuspended": false
  },
  "session": {
    "id": "sess-{{USER_ID}}",
    "userId": "{{USER_ID}}",
    "expiresAt": "2026-03-22T10:00:00.000Z"
  }
}
```

### Error Response (`401 Unauthorized`)
```json
{
  "success": false,
  "error": "Unauthorized: Valid session required",
  "code": "UNAUTHORIZED"
}
```

---

## 3. Student Registration

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: Public
- **Allowed Roles**: Student registration and pending shop-owner/rider applications; first admin uses the configured bootstrap email.

### Request Example
```http
POST /api/auth/register HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "name": "Sadia Islam",
  "email": "sadia.islam@example.com",
  "password": "{{STUDENT_PASSWORD}}",
  "role": "student",
  "studentId": "2022-ECO-108",
  "department": "Economics",
  "hall": "Jahanara Imam Hall",
  "phone": "+8801711000002"
}
```

### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Student account created successfully.",
  "user": {
    "id": "usr_1710499200000_a1b2c3",
    "name": "Sadia Islam",
    "email": "sadia.islam@example.com",
    "role": "student",
    "studentId": "2022-ECO-108",
    "department": "Economics",
    "hall": "Jahanara Imam Hall",
    "phone": "+8801711000002",
    "isApproved": true,
    "isSuspended": false
  }
}
```

### Unauthorized Admin Bootstrap (`403 Forbidden`)
```json
{
  "success": false,
  "error": "Forbidden: Privileged roles (shop_owner, rider, admin) require administrative approval."
}
```
