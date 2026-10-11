'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  History,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Camera,
} from 'lucide-react';

interface ScanItem {
  id: string;
  ticketRef: string;
  gateId: string;
  outcome: 'VALID' | 'DUPLICATE' | 'INVALID' | 'CANCELLED' | 'WRONG_EVENT';
  timestamp: string;
  notes?: string;
}

export default function ScannerHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    fetch('/api/scanner/history?limit=50')
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setLogs(data.logs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <Link
              href="/scanner"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">My Scan History</span>
              <span className="text-[10px] text-slate-500 block -mt-0.5">Scans Performed by Your Account</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              title="Refresh"
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <Link
              href="/scanner"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Back to Camera</span>
            </Link>
          </div>
        </div>

        {/* Scan List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 font-semibold">
              Loading recent gate activity...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No tickets scanned yet during this session.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => {
                const dateFormatted = new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }).format(new Date(log.timestamp));

                const isValid = log.outcome === 'VALID';
                const isDuplicate = log.outcome === 'DUPLICATE';

                return (
                  <div
                    key={log.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isValid ? (
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{log.ticketRef}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isValid
                                ? 'bg-emerald-50 text-emerald-700'
                                : isDuplicate
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Gate: {log.gateId} • {dateFormatted}
                        </span>
                      </div>
                    </div>

                    {log.notes && (
                      <span className="text-[10px] text-slate-400 max-w-[120px] truncate text-right">
                        {log.notes}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
