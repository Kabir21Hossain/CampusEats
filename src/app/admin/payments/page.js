"use client";

import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/services/admin-service";
import { usePolling } from "@/hooks/use-polling";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_STATUSES = [
  ["pending_verification", "Needs review"],
  ["not_submitted", "Not submitted"],
  ["verified", "Verified"],
  ["rejected", "Rejected"],
  ["all", "All"],
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState("pending_verification");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState({});

  const loadPayments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const response = await adminService.listPayments(status === "all" ? "" : status);
    if (response.success) {
      setPayments(response.data);
      setError("");
    } else {
      setError(response.error.message || "Unable to load payment reviews.");
    }
    if (showLoading) setLoading(false);
  }, [status]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  usePolling(() => loadPayments(false), 10000);

  const handleVerify = async (payment) => {
    setActionId(payment.id);
    const response = await adminService.verifyPayment(payment.id);
    setActionId("");
    if (!response.success) {
      toast.error(response.error.message || "Unable to verify payment.");
      return;
    }
    toast.success(`Payment for order #${payment.orderId} verified.`);
    await loadPayments(false);
  };

  const handleReject = async (payment) => {
    const reason = String(rejectionReasons[payment.id] || "").trim();
    if (!reason) {
      toast.error("Enter a reason before rejecting this reference.");
      return;
    }
    setActionId(payment.id);
    const response = await adminService.rejectPayment(payment.id, reason);
    setActionId("");
    if (!response.success) {
      toast.error(response.error.message || "Unable to reject payment.");
      return;
    }
    setRejectionReasons((current) => ({ ...current, [payment.id]: "" }));
    toast.success(`Payment for order #${payment.orderId} rejected.`);
    await loadPayments(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            bKash Payment Review
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
            Verify each transaction against the merchant account before approving it.
            Orders become available to riders only after both the shop and platform
            payments are verified.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadPayments()} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        A submitted reference is not proof of payment. Never approve it without
        checking the actual merchant transaction. Approval records the received
        payment in the pending ledger; it does not send a payout.
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter payment status">
        {PAYMENT_STATUSES.map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={status === value ? "primary" : "outline"}
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={() => loadPayments()}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-sm text-zinc-400">Loading payment references...</div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
          No payments in this queue.
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Order #{payment.orderId} · {payment.obligation === "shop" ? "Food payment to shop" : "Delivery and platform fees"}
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Submitted {payment.submittedAt ? formatDate(payment.submittedAt) : "—"}
                    </p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                    {payment.status.replaceAll("_", " ")}
                    {payment.isTest ? " · TEST" : ""}
                  </span>
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-zinc-500">Amount</dt>
                    <dd className="font-bold">{formatCurrency((payment.amountPaisa || 0) / 100)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Recipient</dt>
                    <dd className="font-mono">{payment.recipient || "Not recorded"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-zinc-500">Transaction reference</dt>
                    <dd className="break-all font-mono font-semibold">
                      {payment.normalizedReference || "No reference submitted"}
                    </dd>
                  </div>
                  {payment.rejectionReason && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-zinc-500">Previous rejection reason</dt>
                      <dd>{payment.rejectionReason}</dd>
                    </div>
                  )}
                </dl>

                {payment.status === "pending_verification" && (
                  <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={actionId === payment.id}
                        disabled={Boolean(actionId)}
                        onClick={() => handleVerify(payment)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Verified in merchant account
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        aria-label={`Rejection reason for payment ${payment.id}`}
                        placeholder="Reason to send to the student"
                        maxLength={500}
                        value={rejectionReasons[payment.id] || ""}
                        onChange={(event) =>
                          setRejectionReasons((current) => ({
                            ...current,
                            [payment.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={actionId === payment.id}
                        disabled={Boolean(actionId)}
                        onClick={() => handleReject(payment)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject reference
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
