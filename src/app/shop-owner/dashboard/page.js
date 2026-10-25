"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { shopService } from "@/services/shop-service";
import { orderService } from "@/services/order-service";
import { useAuth } from "@/context/auth-context";
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Power, ShoppingBag, Store, TrendingUp } from "lucide-react";

export default function ShopOwnerDashboardPage() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    const shopResponse = await shopService.getShopByOwner(currentUserId);
    const ordersResponse = await orderService.listOrders();

    if (!shopResponse.success) {
      setShop(null);
      setError(shopResponse.error.message);
    } else {
      setShop(shopResponse.data);
      if (!ordersResponse.success) {
        setError(ordersResponse.error.message);
      } else {
        setOrders(
          ordersResponse.data.filter((order) => order.shopId === shopResponse.data.id)
        );
        setError("");
      }
    }
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleOpenStatus = async () => {
    const response = await shopService.toggleShopStatus(shop.id, !shop.isOpen);
    if (response.success) {
      setShop(response.data);
    } else {
      setError(response.error.message);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading owner dashboard...</div>;
  }

  if (!shop) {
    return (
      <div role={error ? "alert" : undefined} className="p-12 text-center text-sm text-zinc-500">
        {error || "No shop is assigned to this account yet."}
      </div>
    );
  }

  const activeOrders = orders.filter((order) =>
    [
      ORDER_STATUS.PLACED,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.AWAITING_RIDER,
    ].includes(order.status)
  );
  const deliveredOrders = orders.filter(
    (order) => order.status === ORDER_STATUS.DELIVERED
  );
  const completedVolume = deliveredOrders.reduce(
    (total, order) => total + (order.total || 0),
    0
  );

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {shop.name}
            </h1>
            <Badge
              variant={shop.isOpen ? "default" : "rose"}
              size="md"
              className={shop.isOpen ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}
            >
              {shop.isOpen ? "Accepting Orders" : "Offline"}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{shop.campusLocation}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={shop.isOpen ? "outline" : "primary"}
            size="md"
            onClick={handleToggleOpenStatus}
            className="rounded-xl text-xs font-bold"
          >
            <Power className="h-4 w-4" />
            <span>{shop.isOpen ? "Close Canteen" : "Open for Orders"}</span>
          </Button>
          <Link href="/shop-owner/orders">
            <Button variant="primary" size="md" className="rounded-xl text-xs font-bold">
              <span>View Live Orders ({activeOrders.length})</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Could not refresh all shop data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Active orders</span>
              <ShoppingBag className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold">{activeOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Completed deliveries</span>
              <Store className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold">{deliveredOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Completed order volume</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold">{formatCurrency(completedVolume)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Shop rating</span>
              <span className="text-amber-500">★</span>
            </div>
            <div className="text-2xl font-extrabold">
              {shop.rating ? `${shop.rating} / 5` : "Not rated"}
            </div>
            <p className="text-xs text-zinc-500">
              {shop.reviewCount || 0} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Kitchen queue</h2>
            <Link href="/shop-owner/orders" className="text-xs font-semibold text-emerald-700 hover:underline">
              Full queue →
            </Link>
          </div>
          {activeOrders.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-400">No active orders.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {activeOrders.map((order) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-mono text-xs font-bold">#{order.id}</p>
                    <p className="text-xs text-zinc-500">
                      {(order.items || []).map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                    <strong className="text-xs text-emerald-700">{formatCurrency(order.total)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-500">
        Wallet balances, payouts, and historical revenue analytics are not exposed by the backend yet.
      </p>
    </div>
  );
}
