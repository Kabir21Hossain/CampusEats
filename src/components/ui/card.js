import React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, hoverEffect = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs text-zinc-900 dark:text-zinc-100 overflow-hidden",
        hoverEffect &&
          "transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-emerald-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "text-base sm:text-lg font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-50",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn("flex items-center p-5 pt-0 border-t border-zinc-100 dark:border-zinc-800/60 mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
