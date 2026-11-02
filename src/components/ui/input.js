"use client";

import React, { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

/**
 * Function Input.
 * @param {*} error - Input value used by the operation.
 * @param {*} helperText - Input value used by the operation.
 * @param {*} type - Input value used by the operation.
 * @param {*} className - Input value used by the operation.
 * @param {*} wrapperClassName - Input value used by the operation.
 * @param {*} id - Input value used by the operation.
 * @param {*} required - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  type = "text",
  className,
  wrapperClassName,
  id,
  required,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("flex flex-col gap-1.5 w-full text-left", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          id={inputId}
          type={actualType}
          required={required}
          className={cn(
            "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50",
            Icon && "pl-9",
            isPassword && "pr-10",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20",
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      ) : null}
    </div>
  );
}
