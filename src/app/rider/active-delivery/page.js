"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { riderService } from "@/services/rider-service";
import { useAuth } from "@/context/auth-context";
import { ORDER_STATUS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HandoverCodeForm } from "@/components/shared/handover-code-form";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Bike,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  Package,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function RiderActiveDeliveryPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeStep, setActiveStep] = useState(1); // 1 = pickup, 3 = delivery route, 4 = delivery verification, 5 = completed

  const loadActiveOrder = () => {
    setLoading(true);
    riderService.getActiveDelivery().then((res) => {
      if (res.success && res.data) {
        setOrder(res.data);
        setLoadError("");
        if (res.data.status === ORDER_STATUS.PICKED_UP) {
          setActiveStep(3); // Already picked up, en route to dorm
        } else {
          setActiveStep(1); // Claimed, heading to pickup
        }
      } else {
        setOrder(null);
        setLoadError(res.error?.message || "");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadActiveOrder();
  }, [currentUser]);

  const handleVerifyPickup = async (code) => {
    const res = await riderService.verifyPickup(order.id, code);
    if (res.success) {
      if (res.meta?.notificationWarning) toast.warning(res.meta.notificationWarning);
      toast.success("Pickup verified! Food collected from canteen.");
      setOrder(res.data);
      setActiveStep(3); // Advance to en route to student
    } else {
      toast.error(res.error?.message || "Invalid pickup code");
    }
  };

  const handleVerifyDelivery = async (code) => {
    const res = await riderService.verifyDelivery(order.id, code);
    if (res.success) {
      if (res.meta?.notificationWarning) toast.warning(res.meta.notificationWarning);
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch {}
      toast.success("Delivery completed. Sandbox settlement was recorded.");
      setOrder(res.data);
      setActiveStep(5); // Completed!
    } else {
      toast.error(res.error?.message || "Invalid customer delivery code");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading delivery journey...</div>;
  }

  if (!order && activeStep !== 5) {
    return (
      <div className="py-16 max-w-md mx-auto">
        <EmptyState
          icon={Bike}
          title={loadError ? "Unable to load delivery" : "No active delivery in progress"}
          description={loadError || "You don't have an ongoing delivery right now. Check the available feed to claim a new order."}
          actionText={loadError ? "Try again" : "View Available Orders"}
          onAction={loadError ? loadActiveOrder : () => router.push("/rider/available-orders")}
        />
      </div>
    );
  }

  const riderEarnings = Math.max(35, Math.round((order?.total || 300) * 0.12));

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Step Tracker Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
            Active Delivery Workflow
          </span>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Order #{order?.id}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
          <span>Fee: {formatCurrency(riderEarnings)}</span>
        </div>
      </div>

      {/* Workflow Step Content */}

      {/* STEP 1: Head to Canteen */}
      {activeStep === 1 && (
        <Card className="border-emerald-600/40">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 p-2.5 rounded-xl">
              <Store className="h-4 w-4" />
              <span>Step 1: Head to Canteen for Pickup</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {order.shopName}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{order.shopLocation}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1 text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Items to Collect:
              </span>
              <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 pt-1 space-y-0.5">
                {order.items.map((i, idx) => (
                  <li key={idx}>
                    {i.quantity}x {i.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Shop handover code
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ask the shop staff for the pickup code when you collect the order.
                </p>
              </div>
              <HandoverCodeForm
                onVerify={handleVerifyPickup}
                actionLabel="Verify Pickup"
                codeLength={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: En route to Student Dormitory */}
      {activeStep === 3 && (
        <Card className="border-blue-600/40">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 p-2.5 rounded-xl">
              <Bike className="h-4 w-4" />
              <span>Step 2: En Route to Dormitory Destination</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {order.deliveryAddressSnapshot}
              </h3>
              <p className="text-xs text-zinc-500">
                Customer: <strong>{order.customerName}</strong>
              </p>
              {order.deliveryNote && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs">
                  Instructions: "{order.deliveryNote}"
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`tel:${order.customerPhone}`}
                className="flex-1 inline-flex items-center justify-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50"
              >
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>Call Student ({order.customerPhone})</span>
              </a>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setActiveStep(4)}
              className="w-full rounded-xl font-bold py-3 text-sm bg-blue-600 hover:bg-blue-700"
            >
              <QrCode className="h-4 w-4 mr-2" />
              <span>Arrived at Dorm Gate — Verify Handover</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Verify Handover Code with Student */}
      {activeStep === 4 && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Verify Handover with Student
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ask the student to show their delivery code, then enter the matching code below.
            </p>
          </div>

          <HandoverCodeForm
            onVerify={handleVerifyDelivery}
            actionLabel="Complete Handover"
            codeLength={6}
          />

          <div className="text-center">
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="text-xs text-zinc-400 hover:underline"
            >
              ← Back to Dorm Directions
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Delivery Completed Celebration */}
      {activeStep === 5 && (
        <Card className="border-emerald-600">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              Delivery Completed
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Order #{order?.id} verified. Estimated delivery fee:{" "}
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                {formatCurrency(riderEarnings)}
              </strong>
              . This sandbox app does not transfer funds or maintain a wallet balance.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/rider/available-orders">
                <Button variant="primary" size="md" className="rounded-xl font-bold w-full sm:w-auto">
                  Find Next Delivery Offer
                </Button>
              </Link>
              <Link href="/rider/earnings">
                <Button variant="outline" size="md" className="rounded-xl w-full sm:w-auto">
                  Earnings information
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
