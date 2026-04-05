"use client";

import { useStore } from "./StoreContext";

export default function Toast() {
  const { toast } = useStore();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-[var(--text-primary)] text-white rounded-[var(--radius-md)] text-[13px] font-medium z-[500] animate-toast shadow-lg flex items-center gap-2">
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {toast}
    </div>
  );
}
