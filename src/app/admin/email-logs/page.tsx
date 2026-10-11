'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface EmailLogItem {
  id: string;
  ticketRef: string;
  recipientEmail: string;
  provider: string;
  providerMessageId: string;
  status: 'SUCCESS' | 'FAILED' | 'QUEUED';
  attempts: number;
  lastAttemptAt: string;
  sanitizedError?: string;
}

export default function AdminEmailLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '50',
      status: statusFilter,
    });

    fetch(`/api/admin/email-logs?${params.toString()}`)
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
  }, [page, statusFilter, router]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transactional Email Delivery Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tracking Resend API delivery status, message IDs, and failure recovery. ({total} Total Records)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Email Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS (Delivered)</option>
            <option value="FAILED">FAILED (Requires Retry)</option>
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
                <th className="px-6 py-4">Last Attempt</th>
                <th className="px-6 py-4">Recipient Email</th>
                <th className="px-6 py-4">Ticket Ref</th>
                <th className="px-6 py-4">Provider / Message ID</th>
                <th className="px-6 py-4">Attempts</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading email logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No email logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {new Date(log.lastAttemptAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        {log.recipientEmail}
                      </td>

                      <td className="px-6 py-4 font-mono font-semibold text-brand-600">
                        {log.ticketRef}
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                        {log.provider} • {log.providerMessageId}
                      </td>

                      <td className="px-6 py-4 text-slate-700 font-semibold">
                        {log.attempts}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {log.sanitizedError || 'Delivered successfully.'}
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
              Page {page} of {totalPages}
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
