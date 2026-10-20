"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bike,
  User,
  GraduationCap,
  Phone,
  Star,
  CheckCircle2,
  Save,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

export default function RiderProfilePage() {
  const { currentUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: currentUser?.name || "Sabbir Hossain",
    studentId: currentUser?.studentId || "DU-PHY-2023-112",
    phone: currentUser?.phone || "+880 1911-223344",
    vehicleType: currentUser?.vehicleType || "Bicycle",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Rider profile details saved!");
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Rider Profile &amp; Verification
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Student rider identity, campus vehicle mode, and delivery credentials
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <img
              src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"}
              alt="Rider Avatar"
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-blue-500/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formData.name}
                </h3>
                <Badge variant="blue" size="sm">
                  Verified Rider
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {formData.studentId}
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>4.9 rating</span>
                </span>
                <span>•</span>
                <span>128 trips completed</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                icon={User}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Student ID"
                icon={GraduationCap}
                value={formData.studentId}
                disabled
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="bKash Wallet / Phone Number"
                icon={Phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Campus Vehicle
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs"
                >
                  <option value="Bicycle">Bicycle</option>
                  <option value="Walking / On Foot">Walking / On Foot</option>
                  <option value="Electric Scooter">Electric Scooter</option>
                  <option value="Motorbike">Motorbike</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={logout}
                className="text-xs text-rose-600 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Sign Out
              </Button>

              <Button type="submit" variant="primary" size="md" isLoading={saving} className="rounded-xl font-semibold">
                <Save className="h-4 w-4 mr-1.5" />
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
