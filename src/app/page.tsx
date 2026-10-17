import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, MapPin, Users, ArrowRight, ShieldCheck, QrCode, Sparkles } from 'lucide-react';
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

    return events.map(e => ({
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Event Entry Management</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Instant Registrations.<br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Zero-Race QR Verification.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            The university event management platform engineered for 500–2,000 attendees.
            Featuring zero-knowledge cryptographic tickets and single-checkin atomic guarantees.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict Atomic Check-in Invariant</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <QrCode className="w-4 h-4 text-brand-400" />
              <span>Multi-Gate Mobile Camera Scanner</span>
            </div>
          </div>
        </div>
      </section>

      {/* Active Events Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Active & Upcoming Events</h2>
            <p className="text-sm text-slate-500 mt-1">Register online to receive your personalized digital QR ticket.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg self-start">
            {events.length} {events.length === 1 ? 'Event Available' : 'Events Available'}
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

              const isSoldOut = evt.remainingSeats <= 0;

              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                        {evt.organizer}
                      </span>
                      {isSoldOut ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                          Capacity Full
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {evt.remainingSeats} Seats Left
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors mb-2">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 mb-6 flex-1">
                      {evt.description}
                    </p>

                    <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{startDateFormatted}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Capacity: {evt.capacity} Attendees</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/events/${evt.slug}`}
                      className="text-xs font-semibold text-slate-700 hover:text-brand-600 transition-colors"
                    >
                      View Details
                    </Link>

                    <Link
                      href={isSoldOut ? '#' : `/events/${evt.slug}/register`}
                      className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSoldOut
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 active:scale-95'
                      }`}
                    >
                      <span>{isSoldOut ? 'Sold Out' : 'Register Now'}</span>
                      {!isSoldOut && <ArrowRight className="w-3.5 h-3.5" />}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
