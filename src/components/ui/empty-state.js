import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * Function EmptyState.
 * @param {*} title - Input value used by the operation.
 * @param {*} description - Input value used by the operation.
 * @param {*} actionText - Input value used by the operation.
 * @param {*} onAction - Input value used by the operation.
 * @param {*} className - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40",
        className
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <div className="mt-6">
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
