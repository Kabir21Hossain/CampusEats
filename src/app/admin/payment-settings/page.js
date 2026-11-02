"use client";

import { useEffect, useState } from "react";
import { Landmark, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/admin-service";
import { PersonalBkashSettings } from "@/components/profile/personal-bkash-settings";

/**
 * Function AdminPaymentSettingsPage.
 * @returns {*} The operation result.
 */
export default function AdminPaymentSettingsPage() {
  const [bkashPlatformNumber, setBkashPlatformNumber] = useState("");
  const [configured, setConfigured] = useState(false);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminService.getPaymentSettings().then((response) => {
      if (!active) return;
      if (response.success) {
        setBkashPlatformNumber(response.data.bkashPlatformNumber || "");
        setConfigured(response.data.configured);
        setSource(response.data.source);
      } else {
        setError(response.error.message);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  /**
   * Arrow function handleSubmit.
   * @param {*} event - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await adminService.updatePaymentSettings(bkashPlatformNumber);
    setSaving(false);
    if (response.success) {
      setBkashPlatformNumber(response.data.bkashPlatformNumber);
      setConfigured(true);
      setSource(response.data.source);
      toast.success("Platform bKash payment number saved.");
    } else {
      setError(response.error.message);
      toast.error(response.error.message);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading payment settings...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Platform Payment Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure the bKash destination for delivery and platform fees. The number is only available to administrators and is included in a student's order payment details.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              configured
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
            }`}
            role="status"
          >
            {configured
              ? `Platform recipient is configured${source ? ` (${source === "environment" ? "backend environment" : "admin settings"})` : ""}.`
              : "Platform recipient is missing. Students cannot check out until it is configured."}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Platform bKash number"
              icon={Landmark}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              value={bkashPlatformNumber}
              onChange={(event) => setBkashPlatformNumber(event.target.value)}
              required
              helperText="Enter the Bangladesh bKash account number that receives delivery and platform fees."
            />
            {error && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" isLoading={saving}>
                <Save className="h-4 w-4" />
                Save platform number
              </Button>
            </div>
          </form>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            You may alternatively configure <code>BKASH_PLATFORM_NUMBER</code> in the backend environment. A number saved here takes precedence.
          </p>
        </CardContent>
      </Card>
      <PersonalBkashSettings />
    </div>
  );
}
