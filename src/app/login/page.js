"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isPending } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!isPending && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isPending, router]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
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
                  label="Campus Email"
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
              href="/signup"
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
