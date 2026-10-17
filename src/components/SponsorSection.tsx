'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Award, HeartHandshake, Star } from 'lucide-react';

import { SPONSORS, type SponsorItem } from '@/data/sponsors';
export { SPONSORS, type SponsorItem };


export default function SponsorSection() {
  return (
    <section id="sponsors" className="w-full py-12 sm:py-16 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-emerald-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>অফিসিয়াল স্পন্সর ও পার্টনার্স</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            সম্মানিত স্পন্সর ও পৃষ্ঠপোষকবৃন্দ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
            NITER ইসলামিক কনফারেন্স ২০২৬-এর মহতী আয়োজনকে সফল ও সার্থক করতে যাদের আন্তরিক পৃষ্ঠপোষকতা ও সহযোগিতা আমাদের প্রেরণা।
          </p>
        </div>

        {/* Highlighted Sponsors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SPONSORS.map((sponsor) => (
            <div
              key={sponsor.id}
              className={`group relative rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col overflow-hidden ${sponsor.glowBorder}`}
            >
              {/* Subtle top ambient glow gradient */}
              <div
                className={`absolute top-0 inset-x-0 h-28 bg-gradient-to-b ${sponsor.shadowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
              />

              {/* Tier Badge */}
              <div className="p-4 pb-0 flex items-center justify-between">
                <span
                  className={`inline-flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${sponsor.badgeBg} ${sponsor.badgeText}`}
                >
                  <Award className="w-3 h-3 shrink-0" />
                  <span>{sponsor.tier}</span>
                </span>

                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Official Partner" />
              </div>

              {/* Logo Presentation Frame */}
              <div className="p-6 sm:p-8 flex-1 flex items-center justify-center min-h-[160px] relative">
                <div className="relative w-full h-24 sm:h-28 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-sm transition-all duration-300"
                  />
                </div>
              </div>

              {/* Bottom Caption & Tagline */}
              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 text-center">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
                  {sponsor.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {sponsor.tagline}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Sponsor Acknowledgment Banner */}
        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-purple-100">
                কনফারেন্সের স্পন্সর ও সহযোগী হতে আগ্রহী?
              </h4>
              <p className="text-[11px] text-purple-300/80">
                ইসলামিক সোসাইটির এই মহতি আয়োজনে পার্টনার হতে যোগাযোগ করুন: <span className="font-mono font-bold text-amber-300">01518-793129</span>
              </p>
            </div>
          </div>

          <a
            href="tel:01518793129"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md shrink-0 transition-transform active:scale-95 flex items-center space-x-1.5"
          >
            <Star className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
            <span>পার্টনার হতে যোগাযোগ</span>
          </a>
        </div>
      </div>
    </section>
  );
}
