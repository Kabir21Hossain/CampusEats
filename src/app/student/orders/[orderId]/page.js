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
import { OrderReviewModal } from "@/components/reviews/order-review-modal";
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

/**
 * Function OrderTrackingPage.
 * @returns {*} The operation result.
 */
export default function OrderTrackingPage({ params }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [codeReissueLoading, setCodeReissueLoading] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentReferences, setPaymentReferences] = useState({});
  const [paymentError, setPaymentError] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState("");

  const loadOrder = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const [res, paymentResponse] = await Promise.all([
      orderService.getOrderById(orderId),
      orderService.listPayments(orderId),
    ]);
    if (res.success) {
      setOrder(res.data);
      setLoadError("");
    } else {
      setLoadError(res.error?.message || "Unable to load order details.");
    }
    if (paymentResponse.success) {
      setPayments(paymentResponse.data);
      setPaymentError("");
    } else {
      setPaymentError(paymentResponse.error?.message || "Unable to load payment status.");
    }
    if (showLoading) setLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  usePolling(() => loadOrder(false), 10000);

  const closeRatingModal = useCallback(() => setIsRatingOpen(false), []);

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

  /**
   * Arrow function handleCancelOrder.
   * @returns {Promise<*>} Resolves with the operation result.
   */
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

  /**
   * Arrow function handleReissueDeliveryCode.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleReissueDeliveryCode = async () => {
    setCodeReissueLoading(true);
    const result = await orderService.reissueVerificationCode(order.id, "delivery");
    setCodeReissueLoading(false);
    if (!result.success) {
      toast.error(result.error?.message || "Unable to issue a new delivery code.");
      return;
    }
    setOrder(result.data);
    toast.success("A new delivery code is ready.");
  };

  /**
   * Arrow function handleRateOrder.
   * @param {*} review - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleRateOrder = async (review) => {
    setActionLoading(true);
    const result = await orderService.rateOrder(order.id, review);
    setActionLoading(false);
    if (result.success) {
      setOrder(result.data);
      setIsRatingOpen(false);
      toast.success("Thanks for rating your order.");
    } else {
      toast.error(result.error.message);
    }
  };

  /**
   * Arrow function handleSubmitPaymentReference.
   * @param {*} payment - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleSubmitPaymentReference = async (payment) => {
    const reference = String(paymentReferences[payment.obligation] || "").trim();
    if (!reference) {
      setPaymentError("Enter the bKash transaction reference for this payment.");
      return;
    }
    setPaymentSubmitting(payment.obligation);
    setPaymentError("");
    const result = await orderService.submitPaymentReference(
      order.id,
      payment.obligation,
      reference
    );
    setPaymentSubmitting("");
    if (result.success) {
      setPaymentReferences((current) => ({ ...current, [payment.obligation]: "" }));
      toast.success("Reference submitted. It remains pending until an administrator verifies the merchant record.");
      await loadOrder(false);
    } else {
      setPaymentError(result.error?.message || "Unable to submit payment reference.");
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
          rejectionReason={order.rejectionReason}
        />
      </div>

      {payments.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Separate bKash payments</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                The transaction reference is not proof of payment. Both obligations
                must be manually verified before the shop can offer this order for pickup.
                Never provide your PIN or OTP.
              </p>
            </div>
            {paymentError && <p role="alert" className="text-xs text-rose-600">{paymentError}</p>}
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold capitalize">
                      {payment.obligation === "shop" ? "Food amount — shop" : "Delivery + platform fees — CampusEats"}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      BDT {(payment.amountPaisa / 100).toFixed(2)} · Send to {payment.recipient || "recipient not configured"}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium">
                    {payment.status.replaceAll("_", " ")}
                  </span>
                </div>
                {payment.rejectionReason && (
                  <p className="text-xs text-rose-600">Reason: {payment.rejectionReason}</p>
                )}
                {["not_submitted", "rejected", "expired"].includes(payment.status) && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="sr-only" htmlFor={`payment-reference-${payment.obligation}`}>
                      {payment.obligation} bKash transaction reference
                    </label>
                    <input
                      id={`payment-reference-${payment.obligation}`}
                      value={paymentReferences[payment.obligation] || ""}
                      onChange={(event) =>
                        setPaymentReferences((current) => ({
                          ...current,
                          [payment.obligation]: event.target.value,
                        }))
                      }
                      maxLength={50}
                      autoComplete="off"
                      placeholder="Transaction reference"
                      className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                    <Button
                      variant="primary"
                      disabled={paymentSubmitting === payment.obligation}
                      onClick={() => handleSubmitPaymentReference(payment)}
                    >
                      {paymentSubmitting === payment.obligation ? "Submitting..." : "Submit reference"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Handover Code / Rider Card */}
        <div className="md:col-span-7 space-y-6">
          {!isDelivered && !isCancelled && order.status !== ORDER_STATUS.REJECTED && (
            <div className="space-y-4">
              {order.status === ORDER_STATUS.PICKED_UP ? (
                <>
                  <HandoverCodeDisplay
                    code={order.deliveryVerificationCode}
                    title="Delivery Handover Code"
                    subtitle="When your rider arrives, show them this code. They enter it to verify delivery."
                  />
                  <Button
                    variant="outline"
                    disabled={codeReissueLoading}
                    isLoading={codeReissueLoading}
                    onClick={handleReissueDeliveryCode}
                    className="w-full"
                  >
                    Issue a new delivery code
                  </Button>
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      Keep this code private until the rider is physically handing over your order. The rider must enter the matching code to complete delivery.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Your delivery handover code will appear here after the rider verifies pickup.
                  </p>
                </div>
              )}
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
                      <span>
                        Feedback submitted
                        {order.ratingGiven.shopRating
                          ? ` · Shop ${order.ratingGiven.shopRating}/5`
                          : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {(order.ratingGiven.foodReviews || []).map((review) => (
                        <span key={review.menuItemId} className="rounded-full bg-white px-2.5 py-1 dark:bg-zinc-900">
                          Food {review.rating}/5
                        </span>
                      ))}
                      {order.ratingGiven.riderReview && (
                        <span className="rounded-full bg-white px-2.5 py-1 dark:bg-zinc-900">
                          Rider {order.ratingGiven.riderReview.rating}/5
                        </span>
                      )}
                    </div>
                    {[
                      order.ratingGiven.shopReview,
                      ...(order.ratingGiven.foodReviews || []),
                      order.ratingGiven.riderReview,
                    ]
                      .filter((review) => review?.comment)
                      .map((review, index) => (
                        <p key={`${review.rating}-${index}`} className="text-zinc-600 dark:text-zinc-300 italic">
                          “{review.comment}”
                        </p>
                      ))}
                    {order.ratingGiven.reviewText && !order.ratingGiven.shopReview && (
                      <p className="text-zinc-600 dark:text-zinc-300 italic">
                        “{order.ratingGiven.reviewText}”
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsRatingOpen(true)}
                      className="rounded-xl"
                    >
                      <Star className="h-4 w-4" />
                      Rate your experience
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

      <OrderReviewModal
        isOpen={isRatingOpen}
        onClose={closeRatingModal}
        order={order}
        isSubmitting={actionLoading}
        onSubmit={handleRateOrder}
      />
    </div>
  );
}
