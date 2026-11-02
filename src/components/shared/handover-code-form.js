"use client";

import React, { useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Function HandoverCodeForm.
 * @param {*} actionLabel - Input value used by the operation.
 * @param {*} codeLength - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function HandoverCodeForm({
  onVerify,
  actionLabel = "Confirm Handover",
  codeLength = 6,
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Arrow function handleSubmit.
   * @param {*} e - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (code.trim().length !== codeLength) {
      setError(`Enter the complete ${codeLength}-character handover code.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onVerify(code.trim().toUpperCase());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center p-4 sm:p-6 rounded-2xl bg-zinc-900 text-white max-w-sm mx-auto shadow-xl border border-zinc-800">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
        <ShieldCheck className="h-5 w-5" />
        <span>Secure handover verification</span>
      </div>

      <div className="w-full mt-5">
        <label htmlFor="handover-code" className="text-xs text-zinc-300 font-medium block mb-1">
          Enter the code shown by the customer or shop:
        </label>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
          <input
            id="handover-code"
            type="text"
            maxLength={codeLength}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            disabled={isSubmitting}
            placeholder={`${codeLength}-character code`}
            autoComplete="off"
            autoCapitalize="characters"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "handover-code-error" : undefined}
            className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-center font-mono text-base font-bold text-emerald-400 tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            size="md"
            className="w-full shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white sm:w-auto"
          >
            {isSubmitting ? "Verifying..." : actionLabel}
          </Button>
        </form>

        {error && (
          <div id="handover-code-error" role="alert" className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
