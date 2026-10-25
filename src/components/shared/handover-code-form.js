"use client";

import React, { useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HandoverCodeForm({ onVerify, actionLabel = "Confirm Handover" }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter the handover code.");
      return;
    }

    onVerify(code.trim().toUpperCase());
  };

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900 text-white max-w-sm mx-auto shadow-xl border border-zinc-800">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
        <ShieldCheck className="h-5 w-5" />
        <span>Secure handover verification</span>
      </div>

      <div className="w-full mt-5">
        <label htmlFor="handover-code" className="text-xs text-zinc-300 font-medium block mb-1">
          Enter the code shown by the customer or shop:
        </label>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            id="handover-code"
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            placeholder="Handover code"
            autoComplete="off"
            autoCapitalize="characters"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "handover-code-error" : undefined}
            className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-center font-mono text-base font-bold text-emerald-400 tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {actionLabel}
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
