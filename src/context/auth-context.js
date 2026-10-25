"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient, useSession, getSession } from "@/lib/auth-client";
import { ROLES } from "@/lib/constants";
import { apiRequest } from "@/services/api-client";
import { notificationService } from "@/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const { data: sessionData, isPending, refetch } = useSession();

  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute active user and authoritative role from Better Auth session
  const currentUser = sessionData?.user || null;
  const activeRole = currentUser?.role || "visitor";
  const isAuthenticated = Boolean(currentUser);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser?.id) {
      setNotifications([]);
      setNotificationError("");
      return;
    }

    const response = await notificationService.listNotifications();
    if (!response.success) {
      setNotificationError(response.error?.message || "Unable to load notifications.");
      return;
    }

    setNotifications(response.data);
    setNotificationError("");
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      setNotificationError("");
      return undefined;
    }

    refreshNotifications();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshNotifications();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [currentUser?.id, refreshNotifications]);

  /**
   * Helper to redirect user to their assigned role portal
   */
  const routeToRolePage = React.useCallback((role) => {
    if (role === ROLES.STUDENT) router.replace("/student/home");
    else if (role === ROLES.SHOP_OWNER) router.replace("/shop-owner/dashboard");
    else if (role === ROLES.RIDER) router.replace("/rider/available-orders");
    else if (role === ROLES.ADMIN) router.replace("/admin/dashboard");
    else router.replace("/signin");
  }, [router]);

  /**
   * Authenticate with Better Auth using email and password
   */
  const login = async ({ email, password }) => {
    try {
      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!normalizedEmail) {
        return { success: false, error: "Enter a valid email address." };
      }

      const { data, error } = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const refreshedSession = await refetch();
      const user = refreshedSession?.data?.user || data?.user;
      if (!user) {
        return {
          success: false,
          error: "Sign-in succeeded, but the backend did not return an active user session.",
        };
      }

      if (
        user.isApproved === false ||
        user.verificationStatus === "pending" ||
        user.verificationStatus === "rejected"
      ) {
        const applicationType = user.role === ROLES.SHOP_OWNER ? "shop" : "rider";
        const applicationStatus =
          user.verificationStatus === "rejected" ? "rejected" : "pending";
        router.replace(
          `/verification-status?type=${applicationType}&status=${applicationStatus}&name=${encodeURIComponent(user.shopName || user.name || "your application")}`
        );
        return { success: true, user };
      }

      routeToRolePage(user.role);
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Register a new user with Better Auth and MongoDB persistence
   */
  const registerUser = async (registrationData) => {
    try {
      const { email, password, name, role = ROLES.STUDENT } = registrationData;
      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!normalizedEmail) {
        return { success: false, error: "Enter a valid email address." };
      }

      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          name: String(name || "").trim(),
          role,
          studentId: registrationData.studentId,
          department: registrationData.department,
          hall: registrationData.hall,
          roomNumber: registrationData.roomNumber,
          phone: registrationData.phone,
          shopName: registrationData.shopName,
          location: registrationData.location,
          shopDescription: registrationData.shopDescription,
          shopCategory: registrationData.shopCategory,
          vehicleType: registrationData.vehicleType,
          licenseNumber: registrationData.licenseNumber,
          deliveryZones: registrationData.deliveryZones,
        }),
      });

      if (!response.success) {
        return { success: false, error: response.error.message };
      }

      return { success: true, user: response.data.user };
    } catch (err) {
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
      router.push("/signin");
    } catch (err) {
      toast.error("Sign out encountered an issue");
      router.push("/signin");
    }
  };

  const markNotificationRead = async (notifId) => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) =>
      n.id === notifId ? { ...n, isRead: true } : n
    ));
    const response = await notificationService.markRead(notifId);
    if (!response.success) {
      setNotifications(previous);
      setNotificationError(response.error?.message || "Unable to mark notification as read.");
      return false;
    }
    setNotificationError("");
    return true;
  };

  const markAllNotificationsRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    const response = await notificationService.markAllRead();
    if (!response.success) {
      setNotifications(previous);
      setNotificationError(response.error?.message || "Unable to mark notifications as read.");
      return false;
    }
    setNotificationError("");
    return true;
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
        notificationError,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        refreshNotifications,
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
