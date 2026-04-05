import "./globals.css";

export const metadata = {
  title: `${process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault"} — Digital Keys & Gift Cards`,
  description:
    process.env.NEXT_PUBLIC_STORE_TAGLINE ||
    "Instant digital keys at the best prices",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
