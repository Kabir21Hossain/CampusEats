"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { ROLES } from "@/lib/constants";
import { ThemeToggle } from "./theme-toggle";
import {
  UtensilsCrossed,
  ShoppingBag,
  Bell,
  Search,
  Menu,
  X,
  Compass,
  Store,
  Bike,
  ShieldCheck,
  User,
  LogOut,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Function NavbarContent.
 * @returns {*} The operation result.
 */
function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    role,
    currentUser,
    logout,
    notifications,
    notificationError,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
  } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Dynamic Navigation according to active role
  /**
   * Arrow function getNavLinks.
   * @returns {*} The operation result.
   */
  const getNavLinks = () => {
    if (role === ROLES.STUDENT) {
      return [
        { href: "/student/home", label: "Discovery" },
        { href: "/student/search", label: "Search & Filter" },
        { href: "/student/orders", label: "My Orders" },
        { href: "/student/profile", label: "Profile" },
      ];
    }

    if (role === ROLES.SHOP_OWNER) {
      return [
        { href: "/shop-owner/dashboard", label: "Dashboard" },
        { href: "/shop-owner/orders", label: "Live Queue" },
        { href: "/shop-owner/menu", label: "Menu Items" },
        { href: "/shop-owner/earnings", label: "Earnings" },
        { href: "/shop-owner/settings", label: "Settings" },
      ];
    }
    if (role === ROLES.RIDER) {
      return [
        { href: "/rider/available-orders", label: "Available Feed" },
        { href: "/rider/active-delivery", label: "Active Delivery" },
        { href: "/rider/earnings", label: "My Earnings" },
        { href: "/rider/profile", label: "Rider Profile" },
      ];
    }
    if (role === ROLES.ADMIN) {
      return [
        { href: "/admin/dashboard", label: "Overview" },
        { href: "/admin/shops", label: "Shop Approvals" },
        { href: "/admin/users", label: "User Directory" },
        { href: "/admin/orders", label: "Order Monitor" },
        { href: "/admin/payments", label: "Payment Review" },
        { href: "/admin/payouts", label: "Payouts" },
        { href: "/admin/audit-logs", label: "Audit Log" },
        { href: "/admin/payment-settings", label: "Payment Settings" },
        { href: "/admin/disputes", label: "Disputes" },
      ];
    }
    // Visitor / Public
    return [
      { href: "/", label: "Browse Shops" },
      { href: "/signup", label: "Join CampusEats" },
      { href: "/signin", label: "Sign In" },
    ];
  };

  const navLinks = getNavLinks();
  const dashboardHref = {
    [ROLES.STUDENT]: "/student/home",
    [ROLES.SHOP_OWNER]: "/shop-owner/dashboard",
    [ROLES.RIDER]: "/rider/available-orders",
    [ROLES.ADMIN]: "/admin/dashboard",
  }[role];
  const roleLabel = {
    [ROLES.STUDENT]: "Student",
    [ROLES.SHOP_OWNER]: "Shop Owner",
    [ROLES.RIDER]: "Rider",
    [ROLES.ADMIN]: "Admin",
  }[role];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
                Campus<span className="text-emerald-700 dark:text-emerald-400">Eats</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                DU Campus
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline leading-none">
              Dormitory Delivery & Food Hub
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-900/70 px-2 py-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Cart Trigger (for students) */}
          {role === ROLES.STUDENT && (
            <Link
              href="/student/cart"
              className="relative flex h-9 items-center gap-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 transition-colors shadow-2xs"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden sm:inline text-xs font-bold">{itemCount}</span>
              <span className="hidden sm:inline text-xs font-medium">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* Notifications Popover */}
          {currentUser && <div className="relative">
            <button
              type="button"
              onClick={() => setNotifsOpen(!notifsOpen)}
              aria-expanded={notifsOpen}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notification Menu */}
            {notifsOpen && (
              <div className="fixed left-4 right-4 top-20 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Notifications
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    {unreadNotificationsCount} unread
                  </span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead()}
                    className="w-full px-4 py-2 text-left text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    Mark all as read
                  </button>
                )}
                {notificationError && (
                  <div className="px-4 py-2 text-[11px] text-rose-600 dark:text-rose-400">
                    <p role="alert">{notificationError}</p>
                    <button
                      type="button"
                      onClick={refreshNotifications}
                      className="mt-1 font-semibold underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        type="button"
                        key={n.id}
                        onClick={async () => {
                          const markedRead = await markNotificationRead(n.id);
                          if (!markedRead) return;
                          setNotifsOpen(false);
                          if (
                            typeof n.href === "string" &&
                            n.href.startsWith("/") &&
                            !n.href.startsWith("//")
                          ) {
                            router.push(n.href);
                          }
                        }}
                        className={cn(
                          "block w-full p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors text-left",
                          !n.isRead && "bg-emerald-50/40 dark:bg-emerald-950/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>}

          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* User Profile / Auth State */}
          {currentUser ? (
            <div className="relative hidden sm:block pl-1">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                aria-expanded={profileOpen}
                aria-label="Open account menu"
              >
                <img
                  src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                  alt=""
                  className="h-6 w-6 rounded-lg object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                />
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 hidden lg:inline max-w-[100px] truncate">
                  {currentUser.name.split(" ")[0]}
                </span>
                <span className="sr-only">{roleLabel} account menu</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">{roleLabel}</p>
                  </div>
                  {dashboardHref && (
                    <Link
                      href={dashboardHref}
                      onClick={() => setProfileOpen(false)}
                      className="block px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Go to dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signin"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-4 py-4 space-y-2 animate-in slide-in-from-top-4 duration-200">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2">
            Navigation Menu ({role})
          </p>
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium",
                  pathname === link.href
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
              >
                <span>{link.label}</span>
                <ChevronRight className="h-4 w-4 opacity-40" />
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center px-2">
            <span className="text-xs text-zinc-500">
              Role: <strong className="text-zinc-800 dark:text-zinc-200 uppercase">{role}</strong>
            </span>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {currentUser && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Function Navbar.
 * @returns {*} The operation result.
 */
export function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 shrink-0" aria-hidden="true" />}>
      <NavbarContent />
    </Suspense>
  );
}
