"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { CAMPUS_LOCATIONS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Building,
  MapPin,
  Bell,
  ShieldCheck,
  LogOut,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentProfilePage() {
  const { currentUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: currentUser?.name || "Tanvir Ahmed",
    studentId: currentUser?.studentId || "DU-CSE-2022-045",
    email: currentUser?.email || "tanvir.student@du.ac.bd",
    phone: currentUser?.phone || "+880 1712-345678",
    dormitoryAddress: currentUser?.dormitoryAddress || "Shahidullah Hall, Room 304, 3rd Floor",
  });

  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile information updated successfully!");
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Student Profile &amp; Preferences
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage your verified campus credentials and dormitory delivery location
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <img
              src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
              alt="Avatar"
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-emerald-500/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formData.name}
                </h3>
                <Badge variant="default" size="sm">
                  Verified Student
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {formData.studentId}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                Dhaka University Campus Resident
              </p>
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
                label="Campus Email"
                icon={Mail}
                value={formData.email}
                disabled
              />

              <Input
                label="Phone Number"
                icon={Phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <Input
              label="Default Dormitory & Room Address"
              icon={Building}
              value={formData.dormitoryAddress}
              onChange={(e) => setFormData({ ...formData, dormitoryAddress: e.target.value })}
              required
            />

            <div className="pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={logout}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Sign Out
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={saving}
                className="rounded-xl font-semibold"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
