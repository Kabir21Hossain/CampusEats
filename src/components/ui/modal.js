"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * Function Modal.
 * @param {*} onClose - Input value used by the operation.
 * @param {*} title - Input value used by the operation.
 * @param {*} description - Input value used by the operation.
 * @param {*} children - Input value used by the operation.
 * @param {*} maxWidth - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function Modal({ isOpen, onClose, title, description, children, maxWidth = "max-w-md", className }) {
  useEffect(() => {
    /**
     * Arrow function handleKeyDown.
     * @param {*} e - Input value used by the operation.
     * @returns {*} The operation result.
     */
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          "relative w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-200",
          maxWidth,
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-4">
          <div>
            {title && (
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
