"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { profileService } from "@/services/index";

/**
 * Function PersonalBkashSettings.
 * @returns {*} The operation result.
 */
export function PersonalBkashSettings() {
  const [bkashNumber, setBkashNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    profileService.getMyProfile().then((response) => {
      if (!active) return;
      if (response.success) {
        setBkashNumber(response.data.bkashNumber || "");
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
    const response = await profileService.updateMyProfile({ bkashNumber });
    setSaving(false);
    if (response.success) {
      setBkashNumber(response.data.bkashNumber || "");
      toast.success(response.data.bkashNumber ? "Your bKash number was saved." : "Your bKash number was removed.");
    } else {
      setError(response.error.message);
      toast.error(response.error.message);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Personal bKash number
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Save your own number for your account. It is private and separate from the shop or platform numbers that receive payments.
          </p>
        </div>
        {loading ? (
          <p className="text-xs text-zinc-500">Loading payment settings...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your bKash number"
              icon={Smartphone}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              value={bkashNumber}
              onChange={(event) => setBkashNumber(event.target.value)}
              helperText="Bangladesh mobile number format. Leave blank to remove the saved number."
            />
            {error && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" isLoading={saving}>
                <Smartphone className="h-4 w-4" />
                Save personal number
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
