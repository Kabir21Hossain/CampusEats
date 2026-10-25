"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { orderService } from "@/services/order-service";
import { usePolling } from "@/hooks/use-polling";
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusStepper } from "@/components/shared/order-status-stepper";
import { HandoverCodeDisplay } from "@/components/shared/handover-code-display";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Store,
  Bike,
  MapPin,
  Clock,
  Phone,
  ShieldAlert,
  Star,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function OrderTrackingPage({ params }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrder = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await orderService.getOrderById(orderId);
    if (res.success) {
      setOrder(res.data);
      setLoadError("");
    } else {
      setLoadError(res.error?.message || "Unable to load order details.");
    }
    if (showLoading) setLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  usePolling(() => loadOrder(false), 10000);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-zinc-400">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">{loadError ? "Order Unavailable" : "Order Not Found"}</h2>
        {loadError && <p role="alert" className="text-sm text-rose-600">{loadError}</p>}
        {loadError && (
          <Button variant="outline" onClick={() => loadOrder()}>
            Try again
          </Button>
        )}
        <Link href="/student/orders">
          <Button variant="primary">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const isDelivered = order.status === ORDER_STATUS.DELIVERED;
  const isCancelled = order.status === ORDER_STATUS.CANCELLED;
  const canCancel = [
    ORDER_STATUS.PLACED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.AWAITING_RIDER,
  ].includes(order.status);

  const handleCancelOrder = async () => {
    setActionLoading(true);
    const result = await orderService.cancelOrder(order.id);
    setActionLoading(false);
    if (result.success) {
      setOrder(result.data);
      toast.success("Order cancelled.");
    } else {
      toast.error(result.error.message);
    }
  };

  const handleRateOrder = async () => {
    setActionLoading(true);
    const result = await orderService.rateOrder(order.id, {
      shopRating: selectedRating,
      reviewText,
    });
    setActionLoading(false);
    if (result.success) {
      setOrder(result.data);
      toast.success("Thanks for rating your order.");
    } else {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {loadError && (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
          Showing the latest loaded order details. Refresh failed: {loadError}
        </p>
      )}

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Orders</span>
        </Link>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            ORDER_STATUS_COLORS[order.status] || "bg-zinc-100 text-zinc-800"
          }`}
        >
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Header Info */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              Order #{order.id}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Placed on {formatDate(order.createdAt)} • {order.paymentMethod}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-zinc-400">Total Charged</div>
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(order.total)}
            </div>
          </div>
        </div>

        {/* Live Stepper */}
        <OrderStatusStepper
          status={order.status}
          timestamps={order.statusTimestamps || {}}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Handover Code / Rider Card */}
        <div className="md:col-span-7 space-y-6">
          {!isDelivered && !isCancelled && (
            <div className="space-y-4">
              <HandoverCodeDisplay
                code={order.deliveryVerificationCode}
                title="Delivery Handover Code"
                subtitle="When your rider arrives, show them this code. They enter it to verify delivery."
              />

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Keep this code private until the rider is physically handing over your order. The rider must enter the matching code to complete delivery.
                </p>
              </div>
            </div>
          )}

          {/* Delivered Status Review Card */}
          {isDelivered && (
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Order Successfully Delivered!
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Your order is complete. bKash is simulated and cash collection is not verified here, so no real payment or payout was processed.
                </p>

                {order.ratingGiven ? (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-left text-xs space-y-1">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="h-4 w-4 fill-current" />
                      <span>Rated: {order.ratingGiven.shopRating}/5 stars</span>
                    </div>
                    {order.ratingGiven.reviewText && (
                      <p className="text-zinc-600 dark:text-zinc-300 italic">
                        "{order.ratingGiven.reviewText}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-500">How was your order?</p>
                    <div className="flex justify-center gap-1" aria-label="Rate this order">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                          aria-pressed={selectedRating === rating}
                          onClick={() => setSelectedRating(rating)}
                          className="rounded p-1 text-amber-500"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              rating <= selectedRating ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder="Share feedback (optional)"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={actionLoading}
                      onClick={handleRateOrder}
                      className="rounded-xl"
                    >
                      Submit Rating
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assigned Rider Info */}
          {order.riderName ? (
            <Card>
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Bike className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Rider: {order.riderName}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Student Rider • Campus Bicycle
                    </p>
                  </div>
                </div>

                {order.riderPhone && (
                  <a
                    href={`tel:${order.riderPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Call Rider</span>
                  </a>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 text-center text-xs text-zinc-500">
              <Bike className="h-5 w-5 mx-auto mb-1 text-zinc-400 animate-pulse" />
              <span>Awaiting rider claim from nearby campus halls...</span>
            </div>
          )}
        </div>

        {/* Right Side: Order Items & Delivery Summary */}
        <div className="md:col-span-5 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <Store className="h-4 w-4 text-emerald-600" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {order.shopName}
                </h4>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {order.items.map((i, idx) => (
                  <div key={idx} className="pt-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {i.quantity}x {i.name}
                      </p>
                      <p className="text-zinc-400">{formatCurrency(i.priceAtOrder)} each</p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(i.priceAtOrder * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost breakdown */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(order.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(order.platformFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  <span>Total</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>

              {/* Dormitory Address */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1 text-xs">
                <span className="text-zinc-400 font-medium">Delivery Location:</span>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {order.deliveryAddressSnapshot}
                </p>
                {order.deliveryNote && (
                  <p className="text-[11px] text-zinc-500 italic">
                    Note: "{order.deliveryNote}"
                  </p>
                )}
              </div>

              {!isDelivered && !isCancelled && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  {canCancel ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading}
                      onClick={handleCancelOrder}
                      className="w-full rounded-xl text-rose-700"
                    >
                      Cancel Order
                    </Button>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      This order can no longer be cancelled after rider pickup.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
