'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Ban,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface RegistrationItem {
  id: string;
  ticketRef: string;
  eventTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  attendeeType?: string;
  batch?: string;
  studentId?: string;
  department?: string;
  institution?: string;
  status: 'ISSUED' | 'USED' | 'CANCELLED';
  registeredAt: string;
  checkedInAt?: string;
  gateId?: string;
  emailStatus: string;
  cancellationReason?: string;
}

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals & Action States
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchRegistrations = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      search,
      status: statusFilter,
    });

    fetch(`/api/admin/registrations?${params.toString()}`)
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setRegistrations(data.registrations || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRegistrations();
  }, [page, statusFilter, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRegistrations();
  };

  const handleCancelTicket = async () => {
    if (!cancellingId || !cancelReason.trim()) return;

    try {
      const res = await fetch(`/api/admin/registrations/${cancellingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMsg({ text: data.error || 'Failed to cancel ticket.', isError: true });
      } else {
        setActionMsg({ text: 'Ticket successfully cancelled.' });
        fetchRegistrations();
      }
    } catch (e) {
      setActionMsg({ text: 'Network error cancelling ticket.', isError: true });
    } finally {
      setCancellingId(null);
      setCancelReason('');
      setTimeout(() => setActionMsg(null), 3500);
    }
  };

  const handleResendEmail = async (regId: string) => {
    setResendingId(regId);
    try {
      const res = await fetch(`/api/admin/registrations/${regId}/resend-ticket`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ text: data.message || 'Ticket email resent!' });
      } else {
        setActionMsg({ text: data.error || 'Resend failed.', isError: true });
      }
    } catch (e) {
      setActionMsg({ text: 'Network error resending email.', isError: true });
    } finally {
      setResendingId(null);
      setTimeout(() => setActionMsg(null), 3500);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/admin/reports?format=csv';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Attendee Registrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, search, cancel tickets, and re-dispatch confirmation passes. ({total} Total Records)
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Attendance CSV</span>
        </button>
      </div>

      {/* Action Toast Alert */}
      {actionMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
            actionMsg.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {actionMsg.isError ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by attendee name, email, or ticket reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="ISSUED">ISSUED (Pending Entry)</option>
            <option value="USED">USED (Checked In)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPage(1);
              fetchRegistrations();
            }}
            title="Reset Filters"
            className="p-2 border border-slate-300 rounded-xl hover:bg-slate-100 text-slate-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Ticket Ref</th>
                <th className="px-6 py-4">Attendee</th>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Gate / Entry Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading registrations...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No registrations matched your filter.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => {
                  const isUsed = reg.status === 'USED';
                  const isCancelled = reg.status === 'CANCELLED';

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {reg.ticketRef}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block text-sm">{reg.attendeeName}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {reg.attendeeType && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {reg.attendeeType === 'NITER_STUDENT'
                                ? 'NITER Student'
                                : reg.attendeeType === 'NITER_ALUMNI'
                                ? 'NITER Alumni'
                                : reg.attendeeType === 'EXTERNAL_STUDENT'
                                ? 'External'
                                : 'Guest'}
                            </span>
                          )}
                          {reg.studentId && (
                            <span className="text-[11px] font-mono text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                              ID: {reg.studentId}
                            </span>
                          )}
                          {reg.batch && (
                            <span className="text-[11px] text-slate-600">
                              ({reg.batch})
                            </span>
                          )}
                        </div>
                        {reg.institution && reg.institution !== 'NITER' && (
                          <span className="text-[11px] text-indigo-700 block font-medium mt-0.5">
                            🏛️ {reg.institution}
                          </span>
                        )}
                        {reg.department && (
                          <span className="text-[11px] text-slate-500 block">
                            Dept: {reg.department}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 block mt-0.5">{reg.attendeeEmail}</span>
                        {reg.attendeePhone && (
                          <span className="text-[11px] text-slate-600 font-mono block">📞 {reg.attendeePhone}</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {reg.eventTitle}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isUsed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isCancelled
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {isUsed && reg.checkedInAt ? (
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {reg.gateId || 'Main Gate'}
                            </span>
                            <span className="text-[10px]">
                              {new Date(reg.checkedInAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ) : isCancelled ? (
                          <span className="text-rose-600 text-[11px] italic">
                            Cancelled: {reg.cancellationReason || 'Admin Action'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not checked in yet</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right space-x-1.5">
                        {!isCancelled && (
                          <button
                            onClick={() => handleResendEmail(reg.id)}
                            disabled={resendingId === reg.id}
                            title="Resend Ticket Email"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors"
                          >
                            <Mail className={`w-3.5 h-3.5 ${resendingId === reg.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}

                        {!isCancelled && (
                          <button
                            onClick={() => setCancellingId(reg.id)}
                            title="Cancel Ticket"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
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
              Page {page} of {totalPages} ({total} Attendees)
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

      {/* CANCELLATION MODAL */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center space-x-2">
              <Ban className="w-5 h-5 text-rose-600" />
              <span>Cancel Attendee Ticket</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              This action is permanent and audited. The QR code will be rejected at all gates.
            </p>

            <textarea
              required
              rows={3}
              placeholder="Reason for cancellation (e.g. Duplicate registration, requested by attendee)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs mb-4 focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setCancellingId(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100"
              >
                Keep Ticket
              </button>
              <button
                onClick={handleCancelTicket}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
