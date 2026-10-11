import React from 'react';
import { ShieldCheck, Lock, QrCode } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <QrCode className="w-4 h-4 text-brand-600" />
          <span className="font-semibold text-slate-800">NITER Islamic Conference 2026</span>
          <span>— Official Entry Management</span>
        </div>

        <div className="flex items-center space-x-6 text-slate-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single-Checkin Guarantee</span>
          </span>
          <span className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>SHA-256 Zero Knowledge Tokens</span>
          </span>
        </div>

        <div>
          <span>© {new Date().getFullYear()} NITER Islamic Society. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
