import React from "react";
import { cn } from "@/lib/utils";

/**
 * Function Skeleton.
 * @returns {*} The operation result.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70 animate-pulse",
        className
      )}
      {...props}
    />
  );
}

/**
 * Function ShopCardSkeleton.
 * @returns {*} The operation result.
 */
export function ShopCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 p-4 space-y-3">
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="space-y-2 pt-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
