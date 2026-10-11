import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NITER ISLAMIC Conference 2026 — Entry Management System',
  description: 'Official Registration, QR Ticket Issuance, and Multi-Gate Admission Verification for NITER ISLAMIC Conference 2026.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-brand-500 selection:text-white flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
