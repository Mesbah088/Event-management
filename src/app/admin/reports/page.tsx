'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface ReportSummary {
  total: number;
  checkedIn: number;
  cancelled: number;
  pending: number;
  checkInPercentage: number;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    fetch('/api/admin/reports')
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setSummary(data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [router]);

  const handleDownloadCsv = () => {
    window.location.href = '/api/admin/reports?format=csv';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Attendance Reports & CSV Export
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Download comprehensive attendee rosters, verification audit timestamps, and gate statistics.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Attendance CSV</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Expected</span>
            <Users className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{summary?.total ?? 0}</div>
          <span className="text-xs text-slate-400 mt-1 block">Registered attendees</span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase">Total Checked In</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{summary?.checkedIn ?? 0}</div>
          <span className="text-xs text-slate-500 mt-1 block">
            {summary?.checkInPercentage ?? 0}% verified admission rate
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Entry</span>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-700">{summary?.pending ?? 0}</div>
          <span className="text-xs text-slate-400 mt-1 block">Active issued passes</span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase">Cancelled</span>
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600">{summary?.cancelled ?? 0}</div>
          <span className="text-xs text-slate-400 mt-1 block">Voided registrations</span>
        </div>
      </div>

      {/* CSV Report Specifications */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-brand-600" />
          <span>Attendance CSV Schema & Security Protections</span>
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The generated export is designed for post-event audit and university administration. Fields include:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono">
            • Ticket Reference
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono">
            • Attendee Name
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono">
            • Attendee Email
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono">
            • Admission Status
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono">
            • Gate Verified At
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono">
            • Check-in Timestamp
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-500">
          <strong>Security Note:</strong> All CSV fields are strictly sanitized to prevent CSV Formula Injection (`=`, `+`, `-`, `@`) when opened in Microsoft Excel or Google Sheets. Zero-knowledge ticket tokens are strictly omitted from the export.
        </div>
      </div>
    </div>
  );
}
