"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet,
  ArrowUpRight,
  Bike,
  Star,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";
import { toast } from "sonner";

export default function RiderEarningsPage() {
  const [balance, setBalance] = useState(1450);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("+880 1911-223344");
  const [loading, setLoading] = useState(false);

  const deliveryHistory = [
    {
      id: "CE-9388",
      shop: "Dorm Bites Express",
      dropoff: "Shahidullah Hall",
      date: new Date(Date.now() - 2 * 3600000).toISOString(),
      feeEarned: 35,
      tip: 10,
    },
    {
      id: "CE-9351",
      shop: "Campus Grill & Cafe",
      dropoff: "Fazlul Huq Hall",
      date: new Date(Date.now() - 18 * 3600000).toISOString(),
      feeEarned: 45,
      tip: 15,
    },
    {
      id: "CE-9320",
      shop: "Khan's Shahi Biryani",
      dropoff: "Jagannath Hall",
      date: new Date(Date.now() - 26 * 3600000).toISOString(),
      feeEarned: 50,
      tip: 0,
    },
    {
      id: "CE-9290",
      shop: "Tea & Tiffin Corner",
      dropoff: "Curzon Library Gate",
      date: new Date(Date.now() - 44 * 3600000).toISOString(),
      feeEarned: 30,
      tip: 5,
    },
  ];

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0 || amt > balance) {
      toast.error("Please enter a valid amount within your wallet balance");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBalance((prev) => prev - amt);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      toast.success(`Withdrawal of ৳${amt} sent to bKash number ${withdrawPhone}!`);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Rider Earnings &amp; Wallet
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Real-time delivery fees and student tips credited upon verified QR handover
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-200">
              <Wallet className="h-4 w-4" />
              <span>Available Wallet Balance</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatCurrency(balance)}
            </div>
            <p className="text-[11px] text-blue-200">
              Instant payouts to personal bKash wallet with zero processing fee
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white text-blue-950 hover:bg-blue-50 rounded-xl font-bold text-xs shrink-0"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Withdraw to bKash</span>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-zinc-400">Total Trips Completed</span>
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              128 deliveries
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-zinc-400">Rider Rating</span>
            <div className="text-xl font-extrabold text-amber-500 flex items-center gap-1">
              <Star className="h-4 w-4 fill-current" />
              <span>4.9 / 5.0</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-zinc-400">Average Delivery Time</span>
            <div className="text-xl font-extrabold text-emerald-600">
              14.2 minutes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery History Table */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <History className="h-4 w-4 text-blue-600" />
              <span>Completed Delivery Earnings</span>
            </h3>
            <span className="text-xs text-zinc-400">12% Fee + Student Tips</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">Order</th>
                  <th className="py-2.5">Pickup Shop</th>
                  <th className="py-2.5">Dorm Hall</th>
                  <th className="py-2.5">Fee</th>
                  <th className="py-2.5">Tip</th>
                  <th className="py-2.5 text-right">Net Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {deliveryHistory.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      #{d.id}
                    </td>
                    <td className="py-3 text-zinc-700 dark:text-zinc-300 font-medium">{d.shop}</td>
                    <td className="py-3 text-zinc-500">{d.dropoff}</td>
                    <td className="py-3 text-zinc-700 dark:text-zinc-300">{formatCurrency(d.feeEarned)}</td>
                    <td className="py-3 text-emerald-600">
                      {d.tip > 0 ? `+${formatCurrency(d.tip)}` : "—"}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(d.feeEarned + d.tip)}
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
        title="Withdraw Delivery Earnings"
        description="Transfer your earnings instantly to your personal bKash account"
      >
        <form onSubmit={handleWithdraw} className="space-y-4 text-left">
          <Input
            label="Withdrawal Amount (BDT ৳)"
            type="number"
            placeholder={`Available: ${balance}`}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            required
          />

          <Input
            label="Recipient bKash Mobile Number"
            value={withdrawPhone}
            onChange={(e) => setWithdrawPhone(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
          >
            Confirm Withdrawal ({formatCurrency(withdrawAmount || 0)})
          </Button>
        </form>
      </Modal>
    </div>
  );
}
