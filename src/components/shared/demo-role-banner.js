"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { ROLES } from "@/lib/constants";
import { GraduationCap, Store, Bike, ShieldCheck, UserX, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DemoRoleBanner() {
  const { role, currentUser, switchRole, mounted } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!mounted) return null;

  const roleConfigs = [
    {
      role: ROLES.STUDENT,
      label: "Student",
      name: "Tanvir Ahmed",
      icon: GraduationCap,
      color: "bg-emerald-600 text-white",
      href: "/student/home",
    },
    {
      role: ROLES.SHOP_OWNER,
      label: "Shop Owner",
      name: "Rafiqul Islam",
      icon: Store,
      color: "bg-amber-600 text-white",
      href: "/shop-owner/dashboard",
    },
    {
      role: ROLES.RIDER,
      label: "Delivery Rider",
      name: "Sabbir Hossain",
      icon: Bike,
      color: "bg-blue-600 text-white",
      href: "/rider/available-orders",
    },
    {
      role: ROLES.ADMIN,
      label: "Administrator",
      name: "Dr. Farhana",
      icon: ShieldCheck,
      color: "bg-purple-600 text-white",
      href: "/admin/dashboard",
    },
    {
      role: "visitor",
      label: "Visitor",
      name: "Signed Out",
      icon: UserX,
      color: "bg-zinc-600 text-white",
      href: "/",
    },
  ];

  const currentConfig =
    roleConfigs.find((c) => c.role === role) || roleConfigs[0];

  return (
    <div className="bg-zinc-900 text-zinc-100 border-b border-zinc-800 text-xs px-3 sm:px-6 py-1.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">CampusEats Live Demo:</span>
          </span>
          <span className="text-zinc-400">Active View:</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1",
              currentConfig.color
            )}
          >
            <currentConfig.icon className="h-3 w-3" />
            {currentConfig.label} ({currentUser?.name?.split(" ")[0] || "Guest"})
          </span>
        </div>

        {/* Quick Role Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] text-zinc-400 hidden md:inline">
            Switch Perspective:
          </span>
          {roleConfigs.map((cfg) => {
            const isCurrent = role === cfg.role;
            const Icon = cfg.icon;
            return (
              <button
                key={cfg.role}
                type="button"
                onClick={() => switchRole(cfg.role)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                  isCurrent
                    ? "bg-zinc-800 text-emerald-400 ring-1 ring-emerald-500/50 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                )}
                title={`Switch to ${cfg.label} perspective`}
              >
                <Icon className="h-3 w-3" />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
