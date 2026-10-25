"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/services/api-client";
import { Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";

export default function AdminRecoveryPage() {
  const [recoveryToken, setRecoveryToken] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const token = window.location.hash.slice(1);
    if (token) {
      setRecoveryToken(token);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!recoveryToken) {
      setError("Open the one-time administrator setup link to continue.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await apiRequest("/auth/admin-recovery", {
      method: "POST",
      body: JSON.stringify({ recoveryToken, email, name, phone, password }),
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setComplete(true);
    setRecoveryToken("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <header className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Administrator Account Setup
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Use this private, one-time link to create the administrator account.
            </p>
          </header>

          <Card>
            <CardContent className="p-6">
              {complete ? (
                <div className="space-y-4 text-center">
                  <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
                    Administrator account created. Sign in using the email and password you just set.
                  </p>
                  <Link href="/signin" className="block">
                    <Button className="w-full">Go to Sign In</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
                    >
                      {error}
                    </div>
                  )}
                  <Input
                    label="Authorized Email"
                    type="email"
                    autoComplete="email"
                    icon={Mail}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  <Input
                    label="Full Name"
                    autoComplete="name"
                    icon={User}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    autoComplete="tel"
                    icon={Phone}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                  <Input
                    label="Password (at least 8 characters)"
                    type="password"
                    autoComplete="new-password"
                    icon={Lock}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    autoComplete="new-password"
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    isLoading={loading}
                  >
                    Create Admin Account
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
