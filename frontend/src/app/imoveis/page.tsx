import { Suspense } from "react";
import ImoveisContent from "./ImoveisContent";

export default function ImoveisPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-surface-muted animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <ImoveisContent />
    </Suspense>
  );
}
