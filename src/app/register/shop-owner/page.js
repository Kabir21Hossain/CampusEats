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
import { Store, User, Mail, Phone, MapPin, Clock, Upload, FileText, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { ROLES, CUISINE_CATEGORIES } from "@/lib/constants";

export default function ShopOwnerRegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    cuisine: CUISINE_CATEGORIES[1],
    operatingHours: "09:00 AM - 10:00 PM",
    description: "",
    uploadedDocs: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.shopName || !formData.ownerName || !formData.email || !formData.location || !formData.password) {
      setError("Please fill in all required shop, contact, and password fields.");
      return;
    }

    setLoading(true);
    const result = await registerUser({
      role: ROLES.SHOP_OWNER,
      name: formData.ownerName,
      shopName: formData.shopName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      location: formData.location,
      cuisine: formData.cuisine,
      description: formData.description,
    });
    setLoading(false);

    if (result.success) {
      toast.success("Shop application submitted for Admin review!");
      router.push(`/verification-status?type=shop&name=${encodeURIComponent(formData.shopName)}`);
    } else {
      setError(result.error || "Failed to submit shop owner registration.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <DemoRoleBanner />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Apply as Canteen / Food Shop Partner
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Partner with CampusEats to deliver directly into campus dormitories
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Shop / Canteen Name"
                    placeholder="e.g. Curzon Garden Bites"
                    icon={Store}
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    required
                  />

                  <Input
                    label="Owner / Manager Full Name"
                    placeholder="e.g. Rafiqul Islam"
                    icon={User}
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Email"
                    type="email"
                    placeholder="shop@campuseats.com"
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
                    label="Contact Phone"
                    placeholder="+880 1819-876543"
                    icon={Phone}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />

                  <Input
                    label="Operating Hours"
                    placeholder="e.g. 10:00 AM - 10:30 PM"
                    icon={Clock}
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Campus Physical Location"
                    placeholder="e.g. TSC 2nd Floor, Curzon Quad"
                    icon={MapPin}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Primary Food Category
                    </label>
                    <select
                      value={formData.cuisine}
                      onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                    >
                      {CUISINE_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Canteen / Menu Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell campus students about your specialties, meal combos, and hygiene standards..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                {/* Document verification file upload simulation */}
                <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-center space-y-2">
                  <Upload className="h-6 w-6 text-zinc-400 mx-auto" />
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Upload Campus Trade Permit / Health Certificate
                  </p>
                  <p className="text-[11px] text-zinc-400">PDF, JPG, PNG up to 10MB</p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, uploadedDocs: true });
                      toast.success("Document attached: Trade_License_2024.pdf");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>
                      {formData.uploadedDocs
                        ? "✓ Trade_License_2024.pdf (Attached)"
                        : "Browse and Attach Document"}
                    </span>
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="amber"
                  size="lg"
                  isLoading={loading}
                  className="w-full rounded-xl font-semibold"
                >
                  Submit Application for Admin Review
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
