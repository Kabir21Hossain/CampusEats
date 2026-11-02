"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminService } from "@/services/admin-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, Store, Users, TrendingUp } from "lucide-react";
import { orderService } from "@/services/order-service";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";

/**
 * Function AdminDashboardPage.
 * @returns {*} The operation result.
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([adminService.getDashboardKPIs(), orderService.listOrders()])
      .then(([statsResponse, ordersResponse]) => {
        if (!active) return;
        if (statsResponse.success) {
          setStats(statsResponse.data);
        } else {
          setError(statsResponse.error.message);
        }
        if (ordersResponse.success) {
          setOrders(ordersResponse.data);
        } else {
          setOrdersError(ordersResponse.error.message);
        }
        setLoading(false);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message || "Unable to load admin dashboard data.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading admin overview...</div>;
  }

  if (error) {
    return (
      <div role="alert" className="p-6 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
        Could not load the admin overview: {error}
      </div>
    );
  }

  const metrics = [
    {
      label: "Completed order volume",
      value: formatCurrency(stats.totalGMV),
      icon: TrendingUp,
    },
    {
      label: "Platform revenue",
      value: formatCurrency(stats.platformRevenue),
      icon: TrendingUp,
    },
    { label: "Shops", value: stats.activeShops, icon: Store },
    { label: "Users", value: stats.totalUsers, icon: Users },
    { label: "Orders", value: stats.totalOrders, icon: ShoppingBag },
    { label: "Completed deliveries", value: stats.deliveredOrders, icon: ShoppingBag },
  ];

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Campus Platform Administration
          </h1>
          <p className="text-sm text-zinc-500">
            Live platform statistics from the CampusEats backend.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="primary" size="md">Manage users</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline" size="md">View orders</Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span>{label}</span>
                <Icon className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardAnalytics orders={orders} role="admin" error={ordersError} />
    </div>
  );
}
