import { Suspense } from "react";
import { SearchContent } from "@/app/student/search/page";

/**
 * Function PublicSearchPage.
 * @returns {*} The operation result.
 */
export default function PublicSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
