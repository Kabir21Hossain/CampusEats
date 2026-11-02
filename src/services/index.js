import { apiRequest, createErrorResponse, createSuccessResponse } from "./api-client";
import { ORDER_STATUS } from "@/lib/constants";

/**
 * Arrow function responseItem.
 * @param {*} response - Input value used by the operation.
 * @param {*} key - Input value used by the operation.
 * @returns {*} The operation result.
 */
const responseItem = (response, key) => response.data?.[key];

/**
 * Function normalizeShop.
 * @param {*} shop - Input value used by the operation.
 * @returns {*} The operation result.
 */
function normalizeShop(shop) {
  return {
    ...shop,
    campusLocation: shop.campusLocation || shop.location || shop.campusZone || "",
    bannerUrl: shop.bannerUrl || shop.banner || "",
    logoUrl: shop.logoUrl || shop.logo || "",
    ownerUserId: shop.ownerUserId || shop.ownerId,
  };
}

/**
 * Function normalizeMenuItem.
 * @param {*} item - Input value used by the operation.
 * @returns {*} The operation result.
 */
function normalizeMenuItem(item) {
  return {
    ...item,
    priceBDT: item.priceBDT ?? item.price ?? 0,
    photoUrl: item.photoUrl || item.image || item.photo || "",
  };
}

/**
 * Function normalizeOrder.
 * @param {*} order - Input value used by the operation.
 * @returns {*} The operation result.
 */
function normalizeOrder(order) {
  const riderUserId = order.riderUserId || order.riderId || null;
  let status = order.status;
  if (status === "pending_shop_acceptance") status = ORDER_STATUS.PLACED;
  if (status === "rider_assigned") status = ORDER_STATUS.CLAIMED;
  if (status === "picked_up" || status === "in_transit") status = ORDER_STATUS.PICKED_UP;

  return {
    ...order,
    customerUserId: order.customerUserId || order.studentId,
    customerPhone: order.customerPhone || "",
    riderUserId,
    deliveryAddressSnapshot:
      order.deliveryAddressSnapshot || order.deliveryLocation || "",
    deliveryNote: order.deliveryNote || order.deliveryNotes || "",
    shopLocation: order.shopLocation || "",
    pickupVerificationCode: order.pickupVerificationCode || order.pickupOtp,
    deliveryVerificationCode:
      order.deliveryVerificationCode || order.deliveryCode,
    statusTimestamps: order.statusTimestamps || {
      placedAt: order.createdAt,
      confirmedAt: order.confirmedAt || order.acceptedAt,
      preparingAt: order.preparingAt,
      readyForPickupAt: order.readyForPickupAt,
      claimedAt: order.claimedAt,
      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,
    },
    items: (order.items || []).map((item) => ({
      ...item,
      priceAtOrder: item.priceAtOrder ?? item.unitPriceBdt ?? item.price ?? 0,
    })),
  };
}

/**
 * Function responseMeta.
 * @param {*} response - Input value used by the operation.
 * @returns {*} The operation result.
 */
function responseMeta(response) {
  return response.meta?.notificationWarning
    ? { notificationWarning: response.meta.notificationWarning }
    : {};
}

/**
 * Function listShopMenu.
 * @param {*} shopId - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
async function listShopMenu(shopId) {
  const response = await apiRequest(`/shops/${encodeURIComponent(shopId)}/menu`);
  if (!response.success) return response;
  const items = responseItem(response, "items");
  if (!Array.isArray(items)) {
    return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid menu.", 502);
  }
  return createSuccessResponse(items.map(normalizeMenuItem));
}

/**
 * Exports shopService.
 * @type {*} Exported application value.
*/
export const shopService = {
  /**
   * Method listShops.
   * @param {*} category - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listShops({ query = "", category = "All" } = {}) {
    const response = await apiRequest("/shops");
    if (!response.success) return response;
    const shops = responseItem(response, "shops");
    if (!Array.isArray(shops)) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid shop list.", 502);
    }

    const normalized = shops.map(normalizeShop);
    const search = query.trim().toLowerCase();
    const filtered = normalized.filter((shop) => {
      const matchesCategory =
        !category ||
        category === "All" ||
        shop.cuisine?.toLowerCase() === category.toLowerCase();
      const matchesQuery =
        !search ||
        [shop.name, shop.description, shop.campusLocation]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search));
      return matchesCategory && matchesQuery;
    });
    return createSuccessResponse(filtered, { total: filtered.length });
  },

  /**
   * Method getShopById.
   * @param {*} shopId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getShopById(shopId) {
    const response = await apiRequest(`/shops/${encodeURIComponent(shopId)}`);
    if (!response.success) return response;
    const shop = responseItem(response, "shop");
    return shop
      ? createSuccessResponse(normalizeShop(shop))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no shop.", 502);
  },

  /**
   * Method getShopByOwner.
   * @param {*} ownerId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getShopByOwner(ownerId) {
    const response = await this.listShops();
    if (!response.success) return response;
    const shop = response.data.find((item) => item.ownerId === ownerId);
    return shop
      ? createSuccessResponse(shop)
      : createErrorResponse("NOT_FOUND", "No shop is assigned to this account.", 404);
  },

  /**
   * Method createShop.
   * @param {*} shopData - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async createShop(shopData) {
    const response = await apiRequest("/shops", {
      method: "POST",
      body: JSON.stringify(shopData),
    });
    if (!response.success) return response;
    const shop = responseItem(response, "shop");
    return shop
      ? createSuccessResponse(normalizeShop(shop))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no created shop.", 502);
  },

  /**
   * Method toggleShopStatus.
   * @param {*} shopId - Input value used by the operation.
   * @param {*} isOpen - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async toggleShopStatus(shopId, isOpen) {
    return this.updateShop(shopId, { isOpen });
  },

  /**
   * Method updateShop.
   * @param {*} shopId - Input value used by the operation.
   * @param {*} updates - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async updateShop(shopId, updates) {
    const payload = { ...updates };
    if (payload.campusLocation !== undefined) {
      payload.location = payload.campusLocation;
      delete payload.campusLocation;
    }
    if (payload.bannerUrl !== undefined) {
      payload.banner = payload.bannerUrl;
      delete payload.bannerUrl;
    }
    if (payload.logoUrl !== undefined) {
      payload.logo = payload.logoUrl;
      delete payload.logoUrl;
    }

    const response = await apiRequest(`/shops/${encodeURIComponent(shopId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!response.success) return response;
    const shop = responseItem(response, "shop");
    return shop
      ? createSuccessResponse(normalizeShop(shop))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no updated shop.", 502);
  },

  /**
   * Method getPaymentSettings.
   * @param {*} shopId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getPaymentSettings(shopId) {
    const response = await apiRequest(
      `/shops/${encodeURIComponent(shopId)}/payment-settings`
    );
    if (!response.success) return response;
    const settings = responseItem(response, "paymentSettings");
    return settings
      ? createSuccessResponse(settings)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no shop payment settings.", 502);
  },

  /**
   * Method updatePaymentSettings.
   * @param {*} shopId - Input value used by the operation.
   * @param {*} bkashNumber - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async updatePaymentSettings(shopId, bkashNumber) {
    const response = await apiRequest(
      `/shops/${encodeURIComponent(shopId)}/payment-settings`,
      {
        method: "PUT",
        body: JSON.stringify({ bkashNumber }),
      }
    );
    if (!response.success) return response;
    const settings = responseItem(response, "paymentSettings");
    return settings
      ? createSuccessResponse(settings)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no updated shop payment settings.", 502);
  },
};

/**
 * Exports menuService.
 * @type {*} Exported application value.
*/
export const menuService = {
  /**
   * Method listMenuItems.
   * @param {*} shopId - Input value used by the operation.
   * @param {*} category - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listMenuItems(shopId, category = "All") {
    let items;
    if (shopId) {
      const response = await listShopMenu(shopId);
      if (!response.success) return response;
      items = response.data;
    } else {
      const shopsResponse = await shopService.listShops();
      if (!shopsResponse.success) return shopsResponse;
      const menuResponses = await Promise.all(
        shopsResponse.data.map((shop) => listShopMenu(shop.id))
      );
      const failedResponse = menuResponses.find((response) => !response.success);
      if (failedResponse) return failedResponse;
      items = menuResponses.flatMap((response) => response.data);
    }
    const filtered =
      category && category !== "All"
        ? items.filter((item) => item.category === category)
        : items;
    return createSuccessResponse(filtered);
  },

  /**
   * Method createMenuItem.
   * @param {*} itemData - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async createMenuItem(itemData) {
    const response = await apiRequest("/menu", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
    if (!response.success) return response;
    const item = responseItem(response, "item");
    return item
      ? createSuccessResponse(normalizeMenuItem(item))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no created menu item.", 502);
  },

  /**
   * Method updateMenuItem.
   * @param {*} itemId - Input value used by the operation.
   * @param {*} updates - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async updateMenuItem(itemId, updates) {
    const response = await apiRequest(`/menu/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (!response.success) return response;
    const item = responseItem(response, "item");
    return item
      ? createSuccessResponse(normalizeMenuItem(item))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no updated menu item.", 502);
  },

  /**
   * Method deleteMenuItem.
   * @param {*} itemId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async deleteMenuItem(itemId) {
    const response = await apiRequest(`/menu/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    if (!response.success) return response;
    return createSuccessResponse(responseItem(response, "item"));
  },
};

/**
 * Exports orderService.
 * @type {*} Exported application value.
*/
export const orderService = {
  /**
   * Method listOrders.
   * @param {*} limit - Input value used by the operation.
   * @param {*} from - Input value used by the operation.
   * @param {*} to - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listOrders({ page, limit, from, to, status } = {}) {
    const query = new URLSearchParams();
    if (page !== undefined) query.set("page", String(page));
    if (limit !== undefined) query.set("limit", String(limit));
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    if (status) query.set("status", status);
    const suffix = query.size ? `?${query.toString()}` : "";
    const response = await apiRequest(`/orders${suffix}`);
    if (!response.success) return response;
    const orders = responseItem(response, "orders");
    if (!Array.isArray(orders)) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid order list.", 502);
    }
    return createSuccessResponse(orders.map(normalizeOrder), responseItem(response, "meta") || {});
  },

  /**
   * Method getOrderById.
   * @param {*} orderId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getOrderById(orderId) {
    const response = await apiRequest(`/orders/${encodeURIComponent(orderId)}`);
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no order.", 502);
  },

  /**
   * Method reissueVerificationCode.
   * @param {*} orderId - Input value used by the operation.
   * @param {*} codeType - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async reissueVerificationCode(orderId, codeType) {
    const response = await apiRequest(
      `/orders/${encodeURIComponent(orderId)}/codes/reissue`,
      {
        method: "POST",
        body: JSON.stringify({ codeType }),
      }
    );
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no updated order.", 502);
  },

  /**
   * Method createOrder.
   * @param {*} orderPayload - Input value used by the operation.
   * @param {*} idempotencyKey - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async createOrder(orderPayload, idempotencyKey) {
    const response = await apiRequest("/orders", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        shopId: orderPayload.shopId,
        items: (orderPayload.items || []).map((item) => ({
          id: item.id || item.menuItemId,
          quantity: item.quantity,
        })),
        deliveryLocation:
          orderPayload.deliveryLocation || orderPayload.deliveryAddress,
        deliveryNotes: orderPayload.deliveryNotes || orderPayload.deliveryNote || "",
        paymentMethod: orderPayload.paymentMethod,
      }),
    });
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no created order.", 502);
  },

  /**
   * Method updateOrderStatus.
   * @param {*} orderId - Input value used by the operation.
   * @param {*} status - Input value used by the operation.
   * @param {*} rejectionReason - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async updateOrderStatus(orderId, status, rejectionReason) {
    const response = await apiRequest(
      `/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          ...(rejectionReason ? { rejectionReason } : {}),
        }),
      }
    );
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no updated order.", 502);
  },

  /**
   * Method cancelOrder.
   * @param {*} orderId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async cancelOrder(orderId) {
    const response = await apiRequest(
      `/orders/${encodeURIComponent(orderId)}/cancel`,
      { method: "POST" }
    );
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no cancelled order.", 502);
  },

  /**
   * Method rateOrder.
   * @param {*} orderId - Input value used by the operation.
   * @param {*} rating - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async rateOrder(orderId, rating) {
    const response = await apiRequest(
      `/orders/${encodeURIComponent(orderId)}/rating`,
      {
        method: "POST",
        body: JSON.stringify(rating),
      }
    );
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no rated order.", 502);
  },

  /**
   * Method listPayments.
   * @param {*} orderId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listPayments(orderId) {
    const response = await apiRequest(`/payments/orders/${encodeURIComponent(orderId)}`);
    if (!response.success) return response;
    const payments = responseItem(response, "payments");
    return Array.isArray(payments)
      ? createSuccessResponse(payments)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned invalid payment obligations.", 502);
  },

  /**
   * Method submitPaymentReference.
   * @param {*} orderId - Input value used by the operation.
   * @param {*} obligation - Input value used by the operation.
   * @param {*} reference - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async submitPaymentReference(orderId, obligation, reference) {
    if (!["shop", "platform"].includes(obligation)) {
      return createErrorResponse("INVALID_OBLIGATION", "Unsupported payment obligation.", 422);
    }
    return apiRequest(
      `/payments/orders/${encodeURIComponent(orderId)}/${obligation}-reference`,
      {
        method: "POST",
        body: JSON.stringify({ reference }),
      }
    );
  },
};

/**
 * Exports riderService.
 * @type {*} Exported application value.
*/
export const riderService = {
  /**
   * Method getAvailability.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getAvailability() {
    const response = await apiRequest("/rider/availability");
    if (!response.success) return response;
    return createSuccessResponse({ isOnline: responseItem(response, "isOnline") });
  },

  /**
   * Method setAvailability.
   * @param {*} isOnline - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async setAvailability(isOnline) {
    const response = await apiRequest("/rider/availability", {
      method: "PATCH",
      body: JSON.stringify({ isOnline }),
    });
    if (!response.success) return response;
    return createSuccessResponse({ isOnline: responseItem(response, "isOnline") });
  },

  /**
   * Method getAvailableOrders.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getAvailableOrders() {
    const response = await apiRequest("/rider/available-orders");
    if (!response.success) return response;
    const orders = responseItem(response, "orders");
    if (!Array.isArray(orders)) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid delivery list.", 502);
    }
    return createSuccessResponse(orders.map(normalizeOrder));
  },

  /**
   * Method getActiveDelivery.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getActiveDelivery() {
    const response = await orderService.listOrders();
    if (!response.success) return response;
    const active = response.data.find((order) =>
      order.riderUserId &&
      [ORDER_STATUS.CLAIMED, ORDER_STATUS.PICKED_UP].includes(order.status)
    );
    return createSuccessResponse(active || null);
  },

  /**
   * Method claimOrder.
   * @param {*} orderId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async claimOrder(orderId) {
    const response = await apiRequest("/rider/claim", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no claimed order.", 502);
  },

  /**
   * Method verifyPickup.
   * @param {*} orderId - Input value used by the operation.
   * @param {*} pickupOtp - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async verifyPickup(orderId, pickupOtp) {
    const response = await apiRequest("/rider/verify-pickup", {
      method: "POST",
      body: JSON.stringify({ orderId, shopHandoverCode: pickupOtp }),
    });
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no verified order.", 502);
  },

  /**
   * Method verifyDelivery.
   * @param {*} orderId - Input value used by the operation.
   * @param {*} deliveryCode - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async verifyDelivery(orderId, deliveryCode) {
    const response = await apiRequest("/rider/verify-delivery", {
      method: "POST",
      body: JSON.stringify({ orderId, studentDeliveryCode: deliveryCode }),
    });
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no delivered order.", 502);
  },
};

/**
 * Exports profileService.
 * @type {*} Exported application value.
*/
export const profileService = {
  /**
   * Method getMyProfile.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getMyProfile() {
    const response = await apiRequest("/profile/me");
    return response.success
      ? createSuccessResponse(responseItem(response, "profile"))
      : response;
  },

  /**
   * Method updateMyProfile.
   * @param {*} fields - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async updateMyProfile(fields) {
    const response = await apiRequest("/profile/me", {
      method: "PATCH",
      body: JSON.stringify(fields),
    });
    return response.success
      ? createSuccessResponse(responseItem(response, "profile"))
      : response;
  },
};

/**
 * Exports walletService.
 * @type {*} Exported application value.
*/
export const walletService = {
  /**
   * Method getMyWallet.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getMyWallet() {
    const response = await apiRequest("/wallet/me");
    return response.success
      ? createSuccessResponse(responseItem(response, "wallet"))
      : response;
  },

  /**
   * Method listMyLedger.
   * @param {*} limit - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listMyLedger({ page = 1, limit = 20 } = {}) {
    const response = await apiRequest(`/wallet/me/ledger?page=${page}&limit=${limit}`);
    return response.success
      ? createSuccessResponse(responseItem(response, "entries"), responseItem(response, "meta"))
      : response;
  },

  /**
   * Method listMyPayouts.
   * @param {*} limit - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listMyPayouts({ page = 1, limit = 20 } = {}) {
    const response = await apiRequest(`/wallet/me/payouts?page=${page}&limit=${limit}`);
    return response.success
      ? createSuccessResponse(responseItem(response, "payouts"), responseItem(response, "meta"))
      : response;
  },

  /**
   * Method requestRiderPayout.
   * @param {*} amountPaisa - Input value used by the operation.
   * @param {*} idempotencyKey - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async requestRiderPayout(amountPaisa, idempotencyKey) {
    return apiRequest("/wallet/me/payouts", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ amountPaisa }),
    });
  },
};

/**
 * Exports notificationService.
 * @type {*} Exported application value.
*/
export const notificationService = {
  /**
   * Method listNotifications.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listNotifications() {
    const response = await apiRequest("/notifications");
    if (!response.success) return response;
    const notifications = responseItem(response, "notifications");
    if (!Array.isArray(notifications)) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid notification list.", 502);
    }
    return createSuccessResponse(
      notifications.map((notification) => ({
        ...notification,
        body: notification.body || notification.message || "",
        isRead: notification.isRead === true,
      }))
    );
  },

  /**
   * Method markRead.
   * @param {*} notificationId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async markRead(notificationId) {
    return apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "PATCH",
    });
  },

  /**
   * Method markAllRead.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async markAllRead() {
    return apiRequest("/notifications/read-all", { method: "PATCH" });
  },
};

/**
 * Exports adminService.
 * @type {*} Exported application value.
*/
export const adminService = {
  /**
   * Method listPayouts.
   * @param {*} status - Input value used by the operation.
   * @param {*} limit - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listPayouts(status = "requested", { page = 1, limit = 20 } = {}) {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set("status", status);
    const response = await apiRequest(`/admin/payouts?${query.toString()}`);
    if (!response.success) return response;
    const payouts = responseItem(response, "payouts");
    return Array.isArray(payouts)
      ? createSuccessResponse(payouts, responseItem(response, "meta"))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid payout list.", 502);
  },

  /**
   * Method transitionPayout.
   * @param {*} payoutId - Input value used by the operation.
   * @param {*} action - Input value used by the operation.
   * @param {*} payload - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async transitionPayout(payoutId, action, payload = {}) {
    return apiRequest(`/admin/payouts/${encodeURIComponent(payoutId)}/${action}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Method listAuditLogs.
   * @param {*} filters - Input value used by the operation.
   * @param {*} limit - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listAuditLogs(filters = {}, { page = 1, limit = 20 } = {}) {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const [key, value] of Object.entries(filters)) {
      if (value) query.set(key, value);
    }
    const response = await apiRequest(`/admin/audit-logs?${query.toString()}`);
    if (!response.success) return response;
    const entries = responseItem(response, "auditLogs");
    return Array.isArray(entries)
      ? createSuccessResponse(entries, responseItem(response, "meta"))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid audit log list.", 502);
  },

  /**
   * Method listPayments.
   * @param {*} status - Input value used by the operation.
   * @param {*} limit - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listPayments(status = "pending_verification", { page = 1, limit = 20 } = {}) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) query.set("status", status);
    const response = await apiRequest(`/payments?${query.toString()}`);
    if (!response.success) return response;
    const payments = responseItem(response, "payments");
    return Array.isArray(payments)
      ? createSuccessResponse(payments, {
          ...(response.data?.meta || {}),
          ...responseMeta(response),
        })
      : createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid payment list.", 502);
  },

  /**
   * Method verifyPayment.
   * @param {*} paymentId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async verifyPayment(paymentId) {
    return apiRequest(`/payments/${encodeURIComponent(paymentId)}/verify`, {
      method: "POST",
    });
  },

  /**
   * Method rejectPayment.
   * @param {*} paymentId - Input value used by the operation.
   * @param {*} reason - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async rejectPayment(paymentId, reason) {
    return apiRequest(`/payments/${encodeURIComponent(paymentId)}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Method getPaymentSettings.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getPaymentSettings() {
    const response = await apiRequest("/admin/payment-settings");
    if (!response.success) return response;
    const settings = responseItem(response, "paymentSettings");
    return settings
      ? createSuccessResponse(settings)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no platform payment settings.", 502);
  },

  /**
   * Method updatePaymentSettings.
   * @param {*} bkashPlatformNumber - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async updatePaymentSettings(bkashPlatformNumber) {
    const response = await apiRequest("/admin/payment-settings", {
      method: "PUT",
      body: JSON.stringify({ bkashPlatformNumber }),
    });
    if (!response.success) return response;
    const settings = responseItem(response, "paymentSettings");
    return settings
      ? createSuccessResponse(settings)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no updated platform payment settings.", 502);
  },

  /**
   * Method getDashboardKPIs.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getDashboardKPIs() {
    const response = await apiRequest("/admin/overview");
    if (!response.success) return response;
    const stats = responseItem(response, "stats");
    if (!stats) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned no admin statistics.", 502);
    }
    return createSuccessResponse({
      totalGMV: stats.grossVolumeBdt,
      totalOrders: stats.totalOrders,
      deliveredOrders: stats.completedDeliveries,
      activeShops: stats.totalShops,
      totalUsers: stats.totalUsers,
      platformRevenue: stats.platformRevenueBdt,
    });
  },

  /**
   * Method listUsers.
   * @param {*} role - Input value used by the operation.
   * @param {*} limit - Input value used by the operation.
   * @param {*} search - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async listUsers(role = "all", { page = 1, limit = 25, search = "" } = {}) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (role && role !== "all") query.set("role", role);
    if (search) query.set("search", search);
    const response = await apiRequest(`/admin/users?${query.toString()}`);
    if (!response.success) return response;
    const users = responseItem(response, "users");
    if (!Array.isArray(users)) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid user list.", 502);
    }
    return createSuccessResponse(users, responseItem(response, "meta"));
  },

  /**
   * Method toggleUserSuspension.
   * @param {*} userId - Input value used by the operation.
   * @param {*} isSuspended - Input value used by the operation.
   * @param {*} reason - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async toggleUserSuspension(userId, isSuspended, reason = "") {
    const response = await apiRequest(
      `/admin/users/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isSuspended, reason }),
      }
    );
    if (!response.success) return response;
    const updatedUser = responseItem(response, "user");
    return updatedUser
      ? createSuccessResponse(updatedUser)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no updated user.", 502);
  },

  /**
   * Method getShopApplications.
   * @param {*} limit - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getShopApplications({ page = 1, limit = 20 } = {}) {
    const response = await apiRequest(`/admin/shops?page=${page}&limit=${limit}`);
    if (!response.success) return response;
    const applications = responseItem(response, "applications");
    return Array.isArray(applications)
      ? createSuccessResponse(applications, responseItem(response, "meta"))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned invalid shop applications.", 502);
  },

  /**
   * Method reviewShopApplication.
   * @param {*} applicationId - Input value used by the operation.
   * @param {*} decision - Input value used by the operation.
   * @param {*} reason - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async reviewShopApplication(applicationId, decision, reason = "") {
    const response = await apiRequest("/admin/shops/review", {
      method: "POST",
      body: JSON.stringify({ applicationId, decision, reason }),
    });
    if (!response.success) return response;
    return createSuccessResponse(response.data);
  },

  /**
   * Method approveUser.
   * @param {*} userId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async approveUser(userId) {
    const response = await apiRequest(
      `/admin/users/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isApproved: true }),
      }
    );
    if (!response.success) return response;
    const updatedUser = responseItem(response, "user");
    return updatedUser
      ? createSuccessResponse(updatedUser)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no approved user.", 502);
  },

  /**
   * Method getDisputes.
   * @param {*} limit - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async getDisputes({ page = 1, limit = 20 } = {}) {
    const response = await apiRequest(`/admin/disputes?page=${page}&limit=${limit}`);
    if (!response.success) return response;
    const disputes = responseItem(response, "disputes");
    return Array.isArray(disputes)
      ? createSuccessResponse(disputes, responseItem(response, "meta"))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned invalid disputes.", 502);
  },

  /**
   * Method resolveDispute.
   * @param {*} disputeId - Input value used by the operation.
   * @param {*} decision - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  async resolveDispute(disputeId, decision) {
    const response = await apiRequest(
      `/admin/disputes/${encodeURIComponent(disputeId)}/resolve`,
      {
        method: "POST",
        body: JSON.stringify(decision),
      }
    );
    if (!response.success) return response;
    const dispute = responseItem(response, "dispute");
    return dispute
      ? createSuccessResponse(dispute)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no resolved dispute.", 502);
  },
};
