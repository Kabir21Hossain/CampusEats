"use client";

import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const PAYOUT_STATUSES = [
  ["requested", "Requested"],
  ["approved", "Approved"],
  ["processing", "Processing"],
  ["paid", "Paid"],
  ["rejected", "Rejected"],
  ["failed", "Failed"],
  ["all", "All"],
];

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [status, setStatus] = useState("requested");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [fields, setFields] = useState({});
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    const response = await adminService.listPayouts(
      status === "all" ? "" : status,
      { page, limit: 20 }
    );
    if (response.success) {
      setPayouts(response.data);
      setMeta(response.meta);
      setError("");
      if (page > Math.max(1, response.meta.totalPages || 1)) {
        setPage(Math.max(1, response.meta.totalPages || 1));
      }
    } else {
      setError(response.error.message || "Unable to load payout requests.");
    }
    setLoading(false);
  }, [page, status]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const transition = async (payout, action) => {
    const input = fields[payout.id] || {};
    if (["reject", "fail"].includes(action) && !String(input.reason || "").trim()) {
      toast.error("Enter a reason before rejecting or failing this payout.");
      return;
    }
    if (action === "mark-paid" && !String(input.reference || "").trim()) {
      toast.error("Enter the confirmed payout transaction reference.");
      return;
    }
    setBusyId(payout.id);
    const response = await adminService.transitionPayout(payout.id, action, {
      reason: input.reason,
      payoutReference: input.reference,
    });
    setBusyId("");
    if (!response.success) {
      toast.error(response.error.message || "Unable to update payout.");
      return;
    }
    toast.success(`Payout ${response.data?.status || "updated"}.`);
    await loadPayouts();
  };

  const updateField = (payoutId, key, value) => {
    setFields((current) => ({
      ...current,
      [payoutId]: { ...current[payoutId], [key]: value },
    }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rider payout queue</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review payout requests and record the real transaction reference only after funds are sent.
        </p>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        Mark a payout paid only after confirming the external transfer. References are unique across all payouts.
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter payout status">
        {PAYOUT_STATUSES.map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={status === value ? "primary" : "outline"}
            aria-pressed={status === value}
            onClick={() => {
              setPage(1);
              setStatus(value);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={loadPayouts}>Retry</Button>
        </div>
      ) : loading ? (
        <p className="p-10 text-center text-sm text-zinc-500">Loading payout requests...</p>
      ) : payouts.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-zinc-500">
          No payouts in this queue.
        </p>
      ) : (
        <div className="space-y-4">
          {payouts.map((payout) => {
            const input = fields[payout.id] || {};
            return (
              <Card key={payout.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{formatCurrency((payout.amountPaisa || 0) / 100)}</h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        Rider {payout.riderId} · requested {formatDate(payout.createdAt)}
                      </p>
                      {payout.payoutReference ? (
                        <p className="mt-1 break-all font-mono text-xs">Reference: {payout.payoutReference}</p>
                      ) : null}
                      {payout.resolutionReason ? (
                        <p className="mt-1 text-xs text-zinc-500">Reason: {payout.resolutionReason}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold capitalize">
                      {payout.status}
                    </span>
                  </div>
                  {["requested", "approved", "processing"].includes(payout.status) ? (
                    <div className="space-y-3">
                      {payout.status === "processing" ? (
                        <Input
                          label="Confirmed transfer reference"
                          value={input.reference || ""}
                          onChange={(event) => updateField(payout.id, "reference", event.target.value)}
                          maxLength={50}
                          placeholder="Actual bank or mobile-wallet reference"
                        />
                      ) : null}
                      {["requested", "approved", "processing"].includes(payout.status) ? (
                        <Input
                          label="Reason (required for reject/fail)"
                          value={input.reason || ""}
                          onChange={(event) => updateField(payout.id, "reason", event.target.value)}
                          maxLength={500}
                          placeholder="Optional except when rejecting or failing"
                        />
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {payout.status === "requested" ? (
                          <>
                            <Button disabled={busyId === payout.id} onClick={() => transition(payout, "approve")}>Approve</Button>
                            <Button variant="outline" disabled={busyId === payout.id} onClick={() => transition(payout, "reject")}>Reject</Button>
                          </>
                        ) : null}
                        {payout.status === "approved" ? (
                          <>
                            <Button disabled={busyId === payout.id} onClick={() => transition(payout, "processing")}>Start processing</Button>
                            <Button variant="outline" disabled={busyId === payout.id} onClick={() => transition(payout, "reject")}>Reject</Button>
                          </>
                        ) : null}
                        {payout.status === "processing" ? (
                          <>
                            <Button disabled={busyId === payout.id} onClick={() => transition(payout, "mark-paid")}>Mark paid</Button>
                            <Button variant="outline" disabled={busyId === payout.id} onClick={() => transition(payout, "fail")}>Mark failed</Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>{meta.total} payout(s)</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <span className="px-2 py-2">{page} / {Math.max(1, meta.totalPages || 1)}</span>
          <Button variant="outline" size="sm" disabled={page >= (meta.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
