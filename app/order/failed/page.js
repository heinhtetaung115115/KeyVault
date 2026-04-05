"use client";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault";

export default function FailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6">
      <div className="max-w-md w-full text-center">
        {/* Failed icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--danger-soft)] flex items-center justify-center">
          <svg
            width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Payment was not completed
        </h1>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          Your payment was cancelled or could not be processed.
          No charges have been made. You can try again or choose a different payment method.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="/"
            className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-semibold flex items-center justify-center hover:opacity-90 transition-all"
          >
            Back to store
          </a>
          <a
            href="mailto:support@your-domain.com"
            className="h-11 px-6 rounded-[var(--radius-md)] border border-[var(--border)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-all"
          >
            Contact support
          </a>
        </div>

        <p className="text-[11px] text-[var(--text-tertiary)] mt-8">
          {STORE_NAME} &middot; Powered by Digiseller
        </p>
      </div>
    </div>
  );
}
