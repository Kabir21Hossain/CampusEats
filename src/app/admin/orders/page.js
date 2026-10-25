"use client";

import React, { useState, useEffect, useCallback } from "react";
import { orderService } from "@/services/order-service";
import { usePolling } from "@/hooks/use-polling";
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Store,
  Bike,
  CheckCircle2,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inspectOrder, setInspectOrder] = useState(null);

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await orderService.listOrders();
    if (res.success) {
      setOrders(res.data);
      setLoadError("");
    } else {
      setLoadError(res.error?.message || "Unable to load platform orders.");
    }
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  usePolling(() => loadOrders(false), 10000);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Platform-Wide Order Monitoring
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automatically refreshed audit log of campus orders and delivery handovers
          </p>
        </div>

        <div className="text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-200/50 dark:border-purple-800/40">
          Total Recorded Orders: {orders.length}
        </div>
      </div>

      {/* Filter status buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1">
        {["all", ...Object.values(ORDER_STATUS)].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === st
                ? "bg-purple-700 text-white shadow-xs font-bold"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-purple-400"
            }`}
          >
            {st === "all" ? "All Statuses" : ORDER_STATUS_LABELS[st] || st}
          </button>
        ))}
      </div>
      {loadError && orders.length > 0 && (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
          Showing the latest loaded orders. Refresh failed: {loadError}
        </p>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading orders...</div>
          ) : loadError && orders.length === 0 ? (
            <div role="alert" className="py-12 text-center text-sm text-rose-600">
              {loadError}
              <button type="button" onClick={() => loadOrders()} className="ml-2 underline">
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">No orders matching filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">Order ID</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Canteen</th>
                    <th className="py-2.5">Student / Hall</th>
                    <th className="py-2.5">Rider</th>
                    <th className="py-2.5">Total</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        #{ord.id}
                      </td>
                      <td className="py-3 text-zinc-500">{formatDate(ord.createdAt)}</td>
                      <td className="py-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {ord.shopName}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-300">
                        <p className="font-semibold">{ord.customerName}</p>
                        <p className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                          {ord.deliveryAddressSnapshot}
                        </p>
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-300">
                        {ord.riderName || <span className="text-zinc-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3 font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(ord.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            ORDER_STATUS_COLORS[ord.status]
                          }`}
                        >
                          {ORDER_STATUS_LABELS[ord.status] || ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectOrder(ord)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                          title="Inspect details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect Modal */}
      <Modal
        isOpen={!!inspectOrder}
        onClose={() => setInspectOrder(null)}
        title={`Audit Inspection — Order #${inspectOrder?.id}`}
        description="Detailed ledger snapshot, timestamps, and escrow state"
      >
        {inspectOrder && (
          <div className="space-y-4 text-xs text-left">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <div>
                <span className="text-zinc-400 font-medium">Payment Mode:</span>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                  {inspectOrder.paymentMethod}
                </p>
              </div>
              <div>
                <span className="text-zinc-400 font-medium">Settlement Status:</span>
                <p className="font-bold text-emerald-600 uppercase">
                  {inspectOrder.escrowStatus}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500">
              Handover codes are restricted to the student and shop owner and are not available in admin views.
            </p>

            <div className="space-y-1">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Items Snapshot:
              </span>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {inspectOrder.items.map((i, idx) => (
                  <li key={idx} className="py-1.5 flex justify-between">
                    <span>
                      {i.quantity}x {i.name}
                    </span>
                    <span className="font-semibold">{formatCurrency(i.priceAtOrder * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => setInspectOrder(null)}
              className="w-full rounded-xl"
            >
              Close Inspection
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
