"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Store,
  ShieldCheck,
  Bike,
  ArrowLeft,
} from "lucide-react";

export default function StudentCartPage() {
  const router = useRouter();
  const {
    items,
    shop,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [deliveryNote, setDeliveryNote] = useState("");

  if (items.length === 0) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added any campus food yet. Explore our delicious verified canteens!"
          actionText="Explore Campus Shops"
          onAction={() => router.push("/student/home")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Shopping Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </h1>
          {shop && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1">
              <Store className="h-3.5 w-3.5 text-emerald-600" />
              <span>Ordering from: <strong className="text-zinc-800 dark:text-zinc-200">{shop.name}</strong></span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-7 space-y-3">
          {items.map(({ item, quantity }) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="h-16 w-16 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-800 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                      {formatCurrency(item.priceBDT)} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, quantity - 1)}
                      className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, quantity + 1)}
                      className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Subtotal for line item */}
                  <div className="text-right w-16">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(item.priceBDT * quantity)}
                    </span>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Delivery Note */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Delivery Instructions for Rider (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Call when outside the hall gate, extra chilli sauce..."
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="lg:col-span-5">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                Order Total Breakdown
              </h3>

              <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span>Food Subtotal</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Bike className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Flat Hall Delivery Fee</span>
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  <span>Total Amount</span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-base">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Escrow safety badge */}
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-tight">
                  Held safely in escrow until you verify the QR handover with your rider.
                </span>
              </div>

              <Link
                href={`/student/checkout?note=${encodeURIComponent(deliveryNote)}`}
                className="block w-full"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full rounded-xl font-bold py-3 text-sm flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <div className="text-center">
                <Link
                  href="/student/home"
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Continue Ordering</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
