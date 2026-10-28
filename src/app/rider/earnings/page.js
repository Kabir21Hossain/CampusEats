"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { orderService, walletService } from "@/services";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function RiderEarningsPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ordersResponse, walletResponse, ledgerResponse, payoutResponse] =
      await Promise.all([
        orderService.listOrders(),
        walletService.getMyWallet(),
        walletService.listMyLedger({ limit: 20 }),
        walletService.listMyPayouts({ limit: 20 }),
      ]);

    if (ordersResponse.success) {
      setOrders(ordersResponse.data);
      setOrdersError("");
    } else {
      setOrdersError(ordersResponse.error.message);
    }

    const financialFailure = [
      walletResponse,
      ledgerResponse,
      payoutResponse,
    ].find((response) => !response.success);
    if (financialFailure) {
      setError(financialFailure.error.message || "Unable to load wallet activity.");
    } else {
      setWallet(walletResponse.data);
      setLedger(ledgerResponse.data);
      setPayouts(payoutResponse.data);
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const requestPayout = async (event) => {
    event.preventDefault();
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
      toast.error("Enter a valid payout amount in BDT.");
      return;
    }
    const [whole, fraction = ""] = amount.split(".");
    const amountPaisa =
      Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    if (!Number.isSafeInteger(amountPaisa) || amountPaisa < 20_000) {
      toast.error("The minimum payout is BDT 200.00.");
      return;
    }

    setSubmitting(true);
    const result = await walletService.requestRiderPayout(
      amountPaisa,
      `rider-payout-${globalThis.crypto.randomUUID()}`
    );
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error.message || "Unable to request payout.");
      return;
    }
    setAmount("");
    toast.success("Payout request submitted.");
    await loadData();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Rider Earnings &amp; Wallet
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review your posted earnings, reservations, and payout progress.
        </p>
      </header>

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={loadData}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Available", wallet?.availablePaisa],
          ["Pending", wallet?.pendingPaisa],
          ["Reserved", wallet?.reservedPaisa],
        ].map(([label, paisa]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500">{label} balance</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "—" : formatCurrency((paisa || 0) / 100)}
              </p>
              <p className="text-xs text-zinc-400">BDT</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="font-semibold">Request a payout</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Minimum request: BDT 200. Approved payouts are processed by an administrator.
            </p>
          </div>
          <form onSubmit={requestPayout} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Amount (BDT)"
              type="number"
              min="200"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="200.00"
              required
              disabled={submitting}
            />
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? "Submitting..." : "Request payout"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Payout history</h2>
        {payouts.length ? payouts.map((payout) => (
          <Card key={payout.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{formatCurrency((payout.amountPaisa || 0) / 100)}</p>
                <p className="text-xs text-zinc-500">{formatDate(payout.createdAt)}</p>
                {payout.resolutionReason ? (
                  <p className="mt-1 text-xs text-zinc-500">Note: {payout.resolutionReason}</p>
                ) : null}
              </div>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold capitalize">
                {payout.status}
              </span>
            </CardContent>
          </Card>
        )) : (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-zinc-500">
            {loading ? "Loading payout history..." : "No payout requests yet."}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent ledger activity</h2>
        {ledger.length ? (
          <Card>
            <CardContent className="divide-y p-0">
              {ledger.map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{entry.description || entry.type.replaceAll("_", " ")}</p>
                    <p className="text-xs text-zinc-500">
                      {entry.balanceType?.replace("Paisa", "")} · {formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <span className={entry.amountPaisa >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                    {entry.amountPaisa >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(entry.amountPaisa || 0) / 100)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-zinc-500">
            {loading ? "Loading ledger..." : "No ledger activity yet."}
          </p>
        )}
      </section>

      <Link href="/rider/available-orders">
        <Button variant="outline">View available orders</Button>
      </Link>
      <DashboardAnalytics
        orders={orders}
        role="rider"
        viewerId={currentUser?.id}
        error={ordersError}
      />
    </div>
  );
}
