"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { ROLES, CAMPUS_LOCATIONS, CUISINE_CATEGORIES } from "@/lib/constants";
import {
  Bike,
  Building,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";

const roleOptions = [
  { id: ROLES.STUDENT, label: "Student", icon: GraduationCap },
  { id: ROLES.SHOP_OWNER, label: "Shop Owner", icon: Store },
  { id: ROLES.RIDER, label: "Rider", icon: Bike },
  { id: ROLES.ADMIN, label: "Admin", icon: ShieldCheck },
];

const initialForm = {
  name: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  adminInvitationCode: "",
  phone: "",
  studentId: "",
  hall: CAMPUS_LOCATIONS[0],
  roomNumber: "",
  shopName: "",
  location: "",
  shopCategory: CUISINE_CATEGORIES[1],
  vehicleType: "Bicycle",
  licenseNumber: "",
  deliveryZones: "",
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerUser } = useAuth();
  const initialRole = searchParams.get("role");
  const [role, setRole] = useState(
    roleOptions.some((option) => option.id === initialRole)
      ? initialRole
      : ""
  );
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!role) {
      setError("Choose an account type before completing the form.");
      return;
    }

    if (!form.email.trim().toLowerCase().endsWith("@du.ac.bd")) {
      setError("Use your campus email address ending in @du.ac.bd.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const registrationData = {
      role,
      name: form.name,
      email: form.email,
      username: form.username,
      password: form.password,
      phone: form.phone,
    };

    if (role === ROLES.STUDENT) {
      registrationData.studentId = form.studentId;
      registrationData.dormitoryAddress = `${form.hall}, ${form.roomNumber}`;
    } else if (role === ROLES.SHOP_OWNER) {
      registrationData.shopName = form.shopName;
      registrationData.location = form.location;
      registrationData.shopCategory = form.shopCategory;
    } else if (role === ROLES.RIDER) {
      registrationData.vehicleType = form.vehicleType;
      registrationData.licenseNumber = form.licenseNumber;
      registrationData.deliveryZones = form.deliveryZones;
    } else if (role === ROLES.ADMIN) {
      registrationData.adminInvitationCode = form.adminInvitationCode;
    }

    setLoading(true);
    const result = await registerUser(registrationData);
    setLoading(false);

    if (result.success) {
      router.replace("/signin");
    } else {
      setError(result.error || "Unable to create your account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-6">
          <header className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Create your CampusEats account
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Choose your account type to see the relevant registration fields.
            </p>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {roleOptions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setRole(id);
                  setError("");
                }}
                aria-pressed={role === id}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  role === id
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                <Icon className="h-5 w-5 mb-2" />
                <span className="block text-xs font-semibold">{label}</span>
                {id === ROLES.ADMIN && (
                  <span className="block mt-1 text-[10px]">Invitation required</span>
                )}
              </button>
            ))}
          </div>

          {role ? (
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      icon={User}
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      required
                    />
                    <Input
                      label="Campus Email"
                      type="email"
                      placeholder="name@du.ac.bd"
                      icon={Mail}
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      required
                    />
                    <Input
                      label="Username (optional)"
                      value={form.username}
                      onChange={(event) => updateField("username", event.target.value)}
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      icon={Phone}
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      required
                    />
                    <Input
                      label="Password"
                      type="password"
                      icon={Lock}
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      icon={Lock}
                      value={form.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                      required
                    />
                  </div>

                  {role === ROLES.STUDENT && (
                    <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                      <Input
                        label="Student ID"
                        icon={GraduationCap}
                        value={form.studentId}
                        onChange={(event) => updateField("studentId", event.target.value)}
                        required
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="space-y-1.5 text-left">
                          <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Hall / Dormitory
                          </span>
                          <select
                            value={form.hall}
                            onChange={(event) => updateField("hall", event.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm"
                          >
                            {CAMPUS_LOCATIONS.map((location) => (
                              <option key={location} value={location}>{location}</option>
                            ))}
                          </select>
                        </label>
                        <Input
                          label="Room Number"
                          icon={Building}
                          value={form.roomNumber}
                          onChange={(event) => updateField("roomNumber", event.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {role === ROLES.SHOP_OWNER && (
                    <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                      <Input
                        label="Shop Name"
                        icon={Store}
                        value={form.shopName}
                        onChange={(event) => updateField("shopName", event.target.value)}
                        required
                      />
                      <Input
                        label="Shop Location / Stall Number"
                        icon={MapPin}
                        value={form.location}
                        onChange={(event) => updateField("location", event.target.value)}
                        required
                      />
                      <label className="space-y-1.5 text-left">
                        <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Shop Category
                        </span>
                        <select
                          value={form.shopCategory}
                          onChange={(event) => updateField("shopCategory", event.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm"
                        >
                          {CUISINE_CATEGORIES.filter((category) => category !== "All").map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  {role === ROLES.RIDER && (
                    <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                      <label className="space-y-1.5 text-left">
                        <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Vehicle Type
                        </span>
                        <select
                          value={form.vehicleType}
                          onChange={(event) => updateField("vehicleType", event.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm"
                        >
                          <option value="Bicycle">Bicycle</option>
                          <option value="Motorcycle">Motorcycle</option>
                        </select>
                      </label>
                      {form.vehicleType === "Motorcycle" && (
                        <Input
                          label="License Number"
                          value={form.licenseNumber}
                          onChange={(event) => updateField("licenseNumber", event.target.value)}
                          required
                        />
                      )}
                      <Input
                        label="Preferred Delivery Zones"
                        placeholder="e.g. Shahidullah Hall, TSC"
                        value={form.deliveryZones}
                        onChange={(event) => updateField("deliveryZones", event.target.value)}
                        required
                      />
                    </div>
                  )}

                  {role === ROLES.ADMIN && (
                    <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                      <Input
                        label="Admin Code / Invitation Key"
                        type="password"
                        icon={ShieldCheck}
                        value={form.adminInvitationCode}
                        onChange={(event) => updateField("adminInvitationCode", event.target.value)}
                        required
                      />
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Administrator registration is restricted to valid university-issued invitation keys.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={loading}
                    className="w-full rounded-xl font-semibold"
                  >
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Select an account type to begin registration.
            </p>
          )}

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              Sign In
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
