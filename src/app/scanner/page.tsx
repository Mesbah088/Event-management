'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScannerComponent from '@/components/ScannerComponent';
import {
  Camera,
  History,
  ShieldAlert,
  Building,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';

interface ScannerEvent {
  id: string;
  slug: string;
  title: string;
  venue: string;
  startDate: string;
  gates: string[];
  defaultGate: string;
}

export default function ScannerPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ScannerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedGate, setSelectedGate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/scanner/event')
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          setSelectedEventId(data.events[0].id);
          setSelectedGate(data.events[0].defaultGate || data.events[0].gates[0] || 'Main Gate');
        } else {
          setAuthError('No events assigned to your scanner account. Please contact the Event Administrator.');
        }
      })
      .catch(() => setAuthError('Failed to load scanner events.'))
      .finally(() => setLoading(false));
  }, [router]);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-4">
        {/* Scanner Bar Navigation */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">Multi-Gate Scanner</span>
              <span className="text-[10px] text-slate-500 block -mt-0.5">Central Real-Time Verification</span>
            </div>
          </div>

          <Link
            href="/scanner/history"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-brand-600" />
            <span>My Scan Log</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading Scanner Environment...</p>
          </div>
        ) : authError ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-4">
            <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Scanner Setup Notice</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{authError}</p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Back to Home
            </Link>
          </div>
        ) : activeEvent ? (
          <div className="space-y-4">
            {/* Event Selector if multiple events assigned */}
            {events.length > 1 && (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Select Event:</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    const ev = events.find((x) => x.id === e.target.value);
                    if (ev) setSelectedGate(ev.defaultGate || ev.gates[0] || 'Main Gate');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold bg-slate-50"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Core Scanner Viewport Component */}
            <ScannerComponent
              eventId={activeEvent.id}
              eventName={activeEvent.title}
              gateId={selectedGate}
              gates={activeEvent.gates}
              onGateChange={(g) => setSelectedGate(g)}
            />
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
