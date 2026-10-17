'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DonationSection from '@/components/DonationSection';
import {
  CheckCircle,
  Download,
  Printer,
  Calendar,
  MapPin,
  ShieldAlert,
  ArrowLeft,
  Mail,
  Copy,
  Check,
} from 'lucide-react';

interface TicketData {
  ticketRef: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  attendeeType?: string;
  batch?: string;
  studentId?: string;
  department?: string;
  institution?: string;
  qrDataUrl: string;
  eventTitle: string;
  venue: string;
  startDateFormatted: string;
  organizer: string;
}

function SuccessContent({ eventSlug }: { eventSlug: string }) {
  const searchParams = useSearchParams();
  const ticketRefParam = searchParams.get('ticketRef');
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [copied, setCopied] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ticketRefParam) {
      const stored = sessionStorage.getItem(`ticket_${ticketRefParam}`);
      if (stored) {
        try {
          setTicket(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, [ticketRefParam]);

  const handleDownload = () => {
    if (!ticket?.qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `ticket-${ticket.ticketRef}.png`;
    link.href = ticket.qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const copyRef = () => {
    if (!ticket?.ticketRef) return;
    navigator.clipboard.writeText(ticket.ticketRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Registration Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto">
            Your ticket has been generated and a confirmation email dispatched to your inbox.
          </p>
        </div>

        {/* Printable Ticket Card */}
        <div
          ref={printableRef}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-slate-200 overflow-hidden relative mb-6"
        >
          {/* Top Brand Banner */}
          <div className="text-center pb-6 border-b border-slate-200">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Official Entry Pass
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {ticket?.eventTitle || 'University Campus Event'}
            </h2>
            <p className="text-xs text-brand-600 font-semibold mt-0.5">
              {ticket?.organizer || 'Organizing Committee'}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-inner mb-4">
              {ticket?.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ticket.qrDataUrl}
                  alt="QR Ticket"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                  Loading QR Code...
                </div>
              )}
            </div>

            {/* Ticket Reference Code */}
            <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-mono font-bold">REF:</span>
              <span className="text-sm font-mono font-extrabold text-slate-900 tracking-wider">
                {ticket?.ticketRef || ticketRefParam || 'UE-2026-PENDING'}
              </span>
              <button
                onClick={copyRef}
                title="Copy reference code"
                className="text-slate-500 hover:text-slate-800 p-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Attendee Details */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs sm:text-sm">
            {ticket?.attendeeName && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Attendee:</span>
                <span className="font-bold text-slate-900 text-right">{ticket.attendeeName}</span>
              </div>
            )}
            {ticket?.attendeeType && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-xs text-right">
                  {ticket.attendeeType === 'NITER_STUDENT'
                    ? '🎓 NITER Student'
                    : ticket.attendeeType === 'NITER_ALUMNI'
                    ? '🎓 NITER Alumni'
                    : ticket.attendeeType === 'EXTERNAL_STUDENT'
                    ? '🏛️ External University'
                    : '👤 Guest Attendee'}
                </span>
              </div>
            )}
            {ticket?.studentId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Student ID:</span>
                <span className="font-mono font-bold text-slate-900 text-right">{ticket.studentId}</span>
              </div>
            )}
            {ticket?.batch && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Batch:</span>
                <span className="font-semibold text-slate-800 text-right">{ticket.batch}</span>
              </div>
            )}
            {ticket?.department && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-800 text-right">{ticket.department}</span>
              </div>
            )}
            {ticket?.institution && ticket.institution !== 'NITER' && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Institution:</span>
                <span className="font-semibold text-slate-800 text-right">{ticket.institution}</span>
              </div>
            )}
            {ticket?.attendeePhone && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Contact:</span>
                <span className="font-mono font-semibold text-slate-800 text-right">{ticket.attendeePhone}</span>
              </div>
            )}
            {ticket?.attendeeEmail && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-semibold text-slate-700 text-right">{ticket.attendeeEmail}</span>
              </div>
            )}
            {ticket?.startDateFormatted && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Date & Time:</span>
                <span className="font-semibold text-slate-700 text-right">{ticket.startDateFormatted}</span>
              </div>
            )}
            {ticket?.venue && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Venue:</span>
                <span className="font-semibold text-slate-700 text-right">{ticket.venue}</span>
              </div>
            )}
          </div>

          {/* Single-Entry Invariant Alert */}
          <div className="mt-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-xs text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Strict Single Check-in Rule:</strong>
              This QR code can be admitted exactly once. Do not share or post screenshots publicly.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Ticket Image</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ticket</span>
          </button>
        </div>

        {/* Voluntary Conference Donation Section */}
        <DonationSection />

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Events Directory</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RegistrationSuccessPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
          </div>
          <Footer />
        </div>
      }
    >
      <SuccessContent eventSlug={params.id} />
    </Suspense>
  );
}
