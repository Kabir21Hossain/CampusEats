"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { adminService } from "@/services/admin-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  TrendingUp,
  Store,
  Users,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardKPIs().then((res) => {
      if (res.success) setKpis(res.data);
      setLoading(false);
    });
  }, []);

  const chartData = [
    { month: "May", gmv: 34000, orders: 120 },
    { month: "Jun", gmv: 48000, orders: 185 },
    { month: "Jul", gmv: 62000, orders: 240 },
    { month: "Aug", gmv: 79000, orders: 310 },
    { month: "Sep", gmv: 95000, orders: 395 },
    { month: "Oct", gmv: 118000, orders: 480 },
  ];

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading admin KPIs...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              Campus Platform Administration
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Dhaka University CampusEats Operations, Escrow &amp; Dispute Oversight
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/shops">
            <Button variant="primary" size="md" className="rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white">
              <span>Review Applications ({kpis?.pendingApplications || 0})</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Platform GMV</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(kpis?.totalGMV || 118000)}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold">
              +24% monthly volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Active Approved Shops</span>
              <Store className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {kpis?.activeShops || 6} canteens
            </div>
            <p className="text-[11px] text-amber-600 font-semibold">
              {kpis?.pendingApplications} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Total Orders</span>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {kpis?.totalOrders || 480}
            </div>
            <p className="text-[11px] text-blue-600 font-semibold">
              {kpis?.deliveredOrders} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Dispute Queue</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600">
              {kpis?.activeDisputes || 1} open
            </div>
            <Link href="/admin/disputes" className="text-[11px] text-rose-600 font-bold hover:underline">
              Resolve now →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recharts Bar Chart */}
        <Card className="lg:col-span-8">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Gross Platform Merchandise Volume (BDT ৳)
                </h3>
                <p className="text-xs text-zinc-400">
                  Monthly platform order turnover
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                2026 Academic Year
              </Badge>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `৳${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val) => [`৳${val}`, "GMV"]}
                    contentStyle={{
                      backgroundColor: "#18241c",
                      borderRadius: "12px",
                      color: "#fff",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="gmv" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Management Quick Actions */}
        <Card className="lg:col-span-4">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              Administrative Portals
            </h3>

            <div className="space-y-2">
              <Link
                href="/admin/shops"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-amber-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Shop Approvals
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {kpis?.pendingApplications} applications pending
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      User Directory
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Manage students, owners, riders
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>

              <Link
                href="/admin/orders"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Order Monitor
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Real-time campus order audits
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>

              <Link
                href="/admin/disputes"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Dispute Queue
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Refunds &amp; escrow arbitration
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
