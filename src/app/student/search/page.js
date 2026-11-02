"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { shopService } from "@/services/shop-service";
import { menuService } from "@/services/menu-service";
import { useCart } from "@/context/cart-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Filter,
  Star,
  Clock,
  Plus,
  UtensilsCrossed,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Function SearchContent.
 * @returns {*} The operation result.
 */
export function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [dietaryFilter, setDietaryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [maxPrice, setMaxPrice] = useState(350);

  const [menuItems, setMenuItems] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addItem } = useCart();

  useEffect(() => {
    Promise.all([menuService.listMenuItems(), shopService.listShops()]).then(
      ([menuRes, shopRes]) => {
        if (menuRes.success) setMenuItems(menuRes.data);
        if (shopRes.success) setShops(shopRes.data);
        setLoading(false);
      }
    );
  }, []);

  // Filter & Sort logic
  const filteredItems = menuItems.filter((item) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

    const matchesPrice = item.priceBDT <= maxPrice;

    const matchesDietary =
      dietaryFilter === "all" ||
      (item.dietary &&
        item.dietary.some((d) => d.toLowerCase() === dietaryFilter.toLowerCase()));

    return matchesQuery && matchesPrice && matchesDietary;
  });

  filteredItems.sort((a, b) => {
    if (sortBy === "price_asc") return a.priceBDT - b.priceBDT;
    if (sortBy === "price_desc") return b.priceBDT - a.priceBDT;
    if (sortBy === "time") return a.preparationTimeMinutes - b.preparationTimeMinutes;
    return 0; // default order
  });

  /**
   * Arrow function getShopForItem.
   * @param {*} shopId - Input value used by the operation.
   * @returns {*} The operation result.
   */
  const getShopForItem = (shopId) => {
    return shops.find((s) => s.id === shopId) || { id: shopId, name: "Campus Canteen" };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items, biryani, burgers, khichuri..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Dietary Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-400 font-medium">Dietary:</span>
          {["all", "Halal", "Vegetarian", "High Protein"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDietaryFilter(d)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dietaryFilter === d
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
              }`}
            >
              {d === "all" ? "All Diets" : d}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
          >
            <option value="rating">Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="time">Fastest Prep Time</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Showing {filteredItems.length} Food Results
        </h2>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Max Price: {formatCurrency(maxPrice)}</span>
          <input
            type="range"
            min={40}
            max={350}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-24 accent-emerald-600"
          />
        </div>
      </div>

      {/* Menu Results Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading food items...</div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No food matching filters"
          description="Try broadening your price range or clearing dietary filters."
          actionText="Reset All Filters"
          onAction={() => {
            setQuery("");
            setDietaryFilter("all");
            setMaxPrice(350);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const itemShop = getShopForItem(item.shopId);
            return (
              <Card key={item.id} hoverEffect className="flex flex-col justify-between">
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
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
                    <Link
                      href={`/shops/${item.shopId}`}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline block mb-1 truncate"
                    >
                      {itemShop.name}
                    </Link>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
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
                      onClick={() => addItem(item, itemShop)}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Function StudentSearchPage.
 * @returns {*} The operation result.
 */
export default function StudentSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
