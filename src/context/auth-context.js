"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient, useSession, getSession } from "@/lib/auth-client";
import { ROLES } from "@/lib/constants";
import { INITIAL_NOTIFICATIONS } from "@/services/mock/mock-data";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const { data: sessionData, isPending, error: sessionError, refetch } = useSession();

  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    setMounted(true);
    try {
      const savedNotifs = localStorage.getItem("campuseats_notifications");
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch {
      // fallback
    }
  }, []);

  // Compute active user and authoritative role from Better Auth session
  const currentUser = sessionData?.user || null;
  const activeRole = currentUser?.role || "visitor";
  const isAuthenticated = Boolean(currentUser);

  /**
   * Helper to redirect user to their assigned role portal
   */
  const routeToRolePage = (role) => {
    if (role === ROLES.STUDENT) router.push("/student/home");
    else if (role === ROLES.SHOP_OWNER) router.push("/shop-owner/dashboard");
    else if (role === ROLES.RIDER) router.push("/rider/available-orders");
    else if (role === ROLES.ADMIN) router.push("/admin/dashboard");
    else router.push("/signin");
  };

  /**
   * Authenticate with Better Auth using email and password
   */
  const login = async ({ email, password }) => {
    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error(error.message || "Invalid credentials. Please try again.");
        return { success: false, error: error.message };
      }

      // Check authoritative session using getSession
      const freshSession = await getSession();
      const user = freshSession?.data?.user || data?.user;

      toast.success(`Welcome back, ${user?.name || "User"}!`);
      await refetch();
      router.push("/");
      return { success: true, user };
    } catch (err) {
      toast.error(err.message || "Failed to sign in. Please verify your connection.");
      return { success: false, error: err.message };
    }
  };

  /**
   * Register a new user with Better Auth and MongoDB persistence
   */
  const registerUser = async (registrationData) => {
    try {
      const { email, password, name, role = ROLES.STUDENT, ...additionalFields } =
        registrationData;

      const { data, error } = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        role,
        ...additionalFields,
      });

      if (error) {
        toast.error(error.message || "Registration failed. Please check form details.");
        return { success: false, error: error.message };
      }

      toast.success("Account created successfully. Please sign in.");

      return { success: true, user: data?.user };
    } catch (err) {
      toast.error(err.message || "Registration error");
      return { success: false, error: err.message };
    }
  };

  /**
   * Logout: Invalidate server session via Better Auth and clear cookies
   */
  const logout = async () => {
    try {
      await authClient.signOut();
      await refetch();
      toast.info("Signed out successfully");
      router.push("/signin");
    } catch (err) {
      toast.error("Sign out encountered an issue");
      router.push("/signin");
    }
  };

  const markNotificationRead = (notifId) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === notifId ? { ...n, isRead: true } : n
      );
      localStorage.setItem("campuseats_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const unreadNotificationsCount = notifications.filter(
    (n) => currentUser && n.userId === currentUser.id && !n.isRead
  ).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: activeRole,
        isAuthenticated,
        isPending,
        session: sessionData?.session || null,
        useSession,
        getSession,
        refetchSession: refetch,
        routeToRolePage,
        login,
        registerUser,
        logout,
        notifications: currentUser
          ? notifications.filter((n) => n.userId === currentUser.id)
          : [],
        unreadNotificationsCount,
        markNotificationRead,
        mounted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
