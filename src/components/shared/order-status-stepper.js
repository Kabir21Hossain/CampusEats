"use client";

import React from "react";
import { ORDER_STATUS } from "@/lib/constants";
import { Check, Clock, ChefHat, Bike, PackageCheck, AlertCircle } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

export function OrderStatusStepper({ status, timestamps = {}, rejectionReason = "" }) {
  const steps = [
    {
      id: ORDER_STATUS.PLACED,
      label: "Order Placed",
      icon: Clock,
      time: timestamps.placedAt,
    },
    {
      id: ORDER_STATUS.CONFIRMED,
      label: "Accepted",
      icon: ChefHat,
      time: timestamps.confirmedAt,
    },
    {
      id: ORDER_STATUS.PREPARING,
      label: "Preparing",
      icon: ChefHat,
      time: timestamps.preparingAt,
    },
    {
      id: ORDER_STATUS.AWAITING_RIDER,
      label: "Ready for Pickup",
      icon: PackageCheck,
      time: timestamps.readyForPickupAt,
    },
    {
      id: ORDER_STATUS.CLAIMED,
      label: "Rider Claimed",
      icon: Bike,
      time: timestamps.claimedAt,
    },
    {
      id: ORDER_STATUS.PICKED_UP,
      label: "Out for Delivery",
      icon: Bike,
      time: timestamps.pickedUpAt,
    },
    {
      id: ORDER_STATUS.DELIVERED,
      label: "Delivered",
      icon: PackageCheck,
      time: timestamps.deliveredAt,
    },
  ];

  const getStatusIndex = (currentStatus) => {
    switch (currentStatus) {
      case ORDER_STATUS.PLACED:
        return 0;
      case ORDER_STATUS.CONFIRMED:
        return 1;
      case ORDER_STATUS.PREPARING:
        return 2;
      case ORDER_STATUS.AWAITING_RIDER:
        return 3;
      case ORDER_STATUS.CLAIMED:
        return 4;
      case ORDER_STATUS.PICKED_UP:
        return 5;
      case ORDER_STATUS.DELIVERED:
        return 6;
      default:
        return -1;
    }
  };

  const currentIndex = getStatusIndex(status);
  const isRejected = status === ORDER_STATUS.REJECTED;
  const isCancelled = status === ORDER_STATUS.CANCELLED || isRejected;

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300">
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
        <div>
          <p className="font-semibold text-sm">
            {isRejected ? "Order Declined" : "Order Cancelled"}
          </p>
          <p className="text-xs text-rose-600/90 dark:text-rose-400">
            {rejectionReason || "This order is no longer active."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Progress connecting line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-emerald-600 transition-all duration-500 -z-0"
          style={{
            width: `${Math.max(0, Math.min(100, (currentIndex / (steps.length - 1)) * 100))}%`,
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center text-center relative z-10 px-1"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ring-4 ring-white dark:ring-zinc-900",
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                    ? "bg-emerald-700 text-white ring-emerald-100 dark:ring-emerald-950/80 animate-pulse"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              <span
                className={cn(
                  "text-[11px] font-medium mt-2 max-w-[70px] sm:max-w-none",
                  isCurrent
                    ? "text-emerald-700 dark:text-emerald-400 font-bold"
                    : isCompleted
                    ? "text-zinc-800 dark:text-zinc-200"
                    : "text-zinc-400 dark:text-zinc-600"
                )}
              >
                {step.label}
              </span>

              {step.time && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                  {formatTime(step.time)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
