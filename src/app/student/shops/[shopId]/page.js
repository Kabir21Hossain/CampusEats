"use client";

import React, { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { shopService } from "@/services/shop-service";
import { menuService } from "@/services/menu-service";
import { useCart } from "@/context/cart-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Star,
  Clock,
  MapPin,
  UtensilsCrossed,
  Plus,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function ShopDetailContent({ params }) {
  const unwrappedParams = use(params);
  const shopId = unwrappedParams.shopId;

  const [shop, setShop] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { addItem, items, itemCount, subtotal } = useCart();

  useEffect(() => {
    Promise.all([
      shopService.getShopById(shopId),
      menuService.listMenuItems(shopId),
    ]).then(([shopRes, menuRes]) => {
      if (shopRes.success) setShop(shopRes.data);
      if (menuRes.success) setMenuItems(menuRes.data);
      setLoading(false);
    });
  }, [shopId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-zinc-500">
        Loading canteen menu...
      </div>
    );
  }

  if (!shop) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Shop not found"
        description="The campus food outlet you are looking for does not exist or has been delisted."
        actionText="Back to Canteens"
        onAction={() => window.history.back()}
      />
    );
  }

  // Categories in this shop
  const categories = ["All", ...new Set(menuItems.map((i) => i.category))];
  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-8 pb-20 relative">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campus Canteens</span>
        </Link>
      </div>

      {/* Shop Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md">
        <div className="relative h-56 sm:h-72 w-full">
          <img
            src={shop.bannerUrl}
            alt={shop.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          {/* Floating Open/Closed Status */}
          <div className="absolute top-4 right-4">
            <Badge
              variant={shop.isOpen ? "default" : "rose"}
              size="md"
              className={
                shop.isOpen
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-rose-600 text-white font-bold"
              }
            >
              {shop.isOpen ? "● Open for Orders" : "Closed"}
            </Badge>
          </div>

          {/* Shop Info Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30 backdrop-blur-md">
                  {shop.cuisine}
                </Badge>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{shop.rating}</span>
                  <span className="text-white/70 font-normal">({shop.reviewCount} reviews)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {shop.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2">
                {shop.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{shop.campusLocation}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{shop.operatingHours}</span>
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[11px] text-zinc-300">Min. Order</div>
              <div className="text-lg font-bold text-emerald-300">
                {formatCurrency(shop.minimumOrder)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No items in this category"
            description="Try selecting another category to see delicious options."
            actionText="View All Items"
            onAction={() => setSelectedCategory("All")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} hoverEffect className="flex flex-col justify-between">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex gap-1 flex-wrap">
                    {item.dietary?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        size="sm"
                        className="bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 backdrop-blur-md text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-400" />
                    <span>{item.preparationTimeMinutes} mins</span>
                  </div>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(item.priceBDT)}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addItem(item, shop)}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar (if items in cart) */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 animate-in slide-in-from-bottom-5">
          <Link
            href="/student/cart"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-800 text-white shadow-2xl hover:bg-emerald-900 transition-all border border-emerald-700"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold leading-none">
                  {itemCount} {itemCount === 1 ? "Item" : "Items"} in Cart
                </p>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  Subtotal: {formatCurrency(subtotal)}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white text-emerald-900 px-3.5 py-1.5 rounded-xl shadow-xs">
              View Cart →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ShopDetailPage({ params }) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-zinc-500">Loading canteen menu...</div>}>
      <ShopDetailContent params={params} />
    </Suspense>
  );
}
