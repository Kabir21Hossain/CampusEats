"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { riderService } from "@/services/rider-service";
import { useAuth } from "@/context/auth-context";
import { usePolling } from "@/hooks/use-polling";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Bike,
  Store,
  MapPin,
  Clock,
  ArrowRight,
  Power,
  DollarSign,
  Package,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function RiderAvailableOrdersPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [feedError, setFeedError] = useState("");

  const loadFeed = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const [availRes, activeRes] = await Promise.all([
        riderService.getAvailableOrders(),
        riderService.getActiveDelivery(),
      ]);
      if (!availRes.success) {
        setFeedError(availRes.error?.message || "Unable to load delivery offers.");
        return;
      }
      if (!activeRes.success) {
        setFeedError(activeRes.error?.message || "Unable to load your active delivery.");
        return;
      }
      setOrders(availRes.data);
      setActiveDelivery(activeRes.data);
      setFeedError("");
    } catch (error) {
      setFeedError(error.message || "Unable to load delivery offers.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) loadFeed();
  }, [currentUser?.id, loadFeed]);

  usePolling(() => {
    if (isOnline) loadFeed({ showLoading: false });
  }, 10000);

  useEffect(() => {
    let isActive = true;
    if (currentUser) {
      setAvailabilityLoading(true);
      riderService.getAvailability().then((result) => {
        if (!isActive) return;
        if (result.success) {
          setIsOnline(result.data.isOnline);
        } else {
          setFeedError(result.error?.message || "Unable to load rider availability.");
        }
        setAvailabilityLoading(false);
      });
    }
    return () => {
      isActive = false;
    };
  }, [currentUser?.id]);

  const handleAvailabilityChange = async () => {
    if (availabilityLoading) return;
    setAvailabilityLoading(true);
    const result = await riderService.setAvailability(!isOnline);
    setAvailabilityLoading(false);
    if (!result.success) {
      toast.error(result.error?.message || "Unable to update availability.");
      return;
    }
    setIsOnline(result.data.isOnline);
    if (result.data.isOnline) loadFeed();
    toast.info(result.data.isOnline ? "You are now online for delivery requests." : "You are now offline.");
  };

  const handleClaim = async (orderId) => {
    setClaimingId(orderId);
    const res = await riderService.claimOrder(
      orderId
    );
    setClaimingId(null);
    if (res.success) {
      if (res.meta?.notificationWarning) toast.warning(res.meta.notificationWarning);
      toast.success("Order claimed! Heading to active delivery workflow.");
      router.push("/rider/active-delivery");
    } else {
      toast.error(res.error?.message || "Failed to claim order");
      loadFeed();
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Rider Status & Online Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold ${
              isOnline
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
            }`}
          >
            <Bike className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {currentUser?.name || "Sabbir Hossain"}
              </h2>
              <Badge
                variant={isOnline ? "default" : "neutral"}
                size="sm"
                className={isOnline ? "bg-emerald-600 text-white font-bold" : ""}
              >
                {isOnline ? "● Ready for Deliveries" : "Offline"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">
              Vehicle: Bicycle • Hall-to-Hall Delivery Network
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isOnline ? "outline" : "primary"}
            size="md"
            onClick={handleAvailabilityChange}
            disabled={availabilityLoading}
            className="rounded-xl text-xs font-semibold"
          >
            <Power className="h-3.5 w-3.5" />
            <span>{isOnline ? "Go Offline" : "Go Online"}</span>
          </Button>
        </div>
      </div>

      {/* Active Delivery Banner if in progress */}
      {activeDelivery && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                Active Delivery in Progress
              </p>
              <h4 className="text-base font-extrabold">
                Order #{activeDelivery.id} from {activeDelivery.shopName}
              </h4>
            </div>
          </div>

          <Link href="/rider/active-delivery">
            <Button
              variant="primary"
              size="md"
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-xl text-xs"
            >
              <span>Continue Delivery</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Available Delivery Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Available Delivery Offers
          </h3>
          <span className="text-xs text-zinc-400">
            {isOnline ? `${orders.length} offers ready for claim` : "Turn status Online to claim"}
          </span>
        </div>

        {!isOnline ? (
          <EmptyState
            icon={Power}
            title="You are currently offline"
            description="Go online to refresh the delivery feed and claim available campus orders."
            actionText="Go Online"
            onAction={handleAvailabilityChange}
          />
        ) : loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">Loading delivery feed...</div>
        ) : feedError ? (
          <EmptyState
            icon={Bike}
            title="Delivery feed unavailable"
            description={feedError}
            actionText="Retry"
            onAction={() => loadFeed()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Bike}
            title="No orders awaiting delivery"
            description="Orders appear here after the shop confirms they are ready for pickup. This feed refreshes automatically while you are online."
            actionText="Refresh Feed"
            onAction={loadFeed}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => {
              // Calculate estimated rider earning: approx 12% + min base ৳35
              const riderEarning = Math.max(35, Math.round(ord.total * 0.12));

              return (
                <Card key={ord.id} hoverEffect className="overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          #{ord.id}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-500">
                          {ord.items.reduce((s, i) => s + i.quantity, 0)} items
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Earn: {formatCurrency(riderEarning)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Pickup location */}
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300 text-[11px] uppercase tracking-wider">
                          <Store className="h-3.5 w-3.5 text-amber-600" />
                          <span>Pickup Outlet</span>
                        </div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                          {ord.shopName}
                        </p>
                        <p className="text-zinc-400">{ord.shopLocation}</p>
                      </div>

                      {/* Drop-off location */}
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300 text-[11px] uppercase tracking-wider">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Drop-Off Destination</span>
                        </div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                          {ord.deliveryAddressSnapshot}
                        </p>
                        <p className="text-zinc-400">Customer: {ord.customerName}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">
                        Payment: <strong>{ord.paymentMethod}</strong> (Escrow Protected)
                      </span>

                      <Button
                        variant="primary"
                        size="md"
                        isLoading={claimingId === ord.id}
                        disabled={!!activeDelivery}
                        onClick={() => handleClaim(ord.id)}
                        className="rounded-xl font-bold text-xs"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Claim Delivery</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
