"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { INITIAL_USERS, INITIAL_NOTIFICATIONS } from "@/services/mock/mock-data";
import { ROLES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]); // Default to student
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [mounted, setMounted] = useState(false);

  // Sync session on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedUser = localStorage.getItem("campuseats_active_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        // Ensure cookies match
        document.cookie = `campuseats_role=${parsed.role}; path=/; max-age=604800`;
        document.cookie = `campuseats_user_id=${parsed.id}; path=/; max-age=604800`;
      } else {
        // Set default student cookies
        document.cookie = `campuseats_role=student; path=/; max-age=604800`;
        document.cookie = `campuseats_user_id=student-1; path=/; max-age=604800`;
      }

      const savedNotifs = localStorage.getItem("campuseats_notifications");
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch {
      // fallback
    }
  }, []);

  const switchRole = (newRole) => {
    let targetUser = null;
    if (newRole === ROLES.STUDENT) {
      targetUser = INITIAL_USERS.find((u) => u.role === ROLES.STUDENT);
    } else if (newRole === ROLES.SHOP_OWNER) {
      targetUser = INITIAL_USERS.find((u) => u.role === ROLES.SHOP_OWNER);
    } else if (newRole === ROLES.RIDER) {
      targetUser = INITIAL_USERS.find((u) => u.role === ROLES.RIDER);
    } else if (newRole === ROLES.ADMIN) {
      targetUser = INITIAL_USERS.find((u) => u.role === ROLES.ADMIN);
    } else {
      targetUser = null; // visitor
    }

    setCurrentUser(targetUser);

    if (targetUser) {
      localStorage.setItem("campuseats_active_user", JSON.stringify(targetUser));
      document.cookie = `campuseats_role=${targetUser.role}; path=/; max-age=604800`;
      document.cookie = `campuseats_user_id=${targetUser.id}; path=/; max-age=604800`;
      toast.success(`Active Perspective: ${targetUser.name} (${targetUser.role.toUpperCase()})`);

      // Route to their respective portal
      if (targetUser.role === ROLES.STUDENT) router.push("/student/home");
      else if (targetUser.role === ROLES.SHOP_OWNER) router.push("/shop-owner/dashboard");
      else if (targetUser.role === ROLES.RIDER) router.push("/rider/available-orders");
      else if (targetUser.role === ROLES.ADMIN) router.push("/admin/dashboard");
    } else {
      localStorage.removeItem("campuseats_active_user");
      document.cookie = "campuseats_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "campuseats_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.info("Signed out / Visitor mode");
      router.push("/");
    }
  };

  const login = async (roleOrCredentials) => {
    let role = ROLES.STUDENT;
    let email = null;
    let password = null;

    if (typeof roleOrCredentials === "string") {
      role = roleOrCredentials;
    } else if (roleOrCredentials && typeof roleOrCredentials === "object") {
      email = roleOrCredentials.email;
      password = roleOrCredentials.password;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || `${role}@campuseats.com`, password: password || "123456" }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const user = data.data;
        setCurrentUser(user);
        localStorage.setItem("campuseats_active_user", JSON.stringify(user));
        document.cookie = `campuseats_role=${user.role}; path=/; max-age=604800`;
        document.cookie = `campuseats_user_id=${user.id}; path=/; max-age=604800`;
        toast.success(`Welcome back, ${user.name}!`);

        if (user.role === ROLES.STUDENT) router.push("/student/home");
        else if (user.role === ROLES.SHOP_OWNER) router.push("/shop-owner/dashboard");
        else if (user.role === ROLES.RIDER) router.push("/rider/available-orders");
        else if (user.role === ROLES.ADMIN) router.push("/admin/dashboard");
        return { success: true, user };
      } else {
        toast.error(data.error || "Authentication failed");
        return { success: false, error: data.error };
      }
    } catch {
      // Fallback to local user
      const user = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
      setCurrentUser(user);
      localStorage.setItem("campuseats_active_user", JSON.stringify(user));
      document.cookie = `campuseats_role=${user.role}; path=/; max-age=604800`;
      document.cookie = `campuseats_user_id=${user.id}; path=/; max-age=604800`;
      toast.success(`Signed in as ${user.name}`);
      if (user.role === ROLES.STUDENT) router.push("/student/home");
      else if (user.role === ROLES.SHOP_OWNER) router.push("/shop-owner/dashboard");
      else if (user.role === ROLES.RIDER) router.push("/rider/available-orders");
      else if (user.role === ROLES.ADMIN) router.push("/admin/dashboard");
      return { success: true, user };
    }
  };

  const registerUser = async (registrationData) => {
    try {
      const res = await fetch("/api/auth/register-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const user = data.data;
        setCurrentUser(user);
        localStorage.setItem("campuseats_active_user", JSON.stringify(user));
        document.cookie = `campuseats_role=${user.role}; path=/; max-age=604800`;
        document.cookie = `campuseats_user_id=${user.id}; path=/; max-age=604800`;
        toast.success("Account registered successfully in MongoDB!");
        return { success: true, user };
      } else {
        toast.error(data.error || "Registration failed");
        return { success: false, error: data.error };
      }
    } catch (err) {
      toast.error(err.message || "Registration connection error");
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("campuseats_active_user");
    document.cookie = "campuseats_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "campuseats_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    toast.info("Signed out successfully");
    router.push("/");
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
        role: currentUser?.role || "visitor",
        isAuthenticated: !!currentUser,
        switchRole,
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
