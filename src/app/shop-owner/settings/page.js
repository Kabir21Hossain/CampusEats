"use client";

import React, { useState, useEffect } from "react";
import { shopService } from "@/services/shop-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, MapPin, Clock, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function ShopOwnerSettingsPage() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    shopService.getShopById("shop-1").then((res) => {
      if (res.success) setShop(res.data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await shopService.updateShop("shop-1", shop);
    setSaving(false);
    if (res.success) {
      toast.success("Shop information updated successfully!");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Canteen Settings &amp; Profile
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage your campus stall hours, location details, and storefront presentation
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

              <Input
                label="Operating Hours"
                icon={Clock}
                value={shop?.operatingHours || ""}
                onChange={(e) => setShop({ ...shop, operatingHours: e.target.value })}
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
    </div>
  );
}
