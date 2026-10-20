"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";
import { toast } from "sonner";

export default function ShopOwnerEarningsPage() {
  const [balance, setBalance] = useState(48950);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bKash Merchant");
  const [withdrawing, setWithdrawing] = useState(false);

  const transactions = [
    {
      id: "TXN-8812",
      orderId: "CE-9388",
      date: new Date(Date.now() - 3 * 3600000).toISOString(),
      grossTotal: 250,
      shopNet: 212.5,
      status: "settled",
    },
    {
      id: "TXN-8809",
      orderId: "CE-9365",
      date: new Date(Date.now() - 24 * 3600000).toISOString(),
      grossTotal: 680,
      shopNet: 578.0,
      status: "settled",
    },
    {
      id: "TXN-8801",
      orderId: "CE-9344",
      date: new Date(Date.now() - 48 * 3600000).toISOString(),
      grossTotal: 420,
      shopNet: 357.0,
      status: "settled",
    },
    {
      id: "TXN-8789",
      orderId: "CE-9310",
      date: new Date(Date.now() - 72 * 3600000).toISOString(),
      grossTotal: 890,
      shopNet: 756.5,
      status: "settled",
    },
  ];

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0 || amt > balance) {
      toast.error("Please enter a valid amount within your balance");
      return;
    }

    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setBalance((prev) => prev - amt);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      toast.success(`Withdrawal request of ৳${amt} submitted to ${withdrawMethod}!`);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Canteen Earnings &amp; Escrow Ledger
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Automatic 85% revenue settlement upon verified student delivery handovers
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              <span>Available Settled Balance</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatCurrency(balance)}
            </div>
            <p className="text-[11px] text-emerald-300">
              Platform split: 85% Canteen • 12% Rider • 3% Platform Fee
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl font-bold text-xs shrink-0"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Request Withdrawal</span>
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History Table */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-600" />
              <span>Recent Escrow Settlements</span>
            </h3>
            <span className="text-xs text-zinc-400">All amounts in BDT (৳)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">Txn ID</th>
                  <th className="py-2.5">Order</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Gross Total</th>
                  <th className="py-2.5">Shop Net (85%)</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                      {t.id}
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      #{t.orderId}
                    </td>
                    <td className="py-3 text-zinc-500">{formatDate(t.date)}</td>
                    <td className="py-3 text-zinc-500">{formatCurrency(t.grossTotal)}</td>
                    <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(t.shopNet)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge variant="default" size="sm" className="text-[10px]">
                        Settled
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Disburse Canteen Earnings"
        description="Transfer your settled escrow balance to your merchant account"
      >
        <form onSubmit={handleWithdraw} className="space-y-4 text-left">
          <Input
            label="Withdrawal Amount (BDT ৳)"
            type="number"
            placeholder={`Max: ${balance}`}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Disbursement Method
            </label>
            <select
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100"
            >
              <option value="bKash Merchant">bKash Merchant (+880 1819-876543)</option>
              <option value="Nagad Merchant">Nagad Merchant Wallet</option>
              <option value="Campus Bank Account">Dhaka University Sonali Bank Branch</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={withdrawing}
            className="w-full rounded-xl font-bold"
          >
            Confirm Withdrawal Request
          </Button>
        </form>
      </Modal>
    </div>
  );
}
