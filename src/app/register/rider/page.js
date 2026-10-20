"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DemoRoleBanner } from "@/components/shared/demo-role-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bike, User, Mail, Phone, GraduationCap, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { ROLES } from "@/lib/constants";

export default function RiderRegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    email: "",
    password: "",
    phone: "",
    vehicleType: "Bicycle",
    emergencyContact: "",
    agreeTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.studentId || !formData.phone || !formData.email || !formData.password) {
      setError("Please complete all required fields including password.");
      return;
    }

    if (!formData.agreeTerms) {
      setError("You must accept the Student Rider Safety & Punctuality Agreement.");
      return;
    }

    setLoading(true);
    const result = await registerUser({
      role: ROLES.RIDER,
      name: formData.name,
      studentId: formData.studentId,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      vehicleType: formData.vehicleType,
      emergencyContact: formData.emergencyContact,
    });
    setLoading(false);

    if (result.success) {
      toast.success("Rider application submitted successfully!");
      router.push(`/verification-status?type=rider&name=${encodeURIComponent(formData.name)}`);
    } else {
      setError(result.error || "Failed to submit rider registration.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <DemoRoleBanner />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold">
              <Bike className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Student Rider Registration
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Deliver hot meals between classes and earn 12% on every completed trip
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Sabbir Hossain"
                    icon={User}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Student ID"
                    placeholder="e.g. DU-PHY-2023-112"
                    icon={GraduationCap}
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Campus Email"
                    type="email"
                    placeholder="rider@du.ac.bd"
                    icon={Mail}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />

                  <Input
                    label="Account Password"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone (bKash Wallet Number)"
                    placeholder="+880 1911-223344"
                    icon={Phone}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />

                  <Input
                    label="Emergency Contact Phone"
                    placeholder="+880 1711-000000"
                    icon={Phone}
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Primary Delivery Mode
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Bicycle">Bicycle (Recommended)</option>
                    <option value="Walking / On Foot">Walking / On Foot (Nearby Halls)</option>
                    <option value="Electric Scooter">Electric Scooter</option>
                    <option value="Motorbike">Motorbike</option>
                  </select>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="riderTerms"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 mt-0.5"
                  />
                  <label htmlFor="riderTerms" className="text-xs text-zinc-600 dark:text-zinc-400">
                    I agree to verify all orders via designated QR codes and comply with dormitory access safety guidelines.
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                >
                  Submit Rider Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
