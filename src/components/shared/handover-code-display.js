"use client";

import React from "react";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function HandoverCodeDisplay({
  code,
  title = "Handover Verification Code",
  subtitle = "Share this code with the assigned delivery partner",
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!code) return;
    if (!navigator.clipboard) {
      toast.error("Clipboard access is unavailable in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the verification code.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/80 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-3 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
        <ShieldCheck className="h-4 w-4" />
        <span>Server-verified handover</span>
      </div>

      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-4">{subtitle}</p>

      <div className="mt-4 flex items-center gap-2">
        <div className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-mono text-lg font-bold tracking-widest text-emerald-800 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-700">
          {code || "Unavailable"}
        </div>
        <button
          type="button"
          onClick={copyCode}
          disabled={!code}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          aria-label="Copy verification code"
          title={code ? "Copy code" : "Code unavailable"}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <p className="text-[11px] text-zinc-400 mt-2">
        The code is verified by the server to confirm this handover.
      </p>
    </div>
  );
}
