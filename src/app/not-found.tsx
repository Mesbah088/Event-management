'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-24 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">404 - Page Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-600 mb-8 max-w-sm">
          The event or resource you requested could not be found. It may have expired or been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Events Directory</span>
        </Link>
      </main>

      <Footer />
    </div>
  );
}
