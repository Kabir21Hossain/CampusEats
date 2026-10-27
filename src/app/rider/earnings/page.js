"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { orderService } from "@/services/order-service";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";

export default function RiderEarningsPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    orderService.listOrders().then((response) => {
      if (!active) return;
      if (response.success) {
        setOrders(response.data);
      } else {
        setError(response.error.message);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Rider Earnings &amp; Wallet
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Delivery earnings and withdrawal status from the CampusEats backend.
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <p role="status" className="text-sm text-amber-800 dark:text-amber-300">
            The backend does not yet provide a rider ledger, wallet balance, tips, or withdrawal endpoint. No earnings or payout is shown here.
          </p>
          <Link href="/rider/available-orders">
            <Button variant="primary">View available orders</Button>
          </Link>
        </CardContent>
      </Card>
      <DashboardAnalytics
        orders={orders}
        role="rider"
        viewerId={currentUser?.id}
        error={error}
      />
    </div>
  );
}
