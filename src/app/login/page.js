"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ROLES } from "@/lib/constants";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DemoRoleBanner } from "@/components/shared/demo-role-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Lock, Mail, GraduationCap, Store, Bike, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);
    if (!result?.success) {
      setError(result?.error || "Invalid campus credentials. Please check your email.");
    }
  };

  const handleQuickRoleLogin = (roleToLogin) => {
    login(roleToLogin);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <DemoRoleBanner />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo & Headline */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Sign In to CampusEats
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Access your campus food orders, shop queue, or delivery dashboard
            </p>
          </div>

          {/* Quick Demo Login Presets */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Instant Demo Role Sign-In</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin(ROLES.STUDENT)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs transition-all"
              >
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleLogin(ROLES.SHOP_OWNER)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs transition-all"
              >
                <Store className="h-4 w-4 text-amber-600" />
                <span>Shop Owner</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleLogin(ROLES.RIDER)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs transition-all"
              >
                <Bike className="h-4 w-4 text-blue-600" />
                <span>Rider</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleLogin(ROLES.ADMIN)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Standard Form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
                    {error}
                  </div>
                )}

                <Input
                  label="Campus Email or Username"
                  type="email"
                  placeholder="name@du.ac.bd"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end mt-1.5">
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full font-semibold rounded-xl"
                >
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* New account footer link */}
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            Don't have a CampusEats account?{" "}
            <Link
              href="/register"
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Choose role and register
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
