import {
  INITIAL_SHOPS,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_SHOP_APPLICATIONS,
  INITIAL_DISPUTES,
  INITIAL_USERS,
} from "./mock/mock-data";
import { createSuccessResponse, createErrorResponse, delay } from "./api-client";
import { ORDER_STATUS } from "@/lib/constants";

// Helper for local storage persistence if in browser
function getStoreItem(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(`campuseats_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStoreItem(key, data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`campuseats_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error("Storage error:", err);
  }
}

/**
 * Universal API fetcher that hits Next.js backend API routes
 * with automatic fallback to localStorage / mock data on error.
 */
async function apiFetch(endpoint, options = {}) {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn(`[Backend API offline or failed for ${endpoint}]:`, err.message);
    return null;
  }
}

/* ================= SHOPS SERVICE ================= */
export const shopService = {
  async listShops({ query = "", category = "All" } = {}) {
    // Try backend API first
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category && category !== "All") params.set("category", category);
    
    const apiRes = await apiFetch(`/api/shops?${params.toString()}`);
    if (apiRes?.success && Array.isArray(apiRes.data)) {
      return createSuccessResponse(apiRes.data, { total: apiRes.data.length });
    }

    // Fallback
    await delay(100);
    const shops = getStoreItem("shops", INITIAL_SHOPS);
    let filtered = shops.filter((s) => s.approvalStatus === "approved");

    if (category && category !== "All") {
      filtered = filtered.filter(
        (s) => s.cuisine.toLowerCase() === category.toLowerCase()
      );
    }

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.campusLocation.toLowerCase().includes(q)
      );
    }

    return createSuccessResponse(filtered, { total: filtered.length });
  },

  async getShopById(shopId) {
    const apiRes = await apiFetch(`/api/shops/${shopId}`);
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(100);
    const shops = getStoreItem("shops", INITIAL_SHOPS);
    const shop = shops.find((s) => s.id === shopId || s.slug === shopId);
    if (!shop) {
      return createErrorResponse("NOT_FOUND", "Shop not found", 404);
    }
    return createSuccessResponse(shop);
  },

  async toggleShopStatus(shopId) {
    const apiRes = await apiFetch(`/api/shops/${shopId}`, {
      method: "PATCH",
      body: JSON.stringify({ toggleOpen: true }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const shops = getStoreItem("shops", INITIAL_SHOPS);
    const idx = shops.findIndex((s) => s.id === shopId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Shop not found", 404);

    shops[idx].isOpen = !shops[idx].isOpen;
    setStoreItem("shops", shops);
    return createSuccessResponse(shops[idx]);
  },

  async updateShop(shopId, updates) {
    const apiRes = await apiFetch(`/api/shops/${shopId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const shops = getStoreItem("shops", INITIAL_SHOPS);
    const idx = shops.findIndex((s) => s.id === shopId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Shop not found", 404);

    shops[idx] = { ...shops[idx], ...updates };
    setStoreItem("shops", shops);
    return createSuccessResponse(shops[idx]);
  },
};

/* ================= MENU SERVICE ================= */
export const menuService = {
  async listMenuItems(shopId, category = "All") {
    const params = new URLSearchParams();
    if (shopId) params.set("shopId", shopId);
    if (category && category !== "All") params.set("category", category);

    const apiRes = await apiFetch(`/api/menu?${params.toString()}`);
    if (apiRes?.success && Array.isArray(apiRes.data)) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(100);
    const items = getStoreItem("menu_items", INITIAL_MENU_ITEMS);
    let filtered = items;
    if (shopId) {
      filtered = filtered.filter((i) => i.shopId === shopId);
    }
    if (category && category !== "All") {
      filtered = filtered.filter((i) => i.category === category);
    }
    return createSuccessResponse(filtered);
  },

  async createMenuItem(itemData) {
    const apiRes = await apiFetch("/api/menu", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const items = getStoreItem("menu_items", INITIAL_MENU_ITEMS);
    const newItem = {
      id: `item-${Date.now()}`,
      isAvailable: true,
      ...itemData,
    };
    items.unshift(newItem);
    setStoreItem("menu_items", items);
    return createSuccessResponse(newItem);
  },

  async updateMenuItem(itemId, updates) {
    const apiRes = await apiFetch(`/api/menu/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const items = getStoreItem("menu_items", INITIAL_MENU_ITEMS);
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Menu item not found", 404);

    items[idx] = { ...items[idx], ...updates };
    setStoreItem("menu_items", items);
    return createSuccessResponse(items[idx]);
  },

  async deleteMenuItem(itemId) {
    const apiRes = await apiFetch(`/api/menu/${itemId}`, {
      method: "DELETE",
    });
    if (apiRes?.success) {
      return createSuccessResponse({ id: itemId, deleted: true });
    }

    await delay(150);
    const items = getStoreItem("menu_items", INITIAL_MENU_ITEMS);
    const remaining = items.filter((i) => i.id !== itemId);
    setStoreItem("menu_items", remaining);
    return createSuccessResponse({ id: itemId, deleted: true });
  },
};

/* ================= ORDER SERVICE ================= */
export const orderService = {
  async listOrders({ customerUserId, shopId, riderUserId, status } = {}) {
    const params = new URLSearchParams();
    if (customerUserId) params.set("customerUserId", customerUserId);
    if (shopId) params.set("shopId", shopId);
    if (riderUserId) params.set("riderUserId", riderUserId);
    if (status) params.set("status", status);

    const apiRes = await apiFetch(`/api/orders?${params.toString()}`);
    if (apiRes?.success && Array.isArray(apiRes.data)) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(100);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    let filtered = orders;

    if (customerUserId) {
      filtered = filtered.filter((o) => o.customerUserId === customerUserId);
    }
    if (shopId) {
      filtered = filtered.filter((o) => o.shopId === shopId);
    }
    if (riderUserId) {
      filtered = filtered.filter((o) => o.riderUserId === riderUserId);
    }
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return createSuccessResponse(filtered);
  },

  async getOrderById(orderId) {
    const apiRes = await apiFetch(`/api/orders/${orderId}`);
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(100);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return createErrorResponse("NOT_FOUND", "Order not found", 404);
    }
    return createSuccessResponse(order);
  },

  async createOrder(orderPayload) {
    const apiRes = await apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(200);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const newOrderId = `CE-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: newOrderId,
      customerUserId: orderPayload.customerUserId || "student-1",
      customerName: orderPayload.customerName || "Tanvir Ahmed",
      customerPhone: orderPayload.customerPhone || "+880 1712-345678",
      shopId: orderPayload.shopId,
      shopName: orderPayload.shopName,
      shopLocation: orderPayload.shopLocation || "Campus",
      riderUserId: null,
      status: ORDER_STATUS.PLACED,
      deliveryAddressSnapshot: orderPayload.deliveryAddress,
      deliveryNote: orderPayload.deliveryNote || "",
      items: orderPayload.items,
      subtotal: orderPayload.subtotal,
      deliveryFee: orderPayload.deliveryFee || 30,
      total: orderPayload.total,
      paymentStatus: orderPayload.paymentMethod === "Cash on Delivery" ? "pending" : "paid",
      paymentMethod: orderPayload.paymentMethod,
      escrowStatus: "locked",
      pickupVerificationCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryVerificationCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      statusTimestamps: {
        placedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    setStoreItem("orders", orders);
    return createSuccessResponse(newOrder);
  },

  async updateOrderStatus(orderId, nextStatus) {
    const apiRes = await apiFetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Order not found", 404);

    const now = new Date().toISOString();
    orders[idx].status = nextStatus;

    if (!orders[idx].statusTimestamps) orders[idx].statusTimestamps = {};

    if (nextStatus === ORDER_STATUS.CONFIRMED) orders[idx].statusTimestamps.confirmedAt = now;
    if (nextStatus === ORDER_STATUS.AWAITING_RIDER) orders[idx].statusTimestamps.awaitingRiderAt = now;
    if (nextStatus === ORDER_STATUS.CLAIMED) orders[idx].statusTimestamps.claimedAt = now;
    if (nextStatus === ORDER_STATUS.PICKED_UP) orders[idx].statusTimestamps.pickedUpAt = now;
    if (nextStatus === ORDER_STATUS.DELIVERED) {
      orders[idx].statusTimestamps.deliveredAt = now;
      orders[idx].escrowStatus = "released";
      orders[idx].paymentStatus = "paid";
    }

    setStoreItem("orders", orders);
    return createSuccessResponse(orders[idx]);
  },

  async cancelOrder(orderId, reason) {
    const apiRes = await apiFetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ cancelReason: reason }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Order not found", 404);

    if ([ORDER_STATUS.PICKED_UP, ORDER_STATUS.DELIVERED].includes(orders[idx].status)) {
      return createErrorResponse("CANCEL_POLICY_VIOLATION", "Order cannot be cancelled after pickup. Please open a dispute.", 409);
    }

    orders[idx].status = ORDER_STATUS.CANCELLED;
    orders[idx].cancellationReason = reason;
    orders[idx].escrowStatus = "refunded";
    setStoreItem("orders", orders);
    return createSuccessResponse(orders[idx]);
  },

  async rateOrder(orderId, { shopRating, riderRating, reviewText }) {
    const apiRes = await apiFetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ rating: { shopRating, riderRating, reviewText } }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Order not found", 404);

    orders[idx].ratingGiven = {
      shopRating,
      riderRating,
      reviewText,
      ratedAt: new Date().toISOString(),
    };
    setStoreItem("orders", orders);
    return createSuccessResponse(orders[idx]);
  },
};

/* ================= RIDER SERVICE ================= */
export const riderService = {
  async getAvailableOrders() {
    const apiRes = await apiFetch("/api/orders?status=confirmed");
    if (apiRes?.success && Array.isArray(apiRes.data)) {
      const unclaimed = apiRes.data.filter((o) => !o.riderUserId);
      return createSuccessResponse(unclaimed);
    }

    await delay(100);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const available = orders.filter(
      (o) =>
        !o.riderUserId &&
        [ORDER_STATUS.CONFIRMED, ORDER_STATUS.AWAITING_RIDER].includes(o.status)
    );
    return createSuccessResponse(available);
  },

  async getActiveDelivery(riderUserId = "rider-1") {
    const apiRes = await apiFetch(`/api/orders?riderUserId=${riderUserId}`);
    if (apiRes?.success && Array.isArray(apiRes.data)) {
      const active = apiRes.data.find((o) =>
        [ORDER_STATUS.CLAIMED, ORDER_STATUS.PICKED_UP].includes(o.status)
      );
      return createSuccessResponse(active || null);
    }

    await delay(100);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const active = orders.find(
      (o) =>
        o.riderUserId === riderUserId &&
        [ORDER_STATUS.CLAIMED, ORDER_STATUS.PICKED_UP].includes(o.status)
    );
    return createSuccessResponse(active || null);
  },

  async claimOrder(orderId, riderUserId = "rider-1", riderName = "Sabbir Hossain") {
    const apiRes = await apiFetch("/api/rider/claim", {
      method: "POST",
      body: JSON.stringify({ orderId, riderUserId, riderName }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }
    if (apiRes?.error) {
      return createErrorResponse("CONFLICT", apiRes.error, 409);
    }

    await delay(200);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Order not found", 404);

    if (orders[idx].riderUserId) {
      return createErrorResponse("CONFLICT", "This delivery order has already been claimed by another rider.", 409);
    }

    orders[idx].riderUserId = riderUserId;
    orders[idx].riderName = riderName;
    orders[idx].riderPhone = "+880 1911-223344";
    orders[idx].status = ORDER_STATUS.CLAIMED;
    if (!orders[idx].statusTimestamps) orders[idx].statusTimestamps = {};
    orders[idx].statusTimestamps.claimedAt = new Date().toISOString();

    setStoreItem("orders", orders);
    return createSuccessResponse(orders[idx]);
  },

  async verifyPickup(orderId, enteredCode) {
    const apiRes = await apiFetch("/api/rider/verify-pickup", {
      method: "POST",
      body: JSON.stringify({ orderId, verificationCode: enteredCode }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }
    if (apiRes?.error) {
      return createErrorResponse("INVALID_CODE", apiRes.error, 422);
    }

    await delay(150);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Order not found", 404);

    if (orders[idx].pickupVerificationCode !== enteredCode.trim()) {
      return createErrorResponse("INVALID_CODE", "Invalid pickup verification code. Check with shop counter.", 422);
    }

    orders[idx].status = ORDER_STATUS.PICKED_UP;
    if (!orders[idx].statusTimestamps) orders[idx].statusTimestamps = {};
    orders[idx].statusTimestamps.pickedUpAt = new Date().toISOString();

    setStoreItem("orders", orders);
    return createSuccessResponse(orders[idx]);
  },

  async verifyDelivery(orderId, enteredCode) {
    const apiRes = await apiFetch("/api/rider/verify-delivery", {
      method: "POST",
      body: JSON.stringify({ orderId, verificationCode: enteredCode }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }
    if (apiRes?.error) {
      return createErrorResponse("INVALID_CODE", apiRes.error, 422);
    }

    await delay(150);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Order not found", 404);

    if (orders[idx].deliveryVerificationCode !== enteredCode.trim()) {
      return createErrorResponse("INVALID_CODE", "Invalid customer delivery code. Verify with the student.", 422);
    }

    orders[idx].status = ORDER_STATUS.DELIVERED;
    orders[idx].escrowStatus = "released";
    orders[idx].paymentStatus = "paid";
    if (!orders[idx].statusTimestamps) orders[idx].statusTimestamps = {};
    orders[idx].statusTimestamps.deliveredAt = new Date().toISOString();

    setStoreItem("orders", orders);
    return createSuccessResponse(orders[idx]);
  },
};

/* ================= ADMIN SERVICE ================= */
export const adminService = {
  async getDashboardKPIs() {
    const apiRes = await apiFetch("/api/admin/kpis");
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(100);
    const orders = getStoreItem("orders", INITIAL_ORDERS);
    const shops = getStoreItem("shops", INITIAL_SHOPS);
    const users = getStoreItem("users", INITIAL_USERS);
    const applications = getStoreItem("shop_applications", INITIAL_SHOP_APPLICATIONS);
    const disputes = getStoreItem("disputes", INITIAL_DISPUTES);

    const totalGMV = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const deliveredCount = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
    const pendingApps = applications.filter((a) => a.status === "pending").length;
    const activeDisputes = disputes.filter((d) => d.status === "pending").length;

    return createSuccessResponse({
      totalGMV,
      totalOrders: orders.length,
      deliveredOrders: deliveredCount,
      activeShops: shops.filter((s) => s.approvalStatus === "approved").length,
      pendingApplications: pendingApps,
      activeDisputes,
      totalUsers: users.length,
    });
  },

  async getShopApplications() {
    const apiRes = await apiFetch("/api/admin/shops");
    if (apiRes?.success && Array.isArray(apiRes.data)) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(100);
    const apps = getStoreItem("shop_applications", INITIAL_SHOP_APPLICATIONS);
    return createSuccessResponse(apps);
  },

  async reviewShopApplication(applicationId, decision, reason = "") {
    const apiRes = await apiFetch("/api/admin/shops/review", {
      method: "POST",
      body: JSON.stringify({ applicationId, decision, reason }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const apps = getStoreItem("shop_applications", INITIAL_SHOP_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Application not found", 404);

    apps[idx].status = decision;
    apps[idx].reviewReason = reason;
    apps[idx].reviewedAt = new Date().toISOString();
    apps[idx].reviewedBy = "Dr. Farhana Yasmin (Admin)";

    if (decision === "approved") {
      const shops = getStoreItem("shops", INITIAL_SHOPS);
      const newShop = {
        id: `shop-${Date.now()}`,
        name: apps[idx].shopName,
        slug: apps[idx].shopName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: apps[idx].description,
        cuisine: "Snacks & Chaat",
        campusLocation: apps[idx].proposedLocation,
        operatingHours: "09:00 AM - 09:00 PM",
        isOpen: true,
        approvalStatus: "approved",
        rating: 5.0,
        reviewCount: 0,
        deliveryTimeMinutes: 20,
        minimumOrder: 50,
        bannerUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        logoUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&q=80",
        ownerUserId: apps[idx].ownerUserId,
        totalEarningsBDT: 0,
      };
      shops.push(newShop);
      setStoreItem("shops", shops);
    }

    setStoreItem("shop_applications", apps);
    return createSuccessResponse(apps[idx]);
  },

  async listUsers(role = "all") {
    const apiRes = await apiFetch(`/api/admin/users?role=${role}`);
    if (apiRes?.success && Array.isArray(apiRes.data)) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(100);
    const users = getStoreItem("users", INITIAL_USERS);
    let filtered = users;
    if (role && role !== "all") {
      filtered = filtered.filter((u) => u.role === role);
    }
    return createSuccessResponse(filtered);
  },

  async toggleUserSuspension(userId, reason) {
    const apiRes = await apiFetch("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId, reason }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const users = getStoreItem("users", INITIAL_USERS);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "User not found", 404);

    users[idx].isSuspended = !users[idx].isSuspended;
    users[idx].suspensionReason = users[idx].isSuspended ? reason : null;
    setStoreItem("users", users);
    return createSuccessResponse(users[idx]);
  },

  async getDisputes() {
    const apiRes = await apiFetch("/api/admin/disputes");
    if (apiRes?.success && Array.isArray(apiRes.data)) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(100);
    const disputes = getStoreItem("disputes", INITIAL_DISPUTES);
    return createSuccessResponse(disputes);
  },

  async resolveDispute(disputeId, { resolution, refundAmount = 0 }) {
    const apiRes = await apiFetch("/api/admin/disputes", {
      method: "POST",
      body: JSON.stringify({ disputeId, resolution, refundAmount }),
    });
    if (apiRes?.success && apiRes.data) {
      return createSuccessResponse(apiRes.data);
    }

    await delay(150);
    const disputes = getStoreItem("disputes", INITIAL_DISPUTES);
    const idx = disputes.findIndex((d) => d.id === disputeId);
    if (idx === -1) return createErrorResponse("NOT_FOUND", "Dispute not found", 404);

    disputes[idx].status = "resolved";
    disputes[idx].resolution = resolution;
    disputes[idx].refundAmount = refundAmount;
    disputes[idx].resolvedAt = new Date().toISOString();
    setStoreItem("disputes", disputes);
    return createSuccessResponse(disputes[idx]);
  },
};
