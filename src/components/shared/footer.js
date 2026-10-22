import React from "react";
import Link from "next/link";
import { UtensilsCrossed, Shield, Heart, MapPin, Clock, Bike } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md mt-auto text-xs text-zinc-500 dark:text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Campus<span className="text-emerald-700 dark:text-emerald-400">Eats</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              Student-powered food ordering and peer-to-peer delivery platform. Connecting campus canteens directly to dormitory rooms with verifiable QR handovers.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
              <Shield className="h-3.5 w-3.5" />
              <span>Escrow Protected &amp; Halal Verified</span>
            </div>
          </div>

          {/* Student Links */}
          <div className="space-y-2">
            <h5 className="font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider text-[11px]">
              For Students
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/student/home" className="hover:text-emerald-600 transition-colors">
                  Explore Campus Shops
                </Link>
              </li>
              <li>
                <Link href="/student/search" className="hover:text-emerald-600 transition-colors">
                  Food Search &amp; Dietary Filter
                </Link>
              </li>
              <li>
                <Link href="/student/orders" className="hover:text-emerald-600 transition-colors">
                  Live Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/signup?role=student" className="hover:text-emerald-600 transition-colors">
                  Student Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Partners & Riders */}
          <div className="space-y-2">
            <h5 className="font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider text-[11px]">
              Partners &amp; Riders
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/signup?role=shop_owner" className="hover:text-emerald-600 transition-colors">
                  Apply as Food Shop Owner
                </Link>
              </li>
              <li>
                <Link href="/signup?role=rider" className="hover:text-emerald-600 transition-colors">
                  Become a Student Rider
                </Link>
              </li>
              <li>
                <Link href="/shop-owner/dashboard" className="hover:text-emerald-600 transition-colors">
                  Shop Owner Dashboard
                </Link>
              </li>
              <li>
                <Link href="/rider/available-orders" className="hover:text-emerald-600 transition-colors">
                  Rider Delivery Queue
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Admin & Guidelines */}
          <div className="space-y-2">
            <h5 className="font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider text-[11px]">
              Platform &amp; Administration
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/admin/dashboard" className="hover:text-emerald-600 transition-colors">
                  Admin Analytics &amp; KPIs
                </Link>
              </li>
              <li>
                <Link href="/admin/shops" className="hover:text-emerald-600 transition-colors">
                  Shop Approval Queue
                </Link>
              </li>
              <li>
                <Link href="/admin/disputes" className="hover:text-emerald-600 transition-colors">
                  Dispute Resolution
                </Link>
              </li>
              <li>
                <span className="text-zinc-400 dark:text-zinc-500">
                  Currency: Bangladeshi Taka (৳)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>© 2026 CampusEats Platform. Built for University Dormitory Communities.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for campus students
          </p>
        </div>
      </div>
    </footer>
  );
}
