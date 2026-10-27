import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDashboardAnalytics } from "../src/lib/dashboard-analytics.js";

const now = new Date("2026-10-27T18:00:00Z");
const orders = [
  {
    id: "delivered-rider-one",
    createdAt: "2026-10-27T10:00:00Z",
    status: "delivered",
    total: 125,
    platformFee: 5,
    paymentStatus: "verified",
    riderId: "rider-one",
  },
  {
    id: "active-rider-two",
    createdAt: "2026-10-27T11:00:00Z",
    status: "accepted",
    total: 80,
    paymentStatus: "pending_verification",
    riderId: "rider-two",
  },
  {
    id: "outside-range",
    createdAt: "2026-10-19T11:00:00Z",
    status: "delivered",
    total: 40,
    platformFee: 2,
    paymentStatus: "verified",
    riderId: "rider-one",
  },
];

describe("getDashboardAnalytics", () => {
  it("aggregates admin orders, completed volume, platform fees, and payment states", () => {
    const analytics = getDashboardAnalytics(orders, "admin", 7, null, now);
    const today = analytics.charts[0].data.at(-1);

    assert.equal(analytics.charts[0].data.length, 7);
    assert.equal(today.orders, 2);
    assert.equal(today.delivered, 1);
    assert.equal(analytics.charts[1].data.at(-1).orderVolume, 125);
    assert.equal(analytics.charts[1].data.at(-1).platformRevenue, 5);
    assert.deepEqual(
      analytics.distribution.map(({ name, value }) => ({ name, value })),
      [
        { name: "Verified", value: 1 },
        { name: "Pending verification", value: 1 },
      ]
    );
  });

  it("limits rider activity and status to orders assigned to that rider", () => {
    const analytics = getDashboardAnalytics(orders, "rider", 7, "rider-one", now);
    const today = analytics.charts[0].data.at(-1);

    assert.equal(today.riderDeliveries, 1);
    assert.equal(analytics.distribution.reduce((total, item) => total + item.value, 0), 1);
    assert.equal(analytics.hasOrders, true);
  });

  it("returns empty data when the selected period has no matching orders", () => {
    const analytics = getDashboardAnalytics(
      orders,
      "student",
      1,
      null,
      new Date("2026-10-28T18:00:00Z")
    );

    assert.equal(analytics.hasOrders, false);
    assert.equal(analytics.distribution.length, 0);
    assert.equal(analytics.charts[0].data.length, 1);
  });
});
