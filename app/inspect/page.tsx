import { Suspense } from "react";
import { InspectPageClient } from "./InspectPageClient";

export default function InspectPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <InspectPageClient />
    </Suspense>
  );
}
