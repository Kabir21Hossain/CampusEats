"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  // Resolution modal
  const [activeDispute, setActiveDispute] = useState(null);
  const [resolutionText, setResolutionText] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    const response = await adminService.getDisputes({ page, limit: 20 });
    if (response.success) {
      setDisputes(response.data);
      setMeta(response.meta);
      setError("");
      if (page > Math.max(1, response.meta.totalPages || 1)) {
        setPage(Math.max(1, response.meta.totalPages || 1));
      }
    } else {
      setError(response.error.message);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleOpenResolveModal = (disp) => {
    setActiveDispute(disp);
    setRefundAmount(disp.amountBDT.toString());
    setResolutionText(`Approved full refund of ৳${disp.amountBDT} credited back to customer wallet.`);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionText.trim()) {
      toast.error("Please enter a resolution decision explanation");
      return;
    }

    setActionLoading(true);
    const res = await adminService.resolveDispute(activeDispute.id, {
      resolution: resolutionText,
      refundAmount: parseFloat(refundAmount) || 0,
    });
    setActionLoading(false);

    if (res.success) {
      toast.success(`Dispute #${activeDispute.id} resolved successfully!`);
      setActiveDispute(null);
      loadDisputes();
    } else {
      toast.error(res.error.message);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Campus Order Dispute Resolution
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Review customer incident reports, inspect evidence, and authorize escrow refunds
        </p>
      </div>

      {error ? (
        <div role="alert" className="p-8 rounded-2xl border border-amber-200 bg-amber-50 text-center text-sm text-amber-800">
          Dispute management is unavailable: {error}
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
          No disputes recorded on the platform.
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((disp) => (
            <Card
              key={disp.id}
              className={disp.status === "pending" ? "border-rose-300 dark:border-rose-900/60" : ""}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Dispute #{disp.id}
                    </span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Order #{disp.orderId}
                    </span>
                  </div>

                  <Badge
                    variant={disp.status === "pending" ? "rose" : "default"}
                    size="md"
                    className="font-bold text-xs"
                  >
                    {disp.status === "pending" ? "● Awaiting Arbitration" : "Resolved"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-zinc-500">
                      Opened by: <strong>{disp.openedByName}</strong> • {formatDate(disp.createdAt)}
                    </p>
                    <p className="text-zinc-800 dark:text-zinc-200 font-bold">
                      Reason: <span className="text-rose-600">{disp.reason}</span>
                    </p>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300">
                      <span className="font-semibold block text-zinc-700 dark:text-zinc-200 mb-0.5">
                        Submitted Evidence:
                      </span>
                      {disp.evidence}
                    </div>
                  </div>

                  <div className="space-y-2 sm:border-l sm:border-zinc-100 dark:sm:border-zinc-800 sm:pl-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Canteen Involved:</span>
                      <strong className="text-zinc-800 dark:text-zinc-200">{disp.shopName}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Rider Assigned:</span>
                      <strong className="text-zinc-800 dark:text-zinc-200">{disp.riderName}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Disputed Value:</span>
                      <strong className="text-base text-rose-600">
                        {formatCurrency(disp.amountBDT)}
                      </strong>
                    </div>

                    {disp.resolution && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 text-emerald-800 dark:text-emerald-300 mt-2">
                        <span className="font-bold block text-[11px] mb-0.5">
                          Resolution Decision:
                        </span>
                        {disp.resolution}
                      </div>
                    )}
                  </div>
                </div>

                {disp.status === "pending" && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenResolveModal(disp)}
                      className="rounded-xl font-bold text-xs bg-purple-700 hover:bg-purple-800 text-white"
                    >
                      <Scale className="h-4 w-4 mr-1.5" />
                      <span>Issue Authorized Resolution &amp; Refund</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>{meta.total} dispute(s)</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <span>{page} / {Math.max(1, meta.totalPages || 1)}</span>
          <Button variant="outline" size="sm" disabled={page >= (meta.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>

      {/* Resolution Decision Modal */}
      <Modal
        isOpen={!!activeDispute}
        onClose={() => setActiveDispute(null)}
        title={`Arbitrate Dispute — #${activeDispute?.id}`}
        description="Authorize financial refund and record auditable resolution notes."
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4 text-left">
          <Input
            label="Refund Amount (BDT ৳)"
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Resolution Decision Notes (Audited)
            </label>
            <textarea
              rows={3}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setActiveDispute(null)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={actionLoading}
              className="flex-1 rounded-xl font-bold bg-purple-700 hover:bg-purple-800 text-white"
            >
              Apply Settlement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
