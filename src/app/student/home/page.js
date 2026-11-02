"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { shopService } from "@/services/shop-service";
import { CUISINE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShopCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Star,
  Clock,
  MapPin,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

/**
 * Function StudentHomePage.
 * @returns {*} The operation result.
 */
export default function StudentHomePage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Arrow function loadShops.
   * @returns {*} The operation result.
   */
  const loadShops = () => {
    setLoading(true);
    shopService
      .listShops({ category: selectedCategory, query: searchQuery })
      .then((res) => {
        if (res.success) setShops(res.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadShops();
  }, [selectedCategory]);

  /**
   * Arrow function handleSearch.
   * @param {*} e - Input value used by the operation.
   * @returns {*} The operation result.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    loadShops();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Student Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-600/60 text-emerald-200 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Campus Dorm Delivery • Flat ৳30 Fee</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            What are you craving today, Tanvir?
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Order from verified campus canteens and get food delivered straight to your hall room door.
          </p>

          {/* Quick Search */}
          <form onSubmit={handleSearch} className="pt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, biryani, burgers, canteens..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs"
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="rounded-xl px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Explore Cuisines
          </h3>
          <Link href="/student/search" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
            Advanced Filters →
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {CUISINE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 select-none shadow-2xs ${
                  isSelected
                    ? "bg-emerald-700 text-white shadow-xs scale-[1.02]"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campus Canteens Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {selectedCategory === "All" ? "All Approved Campus Shops" : `${selectedCategory} in Campus`}
          </h2>
          <span className="text-xs text-zinc-400 font-medium">
            {shops.length} outlets available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ShopCardSkeleton />
            <ShopCardSkeleton />
            <ShopCardSkeleton />
          </div>
        ) : shops.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No canteens found"
            description="We couldn't find any campus food shops matching your category or query."
            actionText="Reset Filters"
            onAction={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Link key={shop.id} href={`/student/shops/${shop.id}`} className="group">
                <Card hoverEffect className="h-full flex flex-col justify-between">
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={shop.bannerUrl}
                      alt={shop.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="default" size="sm" className="bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 backdrop-blur-md font-semibold">
                        {shop.cuisine}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-md text-white text-[11px] px-2.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3 text-emerald-400" />
                      <span>{shop.deliveryTimeMinutes} mins</span>
                    </div>
                    {!shop.isOpen && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider">
                          Currently Closed
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {shop.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{shop.rating}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            ({shop.reviewCount})
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {shop.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 truncate max-w-[190px]">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{shop.campusLocation}</span>
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                        Min. {formatCurrency(shop.minimumOrder)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
