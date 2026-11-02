import Link from "next/link";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Function NotFound.
 * @returns {*} The operation result.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee]">
      <div className="h-16 w-16 rounded-3xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold mb-4">
        <UtensilsCrossed className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold mb-2">Page Not Found on Campus</h2>
      <p className="text-xs text-zinc-500 max-w-sm mb-6">
        The dining menu, hall delivery route, or dashboard you are looking for does not exist.
      </p>
      <Link href="/">
        <Button variant="primary" size="md" className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to CampusEats Home
        </Button>
      </Link>
    </div>
  );
}
