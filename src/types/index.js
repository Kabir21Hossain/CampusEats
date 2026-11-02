/**
 * Shared domain types used by CampusEats services, routes, components, and tests.
 *
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
 * @property {string} code - Machine-readable error code.
 * @property {string} message - Human-readable explanation.
 * @property {number} [status] - HTTP status associated with the error.
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the operation succeeded.
 * @property {T|null} data - Operation payload when successful.
 * @property {ApiError|null} error - Error envelope when unsuccessful.
 * @property {Record<string, *>} [meta] - Optional pagination or diagnostic metadata.
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} _id - Database identifier.
 * @property {string} userId - Better Auth user identifier.
 * @property {string} displayName - Display name shown in the application.
 * @property {string} phone - Contact phone number.
 * @property {string} studentId - Campus student identifier.
 * @property {UserRole} role - Account role.
 * @property {string} [profilePhotoUrl] - Optional profile image URL.
 * @property {string} dormitoryAddress - Delivery address.
 * @property {'pending' | 'verified' | 'rejected'} verificationStatus - Verification state.
 * @property {boolean} isSuspended - Whether access is suspended.
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date} updatedAt - Last update timestamp.
 */

/**
 * @typedef {Object} Shop
 * @property {string} _id - Database identifier.
 * @property {string} ownerUserId - Owning user identifier.
 * @property {string} name - Shop name.
 * @property {string} slug - URL-friendly shop identifier.
 * @property {string} description - Shop description.
 * @property {{type: 'Point', coordinates: [number, number]}} [campusLocation] - Optional geolocation.
 * @property {Record<string, string>} operatingHours - Operating schedule.
 * @property {boolean} isOpen - Whether the shop accepts orders.
 * @property {'pending' | 'approved' | 'rejected'} approvalStatus - Review state.
 * @property {number} averageRating - Aggregate rating.
 * @property {string} [bannerUrl] - Optional banner image URL.
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date} updatedAt - Last update timestamp.
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} _id - Database identifier.
 * @property {string} shopId - Owning shop identifier.
 * @property {string} name - Display name.
 * @property {string} description - Item description.
 * @property {string} category - Menu category.
 * @property {number} price - Price in the application's currency units.
 * @property {string} [photoUrl] - Optional item image URL.
 * @property {boolean} isAvailable - Whether the item can be ordered.
 * @property {number} preparationTimeMinutes - Estimated preparation time.
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date} updatedAt - Last update timestamp.
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} menuItemId - Menu item identifier.
 * @property {string} name - Snapshot name at checkout.
 * @property {number} quantity - Ordered quantity.
 * @property {number} priceAtOrder - Snapshot price at checkout.
 */

/**
 * @typedef {Object} Order
 * @property {string} _id - Database identifier.
 * @property {string} customerUserId - Customer identifier.
 * @property {string} shopId - Shop identifier.
 * @property {string|null} riderUserId - Assigned rider identifier.
 * @property {OrderItem[]} items - Ordered item snapshots.
 * @property {OrderStatus} status - Current order status.
 * @property {string} deliveryAddressSnapshot - Delivery address captured at checkout.
 * @property {string} [deliveryNote] - Optional delivery instructions.
 * @property {number} subtotal - Item subtotal.
 * @property {number} deliveryFee - Delivery charge.
 * @property {number} total - Total charge.
 * @property {string} currency - Currency code, such as BDT.
 * @property {PaymentStatus} paymentStatus - Payment state.
 * @property {'pending' | 'locked' | 'released' | 'refunded'} escrowStatus - Escrow state.
 * @property {Record<string, Date>} statusTimestamps - Status transition timestamps.
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date} updatedAt - Last update timestamp.
 */

/**
 * @typedef {Object} EscrowLedgerEntry
 * @property {string} _id - Database identifier.
 * @property {string} orderId - Related order identifier.
 * @property {number} amount - Ledger amount.
 * @property {string} currency - Currency code.
 * @property {string} debitAccount - Debited account.
 * @property {string} creditAccount - Credited account.
 * @property {EscrowEventType} eventType - Escrow operation.
 * @property {string} idempotencyKey - Duplicate-prevention key.
 * @property {Record<string, *>} [metadata] - Additional ledger metadata.
 * @property {Date} createdAt - Creation timestamp.
 */

/**
 * @typedef {Object} QRToken
 * @property {string} _id - Database identifier.
 * @property {string} orderId - Related order identifier.
 * @property {string} userId - Token owner identifier.
 * @property {'pickup' | 'delivery'} purpose - Handover purpose.
 * @property {string} tokenHash - Stored token hash.
 * @property {Date} expiresAt - Expiration timestamp.
 * @property {Date|null} usedAt - Consumption timestamp.
 * @property {Date} createdAt - Creation timestamp.
 */

export {};
