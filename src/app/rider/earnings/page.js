"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RiderEarningsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
    </div>
  );
}
