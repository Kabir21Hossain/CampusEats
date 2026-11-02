"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin-service";
import { shopService } from "@/services/shop-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import {
  Store,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Function AdminShopApprovalsPage.
 * @returns {*} The operation result.
 */
export default function AdminShopApprovalsPage() {
  const [applications, setApplications] = useState([]);
  const [existingShops, setExistingShops] = useState([]);
  const [applicationError, setApplicationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [applicationPage, setApplicationPage] = useState(1);
  const [applicationMeta, setApplicationMeta] = useState({ total: 0, totalPages: 0 });

  // Reject modal
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminService.getShopApplications({ page: applicationPage, limit: 20 }),
      shopService.listShops(),
    ]).then(([appRes, shopRes]) => {
      if (appRes.success) {
        setApplications(appRes.data);
        setApplicationMeta(appRes.meta);
        if (applicationPage > Math.max(1, appRes.meta.totalPages || 1)) {
          setApplicationPage(Math.max(1, appRes.meta.totalPages || 1));
        }
        setApplicationError("");
      } else {
        setApplicationError(appRes.error.message);
      }
      if (shopRes.success) setExistingShops(shopRes.data);
      setLoading(false);
    });
  }, [applicationPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Arrow function handleApprove.
   * @param {*} app - Input value used by the operation.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleApprove = async (app) => {
    setActionLoading(true);
    const res = await adminService.reviewShopApplication(app.id, "approved");
    setActionLoading(false);
    if (res.success) {
      toast.success(`Application approved! "${app.shopName}" is now an active campus canteen.`);
      loadData();
    } else {
      toast.error(res.error.message);
    }
  };

  /**
   * Arrow function handleRejectConfirm.
   * @returns {Promise<*>} Resolves with the operation result.
   */
  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setActionLoading(true);
    const res = await adminService.reviewShopApplication(
      rejectingApp.id,
      "rejected",
      rejectReason
    );
    setActionLoading(false);
    if (res.success) {
      toast.info(`Application for "${rejectingApp.shopName}" was rejected.`);
      setRejectingApp(null);
      setRejectReason("");
      loadData();
    } else {
      toast.error(res.error.message);
    }
  };

  const pendingApps = applications.filter((a) => a.status === "pending");

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Canteen Application &amp; Shop Approvals
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Review submitted shop-owner applications and activate approved campus shops.
        </p>
      </div>

      {/* Pending Applications Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Pending Review Queue</span>
            <Badge variant="amber" size="sm">
              {pendingApps.length} Action Needed
            </Badge>
          </h2>
        </div>

        {applicationError ? (
          <div role="alert" className="p-8 rounded-2xl border border-amber-200 bg-amber-50 text-center text-sm text-amber-800">
            Shop applications are unavailable: {applicationError}
          </div>
        ) : loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">Loading applications...</div>
        ) : pendingApps.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
            No pending shop applications. All submissions reviewed!
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApps.map((app) => (
              <Card key={app.id} className="border-amber-300 dark:border-amber-800/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                        {app.shopName}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Submitted by: {app.applicantName} • {formatDate(app.submittedAt)}
                      </p>
                    </div>

                    <Badge variant="amber" size="md">
                      Pending Inspection
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Proposed Location: {app.proposedLocation}</span>
                      </div>
                      <p className="text-zinc-500">{app.description}</p>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        Submitted Compliance Documents:
                      </span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {app.documents.map((doc, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          >
                            <FileText className="h-3 w-3 text-emerald-600" />
                            <span>{doc.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Decision Actions */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectingApp(app)}
                      className="text-xs text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject with Reason
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(app)}
                      isLoading={actionLoading}
                      className="text-xs font-bold rounded-xl"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Approve &amp; Activate Shop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>{applicationMeta.total} pending application(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={applicationPage <= 1 || loading} onClick={() => setApplicationPage((value) => value - 1)}>Previous</Button>
            <span>{applicationPage} / {Math.max(1, applicationMeta.totalPages || 1)}</span>
            <Button variant="outline" size="sm" disabled={applicationPage >= (applicationMeta.totalPages || 1) || loading} onClick={() => setApplicationPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      </div>

      {/* Active Canteens Roster */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Currently Approved Campus Canteens ({existingShops.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingShops.map((shop) => (
            <Card key={shop.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {shop.name}
                  </h4>
                  <Badge variant="default" size="sm">
                    Approved
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500">{shop.campusLocation}</p>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-[11px] text-zinc-400">
                  <span>Rating: {shop.rating} ★</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {shop.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={!!rejectingApp}
        onClose={() => setRejectingApp(null)}
        title={`Reject Application — ${rejectingApp?.shopName}`}
        description="Explain why this canteen application did not meet university food safety standards."
      >
        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Reason for Decision (Required)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Health inspection documentation missing, location conflict..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setRejectingApp(null)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleRejectConfirm}
              className="flex-1 rounded-xl font-bold"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
