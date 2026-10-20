"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { orderService } from "@/services/order-service";
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { OrderStatusStepper } from "@/components/shared/order-status-stepper";
import { QRDisplay } from "@/components/shared/qr-display";
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
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function OrderTrackingPage({ params }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Rating modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [shopRating, setShopRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const loadOrder = () => {
    orderService.getOrderById(orderId).then((res) => {
      if (res.success) setOrder(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

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
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <Link href="/student/orders">
          <Button variant="primary">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const isDelivered = order.status === ORDER_STATUS.DELIVERED;
  const isCancelled =
    order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REJECTED;

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }
    setCancelLoading(true);
    const res = await orderService.cancelOrder(order.id, cancelReason);
    setCancelLoading(false);
    if (res.success) {
      toast.success("Order cancelled and escrow refund initiated.");
      setShowCancelModal(false);
      loadOrder();
    } else {
      toast.error(res.error?.message || "Cancellation failed");
    }
  };

  const handleSimulateHandover = async () => {
    const res = await orderService.updateOrderStatus(order.id, ORDER_STATUS.DELIVERED);
    if (res.success) {
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {}
      toast.success("Handover confirmed! Escrow funds released.");
      loadOrder();
      setShowRatingModal(true);
    }
  };

  const handleSaveRating = async (e) => {
    e.preventDefault();
    const res = await orderService.rateOrder(order.id, {
      shopRating,
      riderRating,
      reviewText,
    });
    if (res.success) {
      toast.success("Thank you for your rating & review!");
      setShowRatingModal(false);
      loadOrder();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
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
        {/* Left Side: Handover QR Code / Rider Card */}
        <div className="md:col-span-7 space-y-6">
          {!isDelivered && !isCancelled && (
            <div className="space-y-4">
              <QRDisplay
                code={order.deliveryVerificationCode}
                title="Delivery Handover Code"
                subtitle="Present this QR code or 4-digit code to the rider at your hall gate"
              />

              {/* Developer / Demo Quick Handover Simulation Button */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Demo Action: Simulate Rider Arrival &amp; Handover
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSimulateHandover}
                  className="w-full rounded-xl text-xs font-bold"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Handover &amp; Release Escrow
                </Button>
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
                  Escrow payment has been verified and settled to {order.shopName} (85%) and rider (12%).
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
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setShowRatingModal(true)}
                    className="rounded-xl"
                  >
                    <Star className="h-4 w-4" />
                    Rate Shop &amp; Rider
                  </Button>
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

                <a
                  href={`tel:${order.riderPhone || "+8801911223344"}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Call Rider</span>
                </a>
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

              {/* Cancellation policy action */}
              {!isDelivered && !isCancelled && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full text-xs font-semibold text-rose-600 hover:text-rose-700 py-1"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Order & Refund Escrow"
        description="Orders can only be cancelled before food is picked up by a rider."
      >
        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Reason for Cancellation
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Ordered by mistake, long wait time..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowCancelModal(false)}
              className="flex-1"
            >
              Keep Order
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={cancelLoading}
              onClick={handleCancelOrder}
              className="flex-1"
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rating & Review Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Rate Your Food & Delivery"
        description="Help improve campus dining with your feedback"
      >
        <form onSubmit={handleSaveRating} className="space-y-4 text-left">
          {/* Shop rating */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Canteen Food Rating ({shopRating}/5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setShopRating(star)}
                  className={`p-1.5 rounded-lg text-lg transition-transform hover:scale-110 ${
                    star <= shopRating ? "text-amber-400" : "text-zinc-300 dark:text-zinc-700"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Rider rating */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Rider Delivery Rating ({riderRating}/5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRiderRating(star)}
                  className={`p-1.5 rounded-lg text-lg transition-transform hover:scale-110 ${
                    star <= riderRating ? "text-amber-400" : "text-zinc-300 dark:text-zinc-700"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Review Comment
            </label>
            <textarea
              rows={3}
              placeholder="Food temperature, packaging, speed..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full rounded-xl font-bold">
            Submit Rating &amp; Review
          </Button>
        </form>
      </Modal>
    </div>
  );
}
