'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MailWarning,
  Calendar,
  RotateCcw,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface DashboardMetrics {
  totalRegistrations: number;
  checkedInCount: number;
  cancelledCount: number;
  remainingAttendees: number;
  checkInRate: number;
  duplicateScanAttempts: number;
  invalidScanAttempts: number;
  failedEmails: number;
  activeEventsCount: number;
}

interface RecentScan {
  id: string;
  scannerName: string;
  gateId: string;
  outcome: string;
  ticketRef: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    fetch('/api/admin/dashboard')
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setMetrics(data.metrics);
        setRecentScans(data.recentScans || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 15 seconds for live event operations
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time multi-gate attendance analytics and security monitoring.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Registrations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered</span>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics?.totalRegistrations ?? '...'}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Across {metrics?.activeEventsCount ?? 0} published events
          </span>
        </div>

        {/* Checked-In Count */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Admitted At Gates</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {metrics?.checkedInCount ?? '...'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics?.checkInRate ?? 0}% Check-in Rate ({metrics?.remainingAttendees ?? 0} Remaining)
          </span>
        </div>

        {/* Duplicate Scan Attempts (Crucial Security Invariant Metric) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Duplicates Blocked</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600">
            {metrics?.duplicateScanAttempts ?? '...'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Race-condition & reuse rejections
          </span>
        </div>

        {/* Failed Emails / Invalid Scans */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Email Delivery Issues</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MailWarning className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {metrics?.failedEmails ?? '...'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Tickets requiring email retry
          </span>
        </div>
      </div>

      {/* Live Gate Scans Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-extrabold text-slate-900 text-base">Live Gate Activity Stream</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Latest 10 Central Invocations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Ticket Ref</th>
                <th className="px-6 py-3.5">Gate</th>
                <th className="px-6 py-3.5">Scanner Staff</th>
                <th className="px-6 py-3.5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No scans registered yet. Scanners will stream entries here in real time.
                  </td>
                </tr>
              ) : (
                recentScans.map((s) => {
                  const isValid = s.outcome === 'VALID';
                  const isDuplicate = s.outcome === 'DUPLICATE';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 text-slate-500 font-mono">
                        {new Date(s.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                        {s.ticketRef}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 font-medium">
                        {s.gateId}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        {s.scannerName}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isValid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDuplicate
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {s.outcome}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
