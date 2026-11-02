"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DemoRoleBanner } from "@/components/shared/demo-role-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldCheck, ArrowRight, FileCheck, HelpCircle } from "lucide-react";

/**
 * Function VerificationContent.
 * @returns {*} The operation result.
 */
function VerificationContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "shop";
  const name = searchParams.get("name") || "Your Application";
  const isRejected = searchParams.get("status") === "rejected";

  const isShop = type === "shop";
  const isRider = type === "rider";

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shadow-md ring-8 ring-amber-50/50 dark:ring-amber-950/20">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {isRejected ? "Application Not Approved" : "Application Under Review"}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          {isRejected
            ? <>The application for <strong>{name}</strong> was not approved. Please contact campus support if you believe this is an error.</>
            : <>We have received the application for <strong>{name}</strong> and campus administrators are reviewing the credentials.</>}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">Status</span>
            <Badge variant="amber" size="md">
              {isRejected ? "Not Approved" : "Pending Admin Verification"}
            </Badge>
          </div>

          <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
            <div className="flex items-start gap-2.5">
              <FileCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {isShop
                    ? "Shop & Menu Audit"
                    : isRider
                    ? "Rider Identity Verification"
                    : "Student Identity Verification"}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isShop
                    ? "Trade license, food safety inspection, and campus canteen location."
                    : isRider
                    ? "Rider identity, vehicle, and preferred delivery-zone review."
                    : "Jahangirnagar University enrollment and residential hall permission."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Escrow Wallet Provisioning
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Once approved, your account will be granted {isShop ? "85%" : "12%"} automated payout access.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <p className="text-[11px] text-zinc-400 text-center">
              Approvals are typically processed within 24–48 hours.
            </p>
            <div className="flex gap-2">
              <Link href="/admin/shops" className="flex-1">
                <Button variant="outline" size="md" className="w-full text-xs">
                  Review as Admin Demo
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="primary" size="md" className="w-full text-xs">
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Function VerificationStatusPage.
 * @returns {*} The operation result.
 */
export default function VerificationStatusPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <DemoRoleBanner />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="p-8 text-center text-xs">Loading verification status...</div>}>
          <VerificationContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
