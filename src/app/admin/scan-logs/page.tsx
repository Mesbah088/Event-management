'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ScanLogItem {
  id: string;
  eventTitle: string;
  scannerName: string;
  gateId: string;
  ticketRef: string;
  outcome: string;
  timestamp: string;
  notes?: string;
}

export default function AdminScanLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '50',
      outcome: outcomeFilter,
    });

    fetch(`/api/admin/scan-logs?${params.toString()}`)
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, outcomeFilter, router]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Central Gate Scan Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable log of all admission attempts across gates, scanners, and devices. ({total} Total Invocations)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Outcome:</span>
          <select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold"
          >
            <option value="">All Outcomes</option>
            <option value="VALID">VALID (Admitted)</option>
            <option value="DUPLICATE">DUPLICATE (Blocked)</option>
            <option value="INVALID">INVALID (Unrecognized)</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="WRONG_EVENT">WRONG_EVENT</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          Showing 50 per page
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Ticket Ref</th>
                <th className="px-6 py-4">Gate</th>
                <th className="px-6 py-4">Scanner Staff</th>
                <th className="px-6 py-4">Outcome</th>
                <th className="px-6 py-4">Security Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading scan audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No scan events recorded matching filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isValid = log.outcome === 'VALID';
                  const isDuplicate = log.outcome === 'DUPLICATE';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {log.ticketRef}
                      </td>

                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {log.gateId}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {log.scannerName}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isValid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDuplicate
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {log.outcome}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {log.notes || (isValid ? 'Atomic check-in succeeded.' : 'Access denied.')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {totalPages} ({total} Total Scans)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
