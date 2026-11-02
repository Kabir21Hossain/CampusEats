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

const SHOP_ORDER_STATUS_FILTERS = [
  { value: "pending_shop_acceptance", label: ORDER_STATUS_LABELS[ORDER_STATUS.PLACED] },
  { value: "accepted", label: ORDER_STATUS_LABELS[ORDER_STATUS.CONFIRMED] },
  { value: "preparing", label: ORDER_STATUS_LABELS[ORDER_STATUS.PREPARING] },
  { value: "ready_for_pickup", label: ORDER_STATUS_LABELS[ORDER_STATUS.AWAITING_RIDER] },
  { value: "rider_assigned", label: "Rider Assigned" },
  { value: "picked_up", label: ORDER_STATUS_LABELS[ORDER_STATUS.PICKED_UP] },
  { value: "delivered", label: ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED] },
  { value: "rejected", label: ORDER_STATUS_LABELS[ORDER_STATUS.REJECTED] },
  { value: "cancelled", label: ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED] },
  { value: "delivery_failed", label: "Delivery Failed" },
  { value: "refunded", label: "Refunded" },
];

/**
 * Function ShopOwnerOrdersPage.
 * @returns {*} The operation result.
 */
export default function ShopOwnerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("live");
  const [activeQRModalOrder, setActiveQRModalOrder] = useState(null);
  const [handoverLoadingOrderId, setHandoverLoadingOrderId] = useState("");
  const [codeReissueLoading, setCodeReissueLoading] = useState(false);
  const [rejectionOrderId, setRejectionOrderId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [queueFilters, setQueueFilters] = useState({ status: "", from: "", to: "" });

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await orderService.listOrders({
      page,
      limit: 50,
      ...queueFilters,
    });
    if (res.success) {
      setOrders(res.data);
      setPagination(res.meta);
      setLoadError("");
    } else {
      setLoadError(res.error?.message || "Unable to load the order queue.");
    }
    if (showLoading) setLoading(false);
  }, [page, queueFilters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  usePolling(() => loadOrders(false), 10000);

  /**
   * Arrow function handleUpdateStatus.
   * @param {*} orderId - Input value used by the operation.
   * @param {*} newStatus - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
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

  /**
   * Arrow function handleReject.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length > 500) return;
    const res = await orderService.updateOrderStatus(
      rejectionOrderId,
      ORDER_STATUS.REJECTED,
      rejectionReason.trim()
    );
    if (res.success) {
      if (res.meta?.notificationWarning) toast.warning(res.meta.notificationWarning);
      toast.info(`Order #${rejectionOrderId} was declined.`);
      setRejectionOrderId("");
      setRejectionReason("");
      loadOrders();
    } else {
      toast.error(res.error?.message || "Failed to decline order.");
    }
  };

  /**
   * Arrow function handleShowHandoverCode.
   * @param {*} orderId - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleShowHandoverCode = async (orderId) => {
    setHandoverLoadingOrderId(orderId);
    const res = await orderService.getOrderById(orderId);
    if (res.success) {
      setActiveQRModalOrder(res.data);
    } else {
      toast.error(res.error?.message || "Unable to load the pickup code.");
    }
    setHandoverLoadingOrderId("");
  };

  /**
   * Arrow function handleReissueHandoverCode.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleReissueHandoverCode = async () => {
    if (!activeQRModalOrder) return;
    setCodeReissueLoading(true);
    const result = await orderService.reissueVerificationCode(
      activeQRModalOrder.id,
      "shop_handover"
    );
    setCodeReissueLoading(false);
    if (!result.success) {
      toast.error(result.error?.message || "Unable to issue a new pickup code.");
      return;
    }
    setActiveQRModalOrder(result.data);
    toast.success("A new pickup code is ready.");
  };

  const liveOrders = orders.filter((o) =>
    [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.AWAITING_RIDER].includes(o.status)
  );

  const inTransitOrders = orders.filter((o) =>
    [ORDER_STATUS.CLAIMED, ORDER_STATUS.PICKED_UP].includes(o.status)
  );

  const completedOrders = orders.filter((o) =>
    [
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.REJECTED,
      ORDER_STATUS.CANCELLED,
      "delivery_failed",
      "refunded",
    ].includes(o.status)
  );

  const tabs = [
    { id: "live", label: "Incoming & Kitchen Queue" },
    { id: "in_transit", label: "Out with Rider" },
    { id: "history", label: "Order History" },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Status
          <select
            value={queueFilters.status}
            onChange={(event) => {
              setPage(1);
              setQueueFilters((current) => ({ ...current, status: event.target.value }));
            }}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {SHOP_ORDER_STATUS_FILTERS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          From date
          <input
            type="date"
            value={queueFilters.from}
            max={queueFilters.to || undefined}
            onChange={(event) => {
              setPage(1);
              setQueueFilters((current) => ({ ...current, from: event.target.value }));
            }}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          To date
          <input
            type="date"
            value={queueFilters.to}
            min={queueFilters.from || undefined}
            onChange={(event) => {
              setPage(1);
              setQueueFilters((current) => ({ ...current, to: event.target.value }));
            }}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-end text-xs text-zinc-500">
          Showing {orders.length} of {pagination.total || 0} matching orders
        </div>
      </div>
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
                          onClick={() => {
                            setRejectionOrderId(ord.id);
                            setRejectionReason("");
                          }}
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
                        isLoading={handoverLoadingOrderId === ord.id}
                        onClick={() => handleShowHandoverCode(ord.id)}
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

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <span className="text-xs text-zinc-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(rejectionOrderId)}
        onClose={() => {
          setRejectionOrderId("");
          setRejectionReason("");
        }}
        title={`Decline order #${rejectionOrderId}`}
        description="A clear reason will be shared with the student and included in order history."
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Rejection reason
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              maxLength={500}
              rows={4}
              required
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              placeholder="Explain why this order cannot be accepted."
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectionOrderId("");
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!rejectionReason.trim()}
              onClick={handleReject}
            >
              Confirm decline
            </Button>
          </div>
        </div>
      </Modal>

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
              disabled={codeReissueLoading}
              isLoading={codeReissueLoading}
              onClick={handleReissueHandoverCode}
              className="w-full rounded-xl"
            >
              Issue a new pickup code
            </Button>
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
