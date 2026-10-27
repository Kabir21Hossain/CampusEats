import { apiRequest, createErrorResponse, createSuccessResponse } from "./api-client";
import { ORDER_STATUS } from "@/lib/constants";

const responseItem = (response, key) => response.data?.[key];

function normalizeShop(shop) {
  return {
    ...shop,
    campusLocation: shop.campusLocation || shop.location || shop.campusZone || "",
    bannerUrl: shop.bannerUrl || shop.banner || "",
    logoUrl: shop.logoUrl || shop.logo || "",
    ownerUserId: shop.ownerUserId || shop.ownerId,
  };
}

function normalizeMenuItem(item) {
  return {
    ...item,
    priceBDT: item.priceBDT ?? item.price ?? 0,
    photoUrl: item.photoUrl || item.image || item.photo || "",
  };
}

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

function responseMeta(response) {
  return response.meta?.notificationWarning
    ? { notificationWarning: response.meta.notificationWarning }
    : {};
}

async function listShopMenu(shopId) {
  const response = await apiRequest(`/shops/${encodeURIComponent(shopId)}/menu`);
  if (!response.success) return response;
  const items = responseItem(response, "items");
  if (!Array.isArray(items)) {
    return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid menu.", 502);
  }
  return createSuccessResponse(items.map(normalizeMenuItem));
}

export const shopService = {
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

  async getShopById(shopId) {
    const response = await apiRequest(`/shops/${encodeURIComponent(shopId)}`);
    if (!response.success) return response;
    const shop = responseItem(response, "shop");
    return shop
      ? createSuccessResponse(normalizeShop(shop))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no shop.", 502);
  },

  async getShopByOwner(ownerId) {
    const response = await this.listShops();
    if (!response.success) return response;
    const shop = response.data.find((item) => item.ownerId === ownerId);
    return shop
      ? createSuccessResponse(shop)
      : createErrorResponse("NOT_FOUND", "No shop is assigned to this account.", 404);
  },

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

  async toggleShopStatus(shopId, isOpen) {
    return this.updateShop(shopId, { isOpen });
  },

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

export const menuService = {
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

  async deleteMenuItem(itemId) {
    const response = await apiRequest(`/menu/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    if (!response.success) return response;
    return createSuccessResponse(responseItem(response, "item"));
  },
};

export const orderService = {
  async listOrders() {
    const response = await apiRequest("/orders");
    if (!response.success) return response;
    const orders = responseItem(response, "orders");
    if (!Array.isArray(orders)) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid order list.", 502);
    }
    return createSuccessResponse(orders.map(normalizeOrder));
  },

  async getOrderById(orderId) {
    const response = await apiRequest(`/orders/${encodeURIComponent(orderId)}`);
    if (!response.success) return response;
    const order = responseItem(response, "order");
    return order
      ? createSuccessResponse(normalizeOrder(order), responseMeta(response))
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no order.", 502);
  },

  async createOrder(orderPayload) {
    const response = await apiRequest("/orders", {
      method: "POST",
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

  async listPayments(orderId) {
    const response = await apiRequest(`/payments/orders/${encodeURIComponent(orderId)}`);
    if (!response.success) return response;
    const payments = responseItem(response, "payments");
    return Array.isArray(payments)
      ? createSuccessResponse(payments)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned invalid payment obligations.", 502);
  },

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

export const riderService = {
  async getAvailability() {
    const response = await apiRequest("/rider/availability");
    if (!response.success) return response;
    return createSuccessResponse({ isOnline: responseItem(response, "isOnline") });
  },

  async setAvailability(isOnline) {
    const response = await apiRequest("/rider/availability", {
      method: "PATCH",
      body: JSON.stringify({ isOnline }),
    });
    if (!response.success) return response;
    return createSuccessResponse({ isOnline: responseItem(response, "isOnline") });
  },

  async getAvailableOrders() {
    const response = await apiRequest("/rider/available-orders");
    if (!response.success) return response;
    const orders = responseItem(response, "orders");
    if (!Array.isArray(orders)) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid delivery list.", 502);
    }
    return createSuccessResponse(orders.map(normalizeOrder));
  },

  async getActiveDelivery() {
    const response = await orderService.listOrders();
    if (!response.success) return response;
    const active = response.data.find((order) =>
      order.riderUserId &&
      [ORDER_STATUS.CLAIMED, ORDER_STATUS.PICKED_UP].includes(order.status)
    );
    return createSuccessResponse(active || null);
  },

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

export const profileService = {
  async getMyProfile() {
    const response = await apiRequest("/profile/me");
    return response.success
      ? createSuccessResponse(responseItem(response, "profile"))
      : response;
  },

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

export const walletService = {
  async getMyWallet() {
    const response = await apiRequest("/wallet/me");
    return response.success
      ? createSuccessResponse(responseItem(response, "wallet"))
      : response;
  },

  async listMyLedger({ page = 1, limit = 20 } = {}) {
    const response = await apiRequest(`/wallet/me/ledger?page=${page}&limit=${limit}`);
    return response.success
      ? createSuccessResponse(responseItem(response, "entries"), responseItem(response, "meta"))
      : response;
  },

  async requestRiderPayout(amountPaisa, idempotencyKey) {
    return apiRequest("/wallet/me/payouts", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ amountPaisa }),
    });
  },
};

export const notificationService = {
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

  async markRead(notificationId) {
    return apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "PATCH",
    });
  },

  async markAllRead() {
    return apiRequest("/notifications/read-all", { method: "PATCH" });
  },
};

export const adminService = {
  async listPayments(status = "pending_verification") {
    const query = status ? `?status=${encodeURIComponent(status)}&limit=100` : "?limit=100";
    const response = await apiRequest(`/payments${query}`);
    if (!response.success) return response;
    const payments = responseItem(response, "payments");
    return Array.isArray(payments)
      ? createSuccessResponse(payments)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid payment list.", 502);
  },

  async verifyPayment(paymentId) {
    return apiRequest(`/payments/${encodeURIComponent(paymentId)}/verify`, {
      method: "POST",
    });
  },

  async rejectPayment(paymentId, reason) {
    return apiRequest(`/payments/${encodeURIComponent(paymentId)}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async getPaymentSettings() {
    const response = await apiRequest("/admin/payment-settings");
    if (!response.success) return response;
    const settings = responseItem(response, "paymentSettings");
    return settings
      ? createSuccessResponse(settings)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no platform payment settings.", 502);
  },

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

  async listUsers(role = "all") {
    const response = await apiRequest("/admin/users");
    if (!response.success) return response;
    const users = responseItem(response, "users");
    if (!Array.isArray(users)) {
      return createErrorResponse("INVALID_RESPONSE", "Backend returned an invalid user list.", 502);
    }
    return createSuccessResponse(
      role && role !== "all" ? users.filter((user) => user.role === role) : users
    );
  },

  async toggleUserSuspension(userId) {
    const usersResponse = await this.listUsers();
    if (!usersResponse.success) return usersResponse;
    const user = usersResponse.data.find((item) => item.id === userId);
    if (!user) return createErrorResponse("NOT_FOUND", "User not found.", 404);

    const response = await apiRequest(
      `/admin/users/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isSuspended: !user.isSuspended }),
      }
    );
    if (!response.success) return response;
    const updatedUser = responseItem(response, "user");
    return updatedUser
      ? createSuccessResponse(updatedUser)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned no updated user.", 502);
  },

  async getShopApplications() {
    const response = await apiRequest("/admin/shops");
    if (!response.success) return response;
    const applications = responseItem(response, "applications");
    return Array.isArray(applications)
      ? createSuccessResponse(applications)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned invalid shop applications.", 502);
  },

  async reviewShopApplication(applicationId, decision, reason = "") {
    const response = await apiRequest("/admin/shops/review", {
      method: "POST",
      body: JSON.stringify({ applicationId, decision, reason }),
    });
    if (!response.success) return response;
    return createSuccessResponse(response.data);
  },

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

  async getDisputes() {
    const response = await apiRequest("/admin/disputes");
    if (!response.success) return response;
    const disputes = responseItem(response, "disputes");
    return Array.isArray(disputes)
      ? createSuccessResponse(disputes)
      : createErrorResponse("INVALID_RESPONSE", "Backend returned invalid disputes.", 502);
  },

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
