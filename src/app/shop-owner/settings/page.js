"use client";

import React, { useState, useEffect } from "react";
import { shopService } from "@/services/shop-service";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, MapPin, Save, Image as ImageIcon, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { PersonalBkashSettings } from "@/components/profile/personal-bkash-settings";

export default function ShopOwnerSettingsPage() {
  const { currentUser } = useAuth();
  const [shop, setShop] = useState(null);
  const [bkashNumber, setBkashNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSettingsError, setPaymentSettingsError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      const response = await shopService.getShopByOwner(currentUser?.id);
      if (!active) return;
      if (!response.success) {
        setLoading(false);
        return;
      }
      setShop(response.data);
      const paymentResponse = await shopService.getPaymentSettings(response.data.id);
      if (!active) return;
      if (paymentResponse.success) {
        setBkashNumber(paymentResponse.data.bkashNumber || "");
      } else {
        setPaymentSettingsError(paymentResponse.error.message);
      }
      setLoading(false);
    }
    if (currentUser?.id) loadSettings();
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await shopService.updateShop(shop.id, {
      name: shop.name,
      campusLocation: shop.campusLocation,
      description: shop.description,
      bannerUrl: shop.bannerUrl,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Shop information updated successfully!");
    } else {
      toast.error(res.error.message);
    }
  };

  const handlePaymentSave = async (e) => {
    e.preventDefault();
    setPaymentSaving(true);
    setPaymentSettingsError("");
    const response = await shopService.updatePaymentSettings(shop.id, bkashNumber);
    setPaymentSaving(false);
    if (response.success) {
      setBkashNumber(response.data.bkashNumber);
      toast.success("Shop bKash payment number saved.");
    } else {
      setPaymentSettingsError(response.error.message);
      toast.error(response.error.message);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading settings...</div>;
  }
  if (!shop) {
    return <div className="p-12 text-center text-xs text-zinc-500">No shop is assigned to this account yet.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Canteen Settings &amp; Profile
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage your shop name, location, description, and storefront banner
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Banner preview */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Storefront Banner
            </span>
            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <img
                src={shop?.bannerUrl}
                alt="Banner preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Shop Name"
              icon={Store}
              value={shop?.name || ""}
              onChange={(e) => setShop({ ...shop, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Physical Location"
                icon={MapPin}
                value={shop?.campusLocation || ""}
                onChange={(e) => setShop({ ...shop, campusLocation: e.target.value })}
                required
              />

            </div>

            <Input
              label="Banner Image URL"
              icon={ImageIcon}
              value={shop?.bannerUrl || ""}
              onChange={(e) => setShop({ ...shop, bannerUrl: e.target.value })}
            />

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Canteen Description
              </label>
              <textarea
                rows={3}
                value={shop?.description || ""}
                onChange={(e) => setShop({ ...shop, description: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={saving} className="rounded-xl font-bold">
                <Save className="h-4 w-4 mr-1.5" />
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Shop bKash payments
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Students use this number to pay the food portion of their order. Checkout stays unavailable until it is set.
            </p>
          </div>
          <form onSubmit={handlePaymentSave} className="space-y-4">
            <Input
              label="Shop bKash number"
              icon={Smartphone}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              required
              helperText="Enter the Bangladesh bKash account number that receives shop payments."
            />
            {paymentSettingsError && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                {paymentSettingsError}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={paymentSaving}
                className="rounded-xl font-bold"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save payment number
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <PersonalBkashSettings />
    </div>
  );
}
