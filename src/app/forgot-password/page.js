"use client";

import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DemoRoleBanner } from "@/components/shared/demo-role-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";

/**
 * Function ForgotPasswordPage.
 * @returns {*} The operation result.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <DemoRoleBanner />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Password Recovery
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Password recovery is not configured on the backend yet.
            </p>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Mail className="h-6 w-6" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                The backend does not currently provide a password-reset route or
                recovery email flow. No recovery email has been sent.
              </p>
              <Link href="/signin" className="block">
                <Button variant="outline" size="md" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              href="/signin"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-emerald-700 dark:text-zinc-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
