"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ShopOwnerEarningsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Canteen Earnings &amp; Payouts
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Earnings and withdrawal status from the CampusEats backend.
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <p role="status" className="text-sm text-amber-800 dark:text-amber-300">
            The backend does not yet provide a merchant ledger, payout balance, transaction history, or withdrawal endpoint. No balance or payout is shown here.
          </p>
          <Link href="/shop-owner/orders">
            <Button variant="primary">View orders</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
