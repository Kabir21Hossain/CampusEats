# API Examples: Shops & Menus

---

## 1. List Public Approved Shops

- **Method**: `GET`
- **Path**: `/api/shops`
- **Auth**: Public

### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 3,
  "shops": [
    {
      "id": "shop-1",
      "name": "Campus Grill & Cafe",
      "cuisine": "Burgers & Fast Food",
      "campusLocation": "Central Cafeteria, North Corner",
      "operatingHours": "10:00 AM - 11:30 PM",
      "isOpen": true,
      "rating": 4.8,
      "reviewCount": 342,
      "deliveryTimeMinutes": 25,
      "minimumOrder": 80
    }
  ]
}
```

---

## 2. Get Shop Menu

- **Method**: `GET`
- **Path**: `/api/shops/{{SHOP_ID}}/menu`
- **Auth**: Public

### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "items": [
    {
      "id": "item-101",
      "shopId": "shop-1",
      "name": "Classic Cafeteria Smash Burger",
      "price": 180,
      "category": "Burgers",
      "isAvailable": true
    }
  ]
}
```

---

## 3. Update Shop Profile (IDOR Protected)

- **Method**: `PUT`
- **Path**: `/api/shops/{{SHOP_ID}}`
- **Auth**: Required (`shop_owner` or `admin`)
- **Constraint**: User must own `{{SHOP_ID}}`

### Success Response (`200 OK`)
```json
{
  "success": true,
  "shop": {
    "id": "shop-1",
    "name": "Campus Grill & Cafe",
    "isOpen": true,
    "updatedAt": "2026-03-15T12:00:00.000Z"
  }
}
```

### IDOR Violation Error (`403 Forbidden`)
```json
{
  "success": false,
  "error": "Forbidden: You do not own this shop"
}
```
