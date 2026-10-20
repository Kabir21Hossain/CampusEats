"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { orderService } from "@/services/order-service";
import { CAMPUS_LOCATIONS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import {
  MapPin,
  CreditCard,
  ShieldCheck,
  Building,
  Phone,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  Bike,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteParam = searchParams.get("note") || "";

  const { items, shop, subtotal, deliveryFee, total, clearCart } = useCart();
  const { currentUser } = useAuth();

  const [deliveryHall, setDeliveryHall] = useState(CAMPUS_LOCATIONS[0]);
  const [roomNumber, setRoomNumber] = useState("Room 304, 3rd Floor");
  const [phone, setPhone] = useState(currentUser?.phone || "+880 1712-345678");
  const [deliveryNote, setDeliveryNote] = useState(noteParam);
  const [paymentMethod, setPaymentMethod] = useState("bKash Sandbox");

  const [isPlacing, setIsPlacing] = useState(false);
  const [showBkashModal, setShowBkashModal] = useState(false);
  const [bkashPin, setBkashPin] = useState("");
  const [pinError, setPinError] = useState("");

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <Link href="/student/home">
          <Button variant="primary">Browse Campus Food</Button>
        </Link>
      </div>
    );
  }

  const handleInitiateOrder = (e) => {
    e.preventDefault();
    if (paymentMethod === "bKash Sandbox") {
      setShowBkashModal(true);
    } else {
      executeOrderCreation();
    }
  };

  const handleBkashConfirm = (e) => {
    e.preventDefault();
    if (!bkashPin || bkashPin.length < 4) {
      setPinError("Please enter a valid 4-digit sandbox PIN");
      return;
    }
    setShowBkashModal(false);
    executeOrderCreation();
  };

  const executeOrderCreation = async () => {
    setIsPlacing(true);
    const orderPayload = {
      customerUserId: currentUser?.id || "student-1",
      customerName: currentUser?.name || "Tanvir Ahmed",
      customerPhone: phone,
      shopId: shop?.id || "shop-1",
      shopName: shop?.name || "Campus Grill & Cafe",
      shopLocation: shop?.campusLocation || "Campus",
      deliveryAddress: `${deliveryHall}, ${roomNumber}`,
      deliveryNote,
      items: items.map((i) => ({
        menuItemId: i.item.id,
        name: i.item.name,
        quantity: i.quantity,
        priceAtOrder: i.item.priceBDT,
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
    };

    try {
      const res = await orderService.createOrder(orderPayload);
      if (res.success) {
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        toast.success(`Order #${res.data.id} placed successfully!`);
        clearCart();
        router.push(`/student/orders/${res.data.id}`);
      } else {
        toast.error(res.error?.message || "Failed to create order");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Confirm Delivery &amp; Checkout
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Review your dormitory address and select your payment method
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Delivery Address & Payment */}
        <form onSubmit={handleInitiateOrder} className="lg:col-span-7 space-y-6">
          {/* Dorm Delivery Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Dormitory Destination
                </h3>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Select Residential Hall / Landmark
                </label>
                <select
                  value={deliveryHall}
                  onChange={(e) => setDeliveryHall(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Room & Floor Number"
                  placeholder="e.g. Room 304, 3rd Floor"
                  icon={Building}
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                />

                <Input
                  label="Phone for Handover Call"
                  placeholder="+880 1712-345678"
                  icon={Phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Delivery Instructions"
                placeholder="e.g. Leave with hall security if attending lecture..."
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Payment Method Selector */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Payment Method (Escrow Secured)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* bKash */}
                <div
                  onClick={() => setPaymentMethod("bKash Sandbox")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "bKash Sandbox"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#e2136e]">bKash Gateway</span>
                    <Badge variant="default" size="sm" className="bg-[#e2136e] text-white text-[10px]">
                      Instant Escrow
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Pay securely via simulated bKash wallet. Locked in escrow until QR handover.
                  </p>
                </div>

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod("Cash on Delivery")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "Cash on Delivery"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Cash on Delivery
                    </span>
                    <Badge variant="neutral" size="sm" className="text-[10px]">
                      At Gate
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Hand exact cash (৳{total}) to the student rider upon QR handover.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPlacing}
            className="w-full rounded-2xl py-3.5 text-base font-bold shadow-md"
          >
            <span>Confirm &amp; Place Order ({formatCurrency(total)})</span>
            <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </form>

        {/* Right Summary */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                Order Items ({items.length})
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 pr-1">
                {items.map(({ item, quantity }) => (
                  <div key={item.id} className="pt-2 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {quantity}x {item.name}
                      </p>
                      <p className="text-zinc-400">{formatCurrency(item.priceBDT)} each</p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(item.priceBDT * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Bike className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Hall Delivery Fee</span>
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  <span>Total Amount</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-tight">
                  Escrow Lock: 85% allocated to canteen, 12% to rider, 3% platform fee upon successful QR verification.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* bKash Sandbox Modal */}
      <Modal
        isOpen={showBkashModal}
        onClose={() => setShowBkashModal(false)}
        title="bKash Sandbox Payment Gateway"
        description={`Authorizing payment of ${formatCurrency(total)} to CampusEats Platform`}
      >
        <form onSubmit={handleBkashConfirm} className="space-y-4">
          <div className="p-3 rounded-xl bg-[#e2136e]/10 border border-[#e2136e]/20 text-xs text-[#e2136e] font-semibold text-center">
            Simulated Sandbox Environment (Test PIN: 1234)
          </div>

          <Input
            label="bKash Wallet Number"
            type="text"
            value="01712-345678"
            disabled
          />

          <Input
            label="Enter 4-Digit bKash PIN"
            type="password"
            placeholder="••••"
            maxLength={4}
            value={bkashPin}
            onChange={(e) => {
              setBkashPin(e.target.value);
              setPinError("");
            }}
            error={pinError}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full bg-[#e2136e] hover:bg-[#c20f5e] text-white font-bold rounded-xl"
          >
            Confirm &amp; Lock in Escrow ({formatCurrency(total)})
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default function StudentCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
