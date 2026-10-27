"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import { PersonalBkashSettings } from "@/components/profile/personal-bkash-settings";

export default function StudentProfilePage() {
  const { currentUser, isPending, logout } = useAuth();

  if (isPending) {
    return <div className="p-12 text-center text-sm text-zinc-400">Loading profile...</div>;
  }

  const profileFields = [
    ["Full name", currentUser?.name],
    ["Student ID", currentUser?.studentId],
    ["Campus email", currentUser?.email],
    ["Phone", currentUser?.phone],
    ["Department", currentUser?.department],
    ["Hall", currentUser?.hall],
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Student Profile
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Account details returned by the authenticated backend session.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {currentUser?.name || "Student"}
              </h2>
              <p className="text-sm text-zinc-500">{currentUser?.email || "No email"}</p>
            </div>
            <Badge variant="default">{currentUser?.role || "student"}</Badge>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            {profileFields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-zinc-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {value || "Not provided"}
                </dd>
              </div>
            ))}
          </dl>

          <Button type="button" variant="ghost" onClick={logout} className="text-rose-600">
            <LogOut className="mr-1.5 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
      <PersonalBkashSettings />
    </div>
  );
}
