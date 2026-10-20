"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { shopService } from "@/services/shop-service";
import { orderService } from "@/services/order-service";
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTime } from "@/lib/utils";
import {
  Store,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  ArrowRight,
  Power,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

export default function ShopOwnerDashboardPage() {
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      shopService.getShopById("shop-1"),
      orderService.listOrders({ shopId: "shop-1" }),
    ]).then(([shopRes, orderRes]) => {
      if (shopRes.success) setShop(shopRes.data);
      if (orderRes.success) setOrders(orderRes.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleOpenStatus = async () => {
    const res = await shopService.toggleShopStatus("shop-1");
    if (res.success) {
      setShop(res.data);
      toast.success(
        res.data.isOpen ? "Canteen is now OPEN for campus orders!" : "Canteen marked as CLOSED."
      );
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading owner dashboard...</div>;
  }

  const activeOrders = orders.filter((o) =>
    [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.AWAITING_RIDER].includes(o.status)
  );

  const salesData = [
    { day: "Mon", revenue: 4200 },
    { day: "Tue", revenue: 5800 },
    { day: "Wed", revenue: 6400 },
    { day: "Thu", revenue: 7100 },
    { day: "Fri", revenue: 8900 },
    { day: "Sat", revenue: 9500 },
    { day: "Sun", revenue: 10400 },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Welcome & Open Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {shop?.name || "Campus Grill & Cafe"}
            </h1>
            <Badge
              variant={shop?.isOpen ? "default" : "rose"}
              size="md"
              className={shop?.isOpen ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}
            >
              {shop?.isOpen ? "Accepting Orders" : "Offline"}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {shop?.campusLocation} • TSC Food Court
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={shop?.isOpen ? "outline" : "primary"}
            size="md"
            onClick={handleToggleOpenStatus}
            className="rounded-xl text-xs font-bold"
          >
            <Power className="h-4 w-4" />
            <span>{shop?.isOpen ? "Close Canteen" : "Open for Orders"}</span>
          </Button>

          <Link href="/shop-owner/orders">
            <Button variant="primary" size="md" className="rounded-xl text-xs font-bold">
              <span>View Live Orders ({activeOrders.length})</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Today's Total GMV</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              ৳10,400
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+18% from yesterday</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>85% Escrow Payout Balance</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(shop?.totalEarningsBDT || 48950)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Auto-disbursed upon verified QR handover
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Incoming Active Orders</span>
              <ShoppingBag className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {activeOrders.length}
            </div>
            <p className="text-[11px] text-amber-600 font-semibold">
              Action required in Live Queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Canteen Rating</span>
              <span className="text-amber-500">★</span>
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {shop?.rating || 4.8} / 5.0
            </div>
            <p className="text-[11px] text-zinc-400">
              Based on {shop?.reviewCount || 342} student reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart & Live Queue Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recharts 7-Day Revenue Trend */}
        <Card className="lg:col-span-7">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Weekly Canteen Revenue (BDT)
                </h3>
                <p className="text-xs text-zinc-400">
                  Daily completed order volume across campus
                </p>
              </div>
              <Badge variant="default" size="sm">
                Last 7 Days
              </Badge>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `৳${val}`}
                  />
                  <Tooltip
                    formatter={(value) => [`৳${value}`, "Revenue"]}
                    contentStyle={{
                      backgroundColor: "#18241c",
                      borderRadius: "12px",
                      color: "#fff",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#15803d"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Active Orders Snapshot */}
        <Card className="lg:col-span-5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Live Kitchen Queue
              </h3>
              <Link
                href="/shop-owner/orders"
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Full Queue →
              </Link>
            </div>

            {activeOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                No active orders at this moment.
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {activeOrders.map((ord) => (
                  <div key={ord.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        #{ord.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          ORDER_STATUS_COLORS[ord.status]
                        }`}
                      >
                        {ORDER_STATUS_LABELS[ord.status]}
                      </span>
                    </div>

                    <p className="text-zinc-600 dark:text-zinc-400 line-clamp-1">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>

                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>{ord.deliveryAddressSnapshot}</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 text-xs">
                        {formatCurrency(ord.total)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
