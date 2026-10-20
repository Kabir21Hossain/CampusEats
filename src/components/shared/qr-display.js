"use client";

import React from "react";
import { QrCode, ShieldCheck, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function QRDisplay({ code, title = "Handover Verification Code", subtitle = "Present to rider/shop counter" }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/80 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-3 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
        <ShieldCheck className="h-4 w-4" />
        <span>Secure Handover Escrow</span>
      </div>

      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-4">{subtitle}</p>

      {/* Realistic QR pattern container */}
      <div className="p-3 bg-white rounded-xl border border-zinc-300 shadow-inner inline-block">
        <div className="h-36 w-36 bg-zinc-900 rounded-lg p-2 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Corner Marks */}
          <div className="flex justify-between">
            <div className="h-8 w-8 border-4 border-white rounded-sm flex items-center justify-center">
              <div className="h-3 w-3 bg-white rounded-xs" />
            </div>
            <div className="h-8 w-8 border-4 border-white rounded-sm flex items-center justify-center">
              <div className="h-3 w-3 bg-white rounded-xs" />
            </div>
          </div>
          {/* Center visual data pattern */}
          <div className="flex items-center justify-center text-white/90">
            <QrCode className="h-14 w-14" />
          </div>
          <div className="flex justify-between items-end">
            <div className="h-8 w-8 border-4 border-white rounded-sm flex items-center justify-center">
              <div className="h-3 w-3 bg-white rounded-xs" />
            </div>
            <div className="h-3 w-3 bg-white rounded-xs" />
          </div>
        </div>
      </div>

      {/* Numeric backup code */}
      <div className="mt-4 flex items-center gap-2">
        <div className="px-4 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-mono text-lg font-bold tracking-widest text-emerald-800 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-700">
          {code || "7412"}
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          title="Copy code"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <p className="text-[11px] text-zinc-400 mt-2">
        Verification releases payment to the recipient automatically.
      </p>
    </div>
  );
}
