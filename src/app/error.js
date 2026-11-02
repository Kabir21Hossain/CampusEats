"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Function Error.
 * @returns {*} The operation result.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Runtime error caught:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
        Something went wrong
      </h2>
      <p className="text-xs text-zinc-500 max-w-sm mb-6">
        An unexpected error occurred while processing this campus request.
      </p>
      <Button variant="primary" size="md" onClick={() => reset()} className="rounded-xl">
        <RotateCcw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}
