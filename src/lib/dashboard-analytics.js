const ORDER_STATUS_LABELS = {
  placed: "Order placed",
  pending_shop_acceptance: "Awaiting shop",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  claimed: "Rider assigned",
  rider_assigned: "Rider assigned",
  in_transit: "In transit",
  picked_up: "In transit",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const ORDER_STATUS_COLORS = {
  placed: "#3b82f6",
  pending_shop_acceptance: "#3b82f6",
  accepted: "#f59e0b",
  preparing: "#f97316",
  ready_for_pickup: "#8b5cf6",
  claimed: "#6366f1",
  rider_assigned: "#6366f1",
  in_transit: "#06b6d4",
  picked_up: "#06b6d4",
  delivered: "#10b981",
  rejected: "#f43f5e",
  cancelled: "#fb7185",
  disputed: "#a855f7",
};

const PAYMENT_STATUS_LABELS = {
  verified: "Verified",
  paid: "Verified",
  pending_verification: "Pending verification",
  pending: "Pending verification",
  not_submitted: "Not submitted",
  rejected: "Rejected",
  refunded: "Refunded",
};

const PAYMENT_STATUS_COLORS = {
  verified: "#10b981",
  paid: "#10b981",
  pending_verification: "#f59e0b",
  pending: "#f59e0b",
  not_submitted: "#94a3b8",
  rejected: "#f43f5e",
  refunded: "#8b5cf6",
};

/**
 * Function dateKey.
 * @param {*} value - Input value used by the operation.
 * @returns {*} The operation result.
 */
function dateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/**
 * Function numericValue.
 * @param {*} value - Input value used by the operation.
 * @returns {*} The operation result.
 */
function numericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

/**
 * Function getDistribution.
 * @param {*} orders - Input value used by the operation.
 * @param {*} role - Input value used by the operation.
 * @returns {*} The operation result.
 */
function getDistribution(orders, role) {
  const counts = new Map();
  for (const order of orders) {
    const value = role === "admin"
      ? String(order.paymentStatus || "not_recorded").toLowerCase()
      : String(order.status || "not_recorded").toLowerCase();
    const labels = role === "admin" ? PAYMENT_STATUS_LABELS : ORDER_STATUS_LABELS;
    const colors = role === "admin" ? PAYMENT_STATUS_COLORS : ORDER_STATUS_COLORS;
    const label = labels[value] || (value === "not_recorded" ? "Not recorded" : value);
    const entry = counts.get(label) || {
      name: label,
      value: 0,
      color: colors[value] || "#64748b",
    };
    entry.value += 1;
    counts.set(label, entry);
  }
  return [...counts.values()];
}

/**
 * Function getDashboardAnalytics.
 * @param {*} orders - Input value used by the operation.
 * @param {*} role - Input value used by the operation.
 * @param {*} days - Input value used by the operation.
 * @param {*} viewerId - Input value used by the operation.
 * @param {*} now - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function getDashboardAnalytics(orders, role, days, viewerId, now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - days + 1);

  const dateKeys = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const buckets = new Map(dateKeys.map((key) => [key, {
    date: key,
    label: new Date(`${key}T12:00:00Z`).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    orders: 0,
    delivered: 0,
    orderValue: 0,
    orderVolume: 0,
    platformRevenue: 0,
    riderDeliveries: 0,
  }]));

  const inRangeOrders = [];
  for (const order of Array.isArray(orders) ? orders : []) {
    if (
      role === "rider" &&
      (!viewerId || (order.riderUserId || order.riderId) !== viewerId)
    ) {
      continue;
    }

    const key = dateKey(order.createdAt);
    const bucket = key ? buckets.get(key) : null;
    if (!bucket) continue;

    inRangeOrders.push(order);
    bucket.orders += 1;
    bucket.orderValue += numericValue(order.total ?? order.totalBdt);

    if (order.status === "delivered") {
      bucket.delivered += 1;
      bucket.orderVolume += numericValue(order.total ?? order.totalBdt);
      bucket.platformRevenue += numericValue(order.platformFee ?? order.platformFeeBdt);
      if (role === "rider") bucket.riderDeliveries += 1;
    }
  }

  let charts;
  let distributionTitle;
  let distributionDescription;

  if (role === "admin") {
    charts = [
      {
        title: "Orders by day",
        description: "Orders placed and delivered, grouped by order date.",
        type: "line",
        format: "number",
        data: [...buckets.values()],
        series: [
          { key: "orders", label: "Orders placed", color: "#10b981" },
          { key: "delivered", label: "Delivered", color: "#6366f1" },
        ],
      },
      {
        title: "Order volume & platform fees",
        description: "Completed order value and recorded platform fees by order date.",
        type: "area",
        format: "currency",
        data: [...buckets.values()],
        series: [
          { key: "orderVolume", label: "Completed order volume", color: "#6366f1" },
          { key: "platformRevenue", label: "Platform fee revenue", color: "#10b981" },
        ],
      },
    ];
    distributionTitle = "Payment status by order";
    distributionDescription = "Payment verification status recorded for orders in this period.";
  } else if (role === "shop_owner") {
    charts = [
      {
        title: "Orders by day",
        description: "Orders placed and delivered, grouped by order date.",
        type: "bar",
        format: "number",
        data: [...buckets.values()],
        series: [
          { key: "orders", label: "Orders placed", color: "#10b981" },
          { key: "delivered", label: "Delivered", color: "#6366f1" },
        ],
      },
      {
        title: "Completed order volume",
        description: "Total order value for delivered orders, grouped by order date.",
        type: "area",
        format: "currency",
        data: [...buckets.values()],
        series: [{ key: "orderVolume", label: "Completed order volume", color: "#10b981" }],
      },
    ];
    distributionTitle = "Order status";
    distributionDescription = "Your orders by their current status in this period.";
  } else if (role === "student") {
    charts = [
      {
        title: "Your orders by day",
        description: "Orders placed and delivered, grouped by order date.",
        type: "line",
        format: "number",
        data: [...buckets.values()],
        series: [
          { key: "orders", label: "Orders placed", color: "#10b981" },
          { key: "delivered", label: "Delivered", color: "#6366f1" },
        ],
      },
      {
        title: "Order value by day",
        description: "Total value of your orders, grouped by order date.",
        type: "area",
        format: "currency",
        data: [...buckets.values()],
        series: [{ key: "orderValue", label: "Order value", color: "#10b981" }],
      },
    ];
    distributionTitle = "Your order status";
    distributionDescription = "Your orders by their current status in this period.";
  } else {
    charts = [
      {
        title: "Completed deliveries",
        description: "Your delivered orders, grouped by order date.",
        type: "bar",
        format: "number",
        data: [...buckets.values()],
        series: [{ key: "riderDeliveries", label: "Your deliveries", color: "#10b981" }],
      },
    ];
    distributionTitle = "Your delivery status";
    distributionDescription = "Orders assigned to you by their current status in this period.";
  }

  return {
    charts,
    distribution: getDistribution(inRangeOrders, role),
    distributionTitle,
    distributionDescription,
    hasOrders: inRangeOrders.length > 0,
  };
}
