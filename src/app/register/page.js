"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DemoRoleBanner } from "@/components/shared/demo-role-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Store, Bike, ArrowRight, ShieldAlert, Check } from "lucide-react";

export default function RegisterRoleSelectorPage() {
  const roleCards = [
    {
      id: "student",
      title: "Student Account",
      badge: "Ordering & Hall Delivery",
      icon: GraduationCap,
      color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60",
      description:
        "Order meals from university shops directly to your dormitory room or hall gate. Track deliveries with verified QR handovers.",
      perks: [
        "Dormitory room delivery across all campus halls",
        "Flat ৳30 delivery fee per order",
        "bKash & Cash on Delivery payment options",
        "Instant order tracking & dispute support",
      ],
      href: "/register/student",
      cta: "Register as Student",
    },
    {
      id: "shop-owner",
      title: "Canteen / Shop Partner",
      badge: "Merchant Application",
      icon: Store,
      color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60",
      description:
        "List your campus food stall or canteen on CampusEats. Accept orders, manage menu availability, and receive 85% escrow payouts.",
      perks: [
        "Live order queue with prep status updates",
        "Instant menu item & price management",
        "Automated 85% revenue escrow payouts",
        "Campus food safety & hygiene verification badge",
      ],
      href: "/register/shop-owner",
      cta: "Apply as Shop Owner",
    },
    {
      id: "rider",
      title: "Student Delivery Rider",
      badge: "Earn on Campus",
      icon: Bike,
      color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60",
      description:
        "Deliver orders across campus on bicycle or foot during your free hours between classes. Earn 12% on every delivery plus student tips.",
      perks: [
        "Complete schedule flexibility between classes",
        "Bicycle, scooter, or walking delivery modes",
        "Guaranteed 12% fee split credited immediately",
        "Simple QR code pickup and delivery confirmation",
      ],
      href: "/register/rider",
      cta: "Register as Rider",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <DemoRoleBanner />
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Badge variant="default" size="sm" className="mb-1">
            Choose Your Account Path
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            How will you participate in CampusEats?
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Select the role appropriate for your campus journey. Each account type is customized for university food workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleCards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.id} hoverEffect className="flex flex-col justify-between h-full">
                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${c.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="neutral" size="sm">
                        {c.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {c.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      {c.perks.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href={c.href}>
                    <Button variant="primary" size="md" className="w-full rounded-xl font-semibold">
                      {c.cta} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Security disclaimer regarding admin accounts */}
        <div className="mt-12 p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
          <ShieldAlert className="h-4 w-4 text-zinc-400" />
          <span>
            Notice: Administrator credentials cannot be registered publicly and are provisioned directly by university oversight.
          </span>
        </div>
      </main>

      <Footer />
    </div>
  );
}
