"use client";

import React, { useState, useEffect } from "react";
import { adminService } from "@/services/admin-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Check,
  Ban,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");

  const loadUsers = () => {
    setLoading(true);
    adminService.listUsers(roleFilter).then((res) => {
      if (res.success) setUsers(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleToggleSuspension = async () => {
    if (!suspendingUser) return;
    const res = await adminService.toggleUserSuspension(
      suspendingUser.id,
      suspendReason
    );
    if (res.success) {
      toast.success(
        res.data.isSuspended
          ? `User ${suspendingUser.name} suspended.`
          : `User ${suspendingUser.name} reinstated.`
      );
      setSuspendingUser(null);
      setSuspendReason("");
      loadUsers();
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.studentId && u.studentId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Campus User Management
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Directory of all campus students, registered canteen owners, riders, and admins
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, ID, or campus email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {["all", "student", "shop_owner", "rider", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all uppercase text-[10px] ${
                roleFilter === r
                  ? "bg-purple-700 text-white shadow-xs font-bold"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
              }`}
            >
              {r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading user directory...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">No users match query.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Student / Shop ID</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 flex items-center gap-3">
                        <img
                          src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                          alt={u.name}
                          className="h-8 w-8 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                        />
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{u.name}</p>
                          <p className="text-[11px] text-zinc-400">{u.email}</p>
                        </div>
                      </td>

                      <td className="py-3 font-mono text-zinc-600 dark:text-zinc-300">
                        {u.studentId || u.shopId || "N/A"}
                      </td>

                      <td className="py-3">
                        <Badge
                          variant={
                            u.role === "admin"
                              ? "primary"
                              : u.role === "shop_owner"
                              ? "amber"
                              : u.role === "rider"
                              ? "blue"
                              : "default"
                          }
                          size="sm"
                          className="uppercase text-[10px]"
                        >
                          {u.role.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-3">
                        {u.isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-bold">
                            <Ban className="h-3.5 w-3.5" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <ShieldCheck className="h-3.5 w-3.5" /> Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => setSuspendingUser(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              u.isSuspended
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            {u.isSuspended ? "Reinstate" : "Suspend"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend / Reinstate Modal */}
      <Modal
        isOpen={!!suspendingUser}
        onClose={() => setSuspendingUser(null)}
        title={
          suspendingUser?.isSuspended
            ? `Reinstate Account — ${suspendingUser?.name}`
            : `Suspend Account — ${suspendingUser?.name}`
        }
        description="Provide justification for this security compliance action."
      >
        <div className="space-y-4 text-left">
          {!suspendingUser?.isSuspended && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Reason for Suspension
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Policy violation, repeatedly unfulfilled delivery..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setSuspendingUser(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={suspendingUser?.isSuspended ? "primary" : "danger"}
              size="md"
              onClick={handleToggleSuspension}
              className="flex-1 font-bold"
            >
              {suspendingUser?.isSuspended ? "Confirm Reinstate" : "Confirm Suspension"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
