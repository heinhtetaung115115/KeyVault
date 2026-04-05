"use client";

export function ProductSkeleton() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="aspect-[4/3] bg-[var(--bg-elevated)] animate-pulse" />
      <div className="p-3.5 pb-4 space-y-2.5">
        <div className="h-3.5 bg-[var(--bg-elevated)] rounded w-full animate-pulse" />
        <div className="h-3.5 bg-[var(--bg-elevated)] rounded w-3/4 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-[var(--bg-elevated)] rounded w-12 animate-pulse" />
          <div className="h-3 bg-[var(--bg-elevated)] rounded w-16 animate-pulse" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-[var(--bg-elevated)] rounded w-16 animate-pulse" />
          <div className="h-[34px] bg-[var(--bg-elevated)] rounded-[var(--radius-md)] w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
