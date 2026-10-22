"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DemoRoleBanner } from "@/components/shared/demo-role-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shopService } from "@/services/shop-service";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Sparkles,
  ShieldCheck,
  Bike,
  Clock,
  ArrowRight,
  Star,
  MapPin,
  Utensils,
  GraduationCap,
  Store,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopService.listShops().then((res) => {
      if (res.success) setShops(res.data);
      setLoading(false);
    });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/student/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/student/home");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee] transition-colors">
      <DemoRoleBanner />
      <Navbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-zinc-200/60 dark:border-zinc-800/60">
          {/* Subtle gradient backdrop */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10 opacity-40 dark:opacity-20">
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="absolute top-[20%] right-[10%] w-[450px] h-[450px] rounded-full bg-amber-200/30 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Heading & Search */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>University Dormitory Delivery Platform</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.12]">
                  Craving Campus Food? Delivered Right to Your{" "}
                  <span className="text-emerald-700 dark:text-emerald-400 underline decoration-emerald-300 dark:decoration-emerald-700 decoration-wavy decoration-2">
                    Dorm Room.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Connect with your favorite campus canteens and fellow student riders. From late-night khichuri at Shahidullah Hall to fresh burgers by TSC — fast, hot, and escrow-verified.
                </p>

                {/* Hero Search Box */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="max-w-xl mx-auto lg:mx-0 flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md ring-1 ring-zinc-900/5 dark:ring-white/10"
                >
                  <div className="pl-3.5 text-zinc-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search biryani, kacchi, burgers, tea, or canteens..."
                    className="flex-1 bg-transparent px-2 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="rounded-xl px-5 py-2.5 font-semibold shrink-0"
                  >
                    Search Food
                  </Button>
                </form>

                {/* Micro trust indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Flat ৳30 Hall Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>bKash &amp; Cash on Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Verified QR Handover</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md rounded-3xl p-3 bg-gradient-to-tr from-emerald-600/20 via-zinc-200/40 to-amber-500/20 dark:from-emerald-500/10 dark:to-amber-500/10 border border-zinc-200/60 dark:border-zinc-800 shadow-xl backdrop-blur-md">
                  <div className="rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-md">
                    <div className="relative h-64 sm:h-72 w-full">
                      <img
                        src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
                        alt="Campus Biryani"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="primary" size="md" className="shadow-md">
                          ⭐ Top Campus Pick
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        <span>25-30 Mins</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                          Khan's Shahi Biryani
                        </h4>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>4.9 (512 reviews)</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Opposite Shahidullah Hall Gate • Traditional Kacchi &amp; Borhani
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Special Kacchi from <strong className="text-emerald-700 dark:text-emerald-400">৳290</strong>
                        </span>
                        <Link href="/student/shops/shop-2">
                          <Button variant="primary" size="sm" className="rounded-xl">
                            View Menu <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Floating rider delivery badge */}
                  <div className="absolute -bottom-5 -left-4 sm:-left-6 rounded-2xl bg-white dark:bg-zinc-900 p-3 shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 animate-in slide-in-from-left duration-500">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Bike className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Active Hall Delivery
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Rider Sabbir is 4 mins away
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CAMPUS METRICS TICKER ================= */}
        <section className="py-8 bg-emerald-900 text-white dark:bg-zinc-950 border-b border-emerald-800 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                  6+
                </div>
                <div className="text-xs text-emerald-100 dark:text-zinc-400 font-medium">
                  Approved Campus Canteens
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                  ৳30
                </div>
                <div className="text-xs text-emerald-100 dark:text-zinc-400 font-medium">
                  Flat Hall Delivery Fee
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                  18 Mins
                </div>
                <div className="text-xs text-emerald-100 dark:text-zinc-400 font-medium">
                  Average Delivery Time
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                  100%
                </div>
                <div className="text-xs text-emerald-100 dark:text-zinc-400 font-medium">
                  Secure Escrow Protection
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURED SHOPS GRID ================= */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
                <Utensils className="h-3.5 w-3.5" />
                <span>Campus Favorites</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                Discover Verified University Food Outlets
              </h2>
            </div>
            <Link href="/student/home">
              <Button variant="outline" size="sm" className="rounded-xl">
                View All Canteens <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Link key={shop.id} href={`/student/shops/${shop.id}`} className="group">
                <Card hoverEffect className="h-full flex flex-col">
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={shop.bannerUrl}
                      alt={shop.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="default" size="sm" className="bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white backdrop-blur-md shadow-xs">
                        {shop.cuisine}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="h-3 w-3 text-emerald-400" />
                      <span>{shop.deliveryTimeMinutes} mins</span>
                    </div>
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
        </section>

        {/* ================= ROLE PATHWAYS ================= */}
        <section className="py-16 sm:py-20 bg-zinc-100/60 dark:bg-zinc-900/40 border-y border-zinc-200/80 dark:border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                Engineered for the Entire Campus Community
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Whether you need a late-night feast during exam prep, run a university canteen, or want flexible earnings between classes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Student */}
              <div className="rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    For Campus Students
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Order from all campus halls and canteens. Track your delivery rider on the campus map and verify handovers securely via QR code.
                  </p>
                </div>
                <Link href="/signup?role=student">
                  <Button variant="secondary" size="md" className="w-full">
                    Register as Student <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Shop Owner */}
              <div className="rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                    <Store className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    For Food Shop Owners
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Expand canteen revenue into every dormitory. Manage live incoming orders, menu stock, and automated 85% escrow payouts.
                  </p>
                </div>
                <Link href="/signup?role=shop_owner">
                  <Button variant="secondary" size="md" className="w-full">
                    Apply as Shop Partner <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Rider */}
              <div className="rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                    <Bike className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    For Student Riders
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Earn 12% on every delivery on your bicycle or walking between classes. Flexible schedule, instant wallet credits, and campus tips.
                  </p>
                </div>
                <Link href="/signup?role=rider">
                  <Button variant="secondary" size="md" className="w-full">
                    Deliver &amp; Earn <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ESCROW & SECURITY BANNER ================= */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <Badge variant="default" size="sm" className="bg-emerald-800 text-emerald-200 border-emerald-700">
                🔒 Built-In Financial Escrow
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Zero Stress Ordering with Verifiable QR Handovers
              </h2>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Your payment is securely held in platform escrow until you scan the handover code at your dorm gate. Neither shop nor rider receives disbursement until food is delivered.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link href="/student/home">
                  <Button variant="primary" size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                    Start Ordering Food
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" size="lg" className="border-emerald-600 text-white bg-transparent hover:bg-emerald-800">
                    Create an Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
