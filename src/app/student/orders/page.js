"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { orderService } from "@/services/order-service";
import { usePolling } from "@/hooks/use-polling";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  Store,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentOrdersPage() {
  const { currentUser } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await orderService.listOrders();
    if (res.success) {
      setOrders(res.data);
      setLoadError("");
    } else {
      setLoadError(res.error?.message || "Unable to load your orders.");
    }
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser) loadOrders();
  }, [currentUser?.id, loadOrders]);

  usePolling(() => {
    if (currentUser) loadOrders(false);
  }, 10000);

  const activeOrders = orders.filter((o) =>
    [
      ORDER_STATUS.PLACED,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.AWAITING_RIDER,
      ORDER_STATUS.CLAIMED,
      ORDER_STATUS.PICKED_UP,
    ].includes(o.status)
  );

  const completedOrders = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED);
  const cancelledOrders = orders.filter((o) =>
    [ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED].includes(o.status)
  );

  const tabs = [
    { id: "all", label: "All Orders", count: orders.length },
    { id: "active", label: "Active Orders", count: activeOrders.length },
    { id: "completed", label: "Completed", count: completedOrders.length },
    { id: "cancelled", label: "Cancelled & declined", count: cancelledOrders.length },
  ];

  const displayedOrders =
    activeTab === "active"
      ? activeOrders
      : activeTab === "completed"
      ? completedOrders
      : activeTab === "cancelled"
      ? cancelledOrders
      : orders;

  const handleReorder = (order) => {
    order.items.forEach((item) => {
      addItem(
        {
          id: item.menuItemId,
          name: item.name,
          priceBDT: item.priceAtOrder,
          photoUrl:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80",
        },
        { id: order.shopId, name: order.shopName }
      );
    });
    toast.success(`Items from ${order.shopName} added to cart!`);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            My Order History
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Track active deliveries and review previous dormitory meals
          </p>
        </div>

        <Link href="/student/home">
          <Button variant="primary" size="sm" className="rounded-xl">
            Order New Food
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      {loadError && orders.length > 0 && (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
          Showing the latest loaded orders. Refresh failed: {loadError}
        </p>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading orders...</div>
      ) : loadError && orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Orders unavailable"
          description={loadError}
          actionText="Try again"
          onAction={() => loadOrders()}
        />
      ) : displayedOrders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description="You don't have any orders matching this category."
          actionText="Browse Canteens"
          onAction={() => (window.location.href = "/student/home")}
        />
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => (
            <Card key={order.id} hoverEffect className="overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      #{order.id}
                    </span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500">{formatDate(order.createdAt)}</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      ORDER_STATUS_COLORS[order.status] || "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      <Store className="h-4 w-4 text-emerald-600" />
                      <span>{order.shopName}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Deliver to: {order.deliveryAddressSnapshot}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right shrink-0">
                    <div>
                      <div className="text-[11px] text-zinc-400">Total Paid</div>
                      <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(order.total)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/student/orders/${order.id}`}>
                        <Button variant="primary" size="sm" className="rounded-xl text-xs">
                          <span>Track Order</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>

                      {order.status === ORDER_STATUS.DELIVERED && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(order)}
                          className="rounded-xl text-xs"
                          title="Add items to cart again"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Reorder</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
