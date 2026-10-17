import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DonationSection from '@/components/DonationSection';
import SponsorSection from '@/components/SponsorSection';
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Ticket,
  Building,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { getDb } from '@/lib/db/mongodb';
import { Event } from '@/types';

export const dynamic = 'force-dynamic';

async function getPublishedEvents() {
  try {
    const db = await getDb();
    const events = await db
      .collection<Event>('events')
      .find({ status: { $in: ['PUBLISHED', 'CLOSED'] } })
      .sort({ startDate: 1 })
      .toArray();

    return events.map((e) => ({
      id: e._id!.toString(),
      slug: e.slug,
      title: e.title,
      description: e.description,
      organizer: e.organizer,
      venue: e.venue,
      startDate: e.startDate.toISOString(),
      capacity: e.capacity,
      registeredCount: e.registeredCount || 0,
      remainingSeats: Math.max(0, e.capacity - (e.registeredCount || 0)),
      status: e.status,
    }));
  } catch (err) {
    console.error('Failed to query events for landing page:', err);
    return [];
  }
}

export default async function HomePage() {
  const events = await getPublishedEvents();
  const mainEvent = events.find((e) => e.slug === 'niter-islamic-conference-2026') || events[0];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      {/* ============================================================== */}
      {/* ROYAL HERO SECTION: OFFICIAL POSTER & CHIEF GUEST SHOWCASE      */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#12031c] via-[#240a38] to-[#0c0214] text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-purple-900/40">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-[32rem] h-[32rem] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[32rem] h-[32rem] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              {/* Top Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>ঐতিহাসিক দ্বীনি সম্মেলন ২০২৬ • প্রধান অতিথি ঘোষিত</span>
              </div>

              {/* Bismillah Calligraphy */}
              <div className="text-amber-200/90 text-sm sm:text-base font-serif tracking-widest">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              {/* Conference Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                NITER Islamic<br />
                <span className="bg-gradient-to-r from-amber-300 via-purple-200 to-amber-400 bg-clip-text text-transparent">
                  Conference 2026
                </span>
              </h1>

              {/* Chief Guest Highlight Box */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-purple-950/80 border-2 border-amber-400/40 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider rounded-bl-xl shadow-md">
                  CHIEF GUEST
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 font-bold text-xl shadow-inner">
                    🎙️
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90 block">
                      সম্মেলনের প্রধান আকর্ষণ ও প্রধান অতিথি
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                      শায়খ ড. মিজানুর রহমান আজহারী
                    </h2>
                    <p className="text-xs sm:text-sm text-purple-200/90 mt-1">
                      বিশিষ্ট ইসলামিক স্কলার ও গবেষক • চেয়ারম্যান, হাসানাহ ফাউন্ডেশন
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Event Metadata Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex items-center space-x-3 text-left">
                  <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">তারিখ (Date)</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">৮-৯ নভেম্বর ২০২৬</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex items-center space-x-3 text-left">
                  <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">স্থান (Venue)</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate">নাইটার কেন্দ্রীয় মাঠ</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex items-center space-x-3 text-left">
                  <Building className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">আয়োজনে (Organized By)</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">NITER Islamic Society</span>
                  </div>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/events/niter-islamic-conference-2026/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all active:scale-95 group"
                >
                  <Ticket className="w-4 h-4 text-slate-950" />
                  <span>এখনই রেজিস্ট্রেশন করুন (Register Now)</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/events/niter-islamic-conference-2026"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-purple-500/40 shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <span>বিস্তারিত ও সূচি দেখুন</span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </Link>

                <a
                  href="#donation-section"
                  className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 text-amber-300 font-semibold text-xs border border-purple-500/30 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>স্বেচ্ছাসেবী অনুদান</span>
                </a>
              </div>
            </div>

            {/* Right Column: Highlighting the Official Banner */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group max-w-sm sm:max-w-md w-full">
                {/* Glow ring under poster */}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 via-purple-600/40 to-amber-500/30 rounded-[2.5rem] blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/50 bg-slate-950 transition-transform duration-500 group-hover:scale-[1.02]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/event-banner.jpg"
                    alt="NITER Islamic Conference 2026 - Shaykh Dr. Mizanur Rahman Azhari"
                    className="w-full h-auto object-cover display-block"
                  />

                  {/* Bottom Action Ribbon */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-4 pt-8 text-center flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Official Event Poster</span>
                    </span>

                    <Link
                      href="/events/niter-islamic-conference-2026/register"
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] shadow-md transition-transform active:scale-95"
                    >
                      রেজিস্ট্রেশন করুন
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* HIGHLIGHTED SPONSORS & PARTNERS SECTION                         */}
      {/* ============================================================== */}
      <SponsorSection />

      {/* ============================================================== */}
      {/* ACTIVE EVENTS DIRECTORY                                         */}
      {/* ============================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              ইভেন্ট ডিরেক্টরি (Events Directory)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ডিজিটাল কিউআর কোড টিকেট পেতে অনলাইন রেজিস্ট্রেশন সম্পন্ন করুন।
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg self-start">
            {events.length} {events.length === 1 ? 'Event Active' : 'Events Active'}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Active Events Right Now</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Check back soon for upcoming seminars, club hackathons, and symposiums.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              <span>Staff Login & Setup</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((evt) => {
              const startDateFormatted = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Dhaka',
              }).format(new Date(evt.startDate));

              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                        {evt.organizer}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Registration Open</span>
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors mb-2">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 mb-6 flex-1 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-800">৮-৯ নভেম্বর ২০২৬ (8-9 Nov 2026)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-purple-500 shrink-0" />
                        <span>সকল শিক্ষার্থী ও সাধারণ সুধীজনের জন্য উন্মুক্ত</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/events/${evt.slug}`}
                      className="text-xs font-bold text-slate-700 hover:text-purple-700 transition-colors"
                    >
                      বিস্তারিত দেখুন
                    </Link>

                    <Link
                      href={`/events/${evt.slug}/register`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <span>রেজিস্ট্রেশন করুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Voluntary Conference Donation Section */}
        <DonationSection />
      </main>

      <Footer />
    </div>
  );
}
