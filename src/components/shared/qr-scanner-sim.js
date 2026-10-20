"use client";

import React, { useState } from "react";
import { Camera, CheckCircle2, AlertCircle, Scan, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QRScannerSim({ onVerify, expectedCode, actionLabel = "Confirm Handover" }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter the 4-digit code");
      return;
    }

    if (expectedCode && code.trim() !== expectedCode.trim()) {
      setError(`Code mismatch! Expected code: ${expectedCode}`);
      return;
    }

    onVerify(code.trim());
  };

  const handleSimulateScan = () => {
    if (expectedCode) {
      setCode(expectedCode);
      onVerify(expectedCode);
    } else {
      setCode("7412");
      onVerify("7412");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900 text-white max-w-sm mx-auto shadow-xl border border-zinc-800">
      {/* Viewfinder simulation */}
      <div className="relative h-48 w-full rounded-xl bg-black overflow-hidden flex items-center justify-center border border-zinc-800">
        <div className="absolute inset-4 border-2 border-emerald-500/60 rounded-lg pointer-events-none" />
        
        {/* Animated laser line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce" />

        <div className="flex flex-col items-center gap-2 text-zinc-400 z-10">
          <Scan className="h-8 w-8 text-emerald-400 animate-pulse" />
          <span className="text-xs font-mono">Camera Viewfinder Active</span>
        </div>

        {/* Quick auto-scan helper */}
        <button
          type="button"
          onClick={handleSimulateScan}
          className="absolute bottom-2 px-3 py-1 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white text-[11px] font-semibold backdrop-blur-md transition-all shadow-md z-20"
        >
          Simulate Camera Scan ({expectedCode || "Auto-fill"})
        </button>
      </div>

      {/* Manual code input fallback */}
      <div className="w-full mt-4">
        <label className="text-xs text-zinc-400 font-medium block mb-1">
          Or Enter 4-Digit Handover Code:
        </label>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            placeholder="e.g. 7412"
            className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-center font-mono text-base font-bold text-emerald-400 tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Verify
          </Button>
        </form>

        {error && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
