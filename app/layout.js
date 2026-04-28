import './globals.css';
import { StoreProvider } from './components/StoreContext';

export const metadata = {
  title: 'KeyVault — Digital Keys & Gift Cards',
  description: 'Best prices on game keys, gift cards, and software. Instant delivery, buyer protection.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
