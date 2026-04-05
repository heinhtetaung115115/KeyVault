const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-10 px-6 text-center">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          {["About", "FAQ", "Terms of Service", "Privacy Policy", "Contact"].map(
            (link) => (
              <a
                key={link}
                href="#"
                className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {link}
              </a>
            )
          )}
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          &copy; {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </p>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
          Powered by Digiseller Affiliate Program &middot; Secure payments
        </p>
      </div>
    </footer>
  );
}
