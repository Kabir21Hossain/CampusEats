# CampusEats — Comprehensive JSDoc Documentation Task

You are an expert JavaScript software architect. Document the entire **CampusEats** project using production-grade, complete JSDoc annotations.

## 1. Core Directives
1. **Pure JavaScript (ES Modules)**: Strictly NO TypeScript syntax (`interface`, `type =`, `as`, `enum`, `<T>`). Use only standard `.js` / `.mjs` files.
2. **Do Not Break Code**: Do NOT rewrite or alter runtime logic. Only prepend JSDoc blocks (`/** ... */`) above functions, classes, models, and exported constants.
3. **Exhaustive Coverage**: Every exported function, controller, middleware, service method, repository query, Mongoose schema, utility, API client function, and custom React hook must be annotated.

---

## 2. Canonical Typedef Registry
Ensure these unified types are referenced or defined in the shared types directory (e.g., `packages/shared/types/index.js` or `apps/web/src/types/index.js`):

```javascript
/**
 * @typedef {'student' | 'shop_owner' | 'rider' | 'admin'} UserRole
 */

/**
 * @typedef {'placed' | 'confirmed' | 'awaiting_rider' | 'claimed' | 'in_transit' | 'delivered' | 'cancelled' | 'rejected' | 'disputed'} OrderStatus
 */

/**
 * @typedef {'pending' | 'completed' | 'failed' | 'refunded'} PaymentStatus
 */

/**
 * @typedef {'lock' | 'release' | 'refund' | 'adjustment'} EscrowEventType
 */

/**
 * @typedef {Object} ApiError
 * @property {string} code - Machine-readable error code (e.g., 'FORBIDDEN', 'NOT_FOUND').
 * @property {string} message - Human-readable explanation.
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Operation status flag.
 * @property {T|null} data - Data payload on success.
 * @property {ApiError|null} error - Error envelope if unsuccessful.
 * @property {Record<string, *>} [meta] - Metadata (pagination, trace IDs).
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} _id
 * @property {string} userId - Reference to Better Auth user.
 * @property {string} displayName
 * @property {string} phone
 * @property {string} studentId
 * @property {UserRole} role
 * @property {string} [profilePhotoUrl]
 * @property {string} dormitoryAddress
 * @property {'pending' | 'verified' | 'rejected'} verificationStatus
 * @property {boolean} isSuspended
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} Shop
 * @property {string} _id
 * @property {string} ownerUserId
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {{ type: 'Point', coordinates: [number, number] }} [campusLocation]
 * @property {Record<string, string>} operatingHours
 * @property {boolean} isOpen
 * @property {'pending' | 'approved' | 'rejected'} approvalStatus
 * @property {number} averageRating
 * @property {string} [bannerUrl]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} _id
 * @property {string} shopId
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {number} price - Integer minor units or standard decimal representation.
 * @property {string} [photoUrl]
 * @property {boolean} isAvailable
 * @property {number} preparationTimeMinutes
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} menuItemId
 * @property {string} name - Snapshot name at checkout.
 * @property {number} quantity
 * @property {number} priceAtOrder - Snapshot price at checkout.
 */

/**
 * @typedef {Object} Order
 * @property {string} _id
 * @property {string} customerUserId
 * @property {string} shopId
 * @property {string|null} riderUserId
 * @property {OrderItem[]} items
 * @property {OrderStatus} status
 * @property {string} deliveryAddressSnapshot
 * @property {string} [deliveryNote]
 * @property {number} subtotal
 * @property {number} deliveryFee
 * @property {number} total
 * @property {string} currency - e.g., 'BDT'
 * @property {PaymentStatus} paymentStatus
 * @property {'pending' | 'locked' | 'released' | 'refunded'} escrowStatus
 * @property {Record<string, Date>} statusTimestamps
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} EscrowLedgerEntry
 * @property {string} _id
 * @property {string} orderId
 * @property {number} amount
 * @property {string} currency
 * @property {string} debitAccount
 * @property {string} creditAccount
 * @property {EscrowEventType} eventType
 * @property {string} idempotencyKey
 * @property {Record<string, *>} [metadata]
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} QRToken
 * @property {string} _id
 * @property {string} orderId
 * @property {string} userId
 * @property {'pickup' | 'delivery'} purpose
 * @property {string} tokenHash
 * @property {Date} expiresAt
 * @property {Date|null} usedAt
 * @property {Date} createdAt
 */