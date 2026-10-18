import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, QrCode, Sparkles, Award, Gift, Coffee } from 'lucide-react';
import { SPONSORS } from '@/data/sponsors';


export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 text-xs">
      {/* ============================================================== */}
      {/* HIGHLIGHTED SPONSOR RIBBON IN FOOTER                           */}
      {/* ============================================================== */}
      <div className="bg-slate-50/90 border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider mb-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>OFFICIAL EVENT SPONSORS & PARTNERS</span>
            </span>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight">
              সম্মানিত স্পন্সর ও পার্টনার্স
            </h4>
          </div>

          {/* 4 Sponsor Cards in Footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {SPONSORS.map((sponsor) => (
              <div
                key={sponsor.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-between text-center group"
              >
                <div className="mb-2">
                  <span
                    className={`inline-flex items-center space-x-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sponsor.badgeBg} ${sponsor.badgeText}`}
                  >
                    {sponsor.tier.toLowerCase().includes('gift') ? (
                      <Gift className="w-2.5 h-2.5 shrink-0" />
                    ) : sponsor.tier.toLowerCase().includes('drink') ? (
                      <Coffee className="w-2.5 h-2.5 shrink-0" />
                    ) : (
                      <Award className="w-2.5 h-2.5 shrink-0" />
                    )}
                    <span>{sponsor.tier}</span>
                  </span>
                </div>

                <div className="h-12 sm:h-14 w-full flex items-center justify-center p-1 my-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="mt-1 pt-1.5 border-t border-slate-100 w-full">
                  <span className="text-[11px] font-bold text-slate-700 block truncate">
                    {sponsor.name}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    {sponsor.tagline}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Links & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center space-x-2.5">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm shrink-0 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nis-logo.png"
              alt="NITER Islamic Society (NIS)"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-sm">NITER Islamic Conference 2026</span>
            <span className="text-[11px] text-slate-500 block">Organized By NITER Islamic Society</span>
          </div>
        </div>

        {/* Security & Verification Invariants */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single-Checkin Guarantee</span>
          </span>
          <span className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>SHA-256 Cryptographic Tokens</span>
          </span>
          <Link href="/#sponsors" className="hover:text-purple-600 font-semibold transition-colors">
            স্পন্সরবৃন্দ
          </Link>
          <Link href="/#quiz-section" className="hover:text-amber-600 font-semibold transition-colors">
            কুইজ বই
          </Link>
          <Link href="/#donation-section" className="hover:text-emerald-600 font-semibold transition-colors">
            অনুদান
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center md:text-right text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} NITER Islamic Society. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
