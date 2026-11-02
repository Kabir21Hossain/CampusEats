"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Function Tabs.
 * @param {*} activeTab - Input value used by the operation.
 * @param {*} onChange - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1 bg-zinc-100/90 dark:bg-zinc-800/80 rounded-xl overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap",
              isActive
                ? "bg-white dark:bg-zinc-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 text-[10px] rounded-full",
                  isActive
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
