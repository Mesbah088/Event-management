import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building,
  CheckCircle,
} from 'lucide-react';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { Event } from '@/types';

export const dynamic = 'force-dynamic';

async function getEvent(id: string) {
  try {
    const db = await getDb();
    let query: any = { slug: id };
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { slug: id }] };
    }
    const event = await db.collection<Event>('events').findOne(query);
    if (!event) return null;

    return {
      id: event._id!.toString(),
      slug: event.slug,
      title: event.title,
      description: event.description,
      organizer: event.organizer,
      venue: event.venue,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      registrationOpenAt: event.registrationOpenAt.toISOString(),
      registrationCloseAt: event.registrationCloseAt.toISOString(),
      capacity: event.capacity,
      registeredCount: event.registeredCount || 0,
      remainingSeats: Math.max(0, event.capacity - (event.registeredCount || 0)),
      status: event.status,
      gates: event.gates,
    };
  } catch (e) {
    return null;
  }
}

export default async function EventDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await getEvent(params.id);

  if (!event) {
    notFound();
  }

  const now = new Date();
  const isOpen =
    event.status === 'PUBLISHED' &&
    now >= new Date(event.registrationOpenAt) &&
    now <= new Date(event.registrationCloseAt) &&
    event.remainingSeats > 0;

  const startDateFormatted = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(event.startDate));

  const deadlineFormatted = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(event.registrationCloseAt));

  const capacityPct = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 mb-6 flex items-center space-x-2">
          <Link href="/" className="hover:text-brand-600 transition-colors">
            Events
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate">{event.title}</span>
        </div>

        {/* Hero Event Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-semibold">
              {event.organizer}
            </span>
            {isOpen ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Registration Open</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                Registration Closed
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            {event.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
            {event.description}
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-700">
              <Calendar className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-900">Event Date & Time</span>
                <span>{startDateFormatted}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-700">
              <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-900">Venue Location</span>
                <span>{event.venue}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-700">
              <Clock className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-900">Registration Deadline</span>
                <span>{deadlineFormatted}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-700">
              <Building className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-900">Configured Gates</span>
                <span>{event.gates?.join(', ') || 'Main Gate'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity & Registration Action Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Registration Capacity</span>
              <span className="text-emerald-400 font-bold">
                {event.registeredCount} / {event.capacity} Filled ({event.remainingSeats} Seats Available)
              </span>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>

          <div>
            {isOpen ? (
              <Link
                href={`/events/${event.slug}/register`}
                className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm shadow-xl shadow-brand-500/20 active:scale-95 transition-all"
              >
                <span>Register For Event</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                disabled
                className="px-8 py-4 rounded-2xl bg-slate-800 text-slate-500 font-bold text-sm cursor-not-allowed border border-slate-700"
              >
                Registration Unavailable
              </button>
            )}
          </div>
        </div>

        {/* Event Entry Guidelines */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Attendee Entry Guidelines</span>
          </h3>

          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
            <li>After registration, your personalized QR code ticket will be generated instantly and dispatched to your email.</li>
            <li>Present the digital QR code on your smartphone or a printed copy at any entrance gate scanner.</li>
            <li>
              <strong>One Check-in Invariant:</strong> Every QR code is strictly limited to 1 successful admission. Forwarding or duplicating tickets will result in immediate gate rejection.
            </li>
            <li>Please arrive at least 15 minutes prior to the scheduled start time for security scanning.</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
