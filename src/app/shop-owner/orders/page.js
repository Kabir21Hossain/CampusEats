"use client";

import React, { useState, useEffect, useCallback } from "react";
import { orderService } from "@/services/order-service";
import { usePolling } from "@/hooks/use-polling";
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { HandoverCodeDisplay } from "@/components/shared/handover-code-display";
import { formatCurrency, formatTime } from "@/lib/utils";
import {
  ChefHat,
  Clock,
  Check,
  X,
  PackageCheck,
  Bike,
  AlertCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

export default function ShopOwnerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("live");
  const [activeQRModalOrder, setActiveQRModalOrder] = useState(null);

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await orderService.listOrders();
    if (res.success) {
      setOrders(res.data);
      setLoadError("");
    } else {
      setLoadError(res.error?.message || "Unable to load the order queue.");
    }
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  usePolling(() => loadOrders(false), 10000);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const res = await orderService.updateOrderStatus(orderId, newStatus);
    if (res.success) {
      if (res.meta?.notificationWarning) toast.warning(res.meta.notificationWarning);
      toast.success(`Order #${orderId} marked as ${ORDER_STATUS_LABELS[newStatus]}`);
      loadOrders();
    } else {
      toast.error(res.error?.message || "Failed to update status");
    }
  };

  const handleReject = async (orderId) => {
    const res = await orderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.REJECTED,
      "The shop declined this order."
    );
    if (res.success) {
      if (res.meta?.notificationWarning) toast.warning(res.meta.notificationWarning);
      toast.info(`Order #${orderId} was declined.`);
      loadOrders();
    } else {
      toast.error(res.error?.message || "Failed to decline order.");
    }
  };

  const liveOrders = orders.filter((o) =>
    [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.AWAITING_RIDER].includes(o.status)
  );

  const inTransitOrders = orders.filter((o) =>
    [ORDER_STATUS.CLAIMED, ORDER_STATUS.PICKED_UP].includes(o.status)
  );

  const completedOrders = orders.filter((o) =>
    [ORDER_STATUS.DELIVERED, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED].includes(o.status)
  );

  const tabs = [
    { id: "live", label: "Incoming & Kitchen Queue", count: liveOrders.length },
    { id: "in_transit", label: "Out with Rider", count: inTransitOrders.length },
    { id: "history", label: "Order History", count: completedOrders.length },
  ];

  const displayedOrders =
    activeTab === "live"
      ? liveOrders
      : activeTab === "in_transit"
      ? inTransitOrders
      : completedOrders;

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Live Order Preparation Queue
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Accept incoming orders, update kitchen preparation, and verify rider pickup handovers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" size="md" className="bg-emerald-100 text-emerald-800">
            ● Auto-refreshes every 10 seconds
          </Badge>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      {loadError && orders.length > 0 && (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
          Showing the latest loaded queue. Refresh failed: {loadError}
        </p>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading order queue...</div>
      ) : loadError && orders.length === 0 ? (
        <div role="alert" className="p-8 text-center text-sm text-rose-600">
          {loadError}
          <Button variant="outline" size="sm" onClick={() => loadOrders()} className="ml-3">
            Retry
          </Button>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
          No orders in this queue.
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((ord) => (
            <Card key={ord.id} className="overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                      #{ord.id}
                    </span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500 font-medium">
                      Customer: {ord.customerName} ({ord.customerPhone})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        ORDER_STATUS_COLORS[ord.status]
                      }`}
                    >
                      {ORDER_STATUS_LABELS[ord.status]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Items list */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="space-y-1">
                      {ord.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {i.quantity}x {i.name}
                          </span>
                          <span className="text-zinc-500">
                            {formatCurrency(i.priceAtOrder * i.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-zinc-400 pt-1">
                      Deliver to: <strong>{ord.deliveryAddressSnapshot}</strong>
                      {ord.deliveryNote && ` • "${ord.deliveryNote}"`}
                    </p>
                  </div>

                  {/* Actions according to status */}
                  <div className="md:col-span-5 flex flex-col sm:items-end justify-center gap-2 sm:border-l sm:border-zinc-100 dark:sm:border-zinc-800 sm:pl-6">
                    <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                      Order Total: {formatCurrency(ord.total)}
                    </div>

                    {ord.status === ORDER_STATUS.PLACED && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(ord.id)}
                          className="text-xs text-rose-600 hover:bg-rose-50 flex-1 sm:flex-none"
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(ord.id, ORDER_STATUS.CONFIRMED)}
                          className="text-xs font-bold flex-1 sm:flex-none"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept &amp; Prepare
                        </Button>
                      </div>
                    )}

                    {ord.status === ORDER_STATUS.CONFIRMED && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(ord.id, ORDER_STATUS.PREPARING)}
                        className="w-full sm:w-auto rounded-xl text-xs font-bold"
                      >
                        <ChefHat className="h-3.5 w-3.5" />
                        Start Preparing
                      </Button>
                    )}

                    {ord.status === ORDER_STATUS.PREPARING && (
                      <>
                        {ord.paymentStatus !== "verified" && (
                          <p className="max-w-sm text-right text-[11px] text-amber-700 dark:text-amber-300">
                            Both student payments must be submitted and manually verified by an administrator before riders can see this order.
                          </p>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(ord.id, ORDER_STATUS.AWAITING_RIDER)}
                          className="w-full sm:w-auto rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700"
                        >
                          <ChefHat className="h-3.5 w-3.5" />
                          Mark Ready for Rider Pickup
                        </Button>
                      </>
                    )}

                    {[ORDER_STATUS.AWAITING_RIDER, ORDER_STATUS.CLAIMED].includes(ord.status) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveQRModalOrder(ord)}
                        className="w-full sm:w-auto rounded-xl text-xs font-bold"
                      >
                        Show Shop Handover Code
                      </Button>
                    )}

                    {ord.riderName && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-1">
                        <Bike className="h-3.5 w-3.5 text-blue-600" />
                        <span>Rider: <strong>{ord.riderName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pickup code presentation modal */}
      <Modal
        isOpen={!!activeQRModalOrder}
        onClose={() => setActiveQRModalOrder(null)}
        title={`Rider Pickup Verification — #${activeQRModalOrder?.id}`}
        description="Once a rider claims this order, show the code to them when handing over the food. The rider enters it to confirm pickup."
      >
        {activeQRModalOrder && (
          <div className="space-y-4 text-center">
            <HandoverCodeDisplay
              code={activeQRModalOrder.pickupVerificationCode}
              title="Shop Handover Code"
              subtitle="Show this code to the assigned rider. They enter it in Active Delivery to confirm pickup."
            />
            <Button
              variant="outline"
              size="md"
              onClick={() => setActiveQRModalOrder(null)}
              className="w-full rounded-xl"
            >
              Done &amp; Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
