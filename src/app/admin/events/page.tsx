'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Plus,
  MapPin,
  Users,
  Edit,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';

interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  organizer: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  capacity: number;
  registeredCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  gates: string[];
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    organizer: 'Computer Science & Engineering Society',
    venue: '',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16),
    registrationOpenAt: new Date(Date.now() - 86400000).toISOString().slice(0, 16),
    registrationCloseAt: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 16),
    capacity: 500,
    status: 'PUBLISHED',
    gates: 'Main Gate, East Gate, VIP Entrance',
  });

  const fetchEvents = () => {
    setLoading(true);
    fetch('/api/admin/events')
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setEvents(data.events || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        gates: formData.gates.split(',').map((g) => g.trim()).filter(Boolean),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        registrationOpenAt: new Date(formData.registrationOpenAt).toISOString(),
        registrationCloseAt: new Date(formData.registrationCloseAt).toISOString(),
      };

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create event.');
        setCreateLoading(false);
        return;
      }

      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      setCreateError('Network error creating event.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusToggle = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchEvents();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure capacities, entry gates, registration schedules, and venue logistics.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Event Title</th>
                <th className="px-6 py-4">Venue & Gates</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading event list...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No events configured yet. Click Create New Event to start.
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const isPublished = evt.status === 'PUBLISHED';
                  const capacityPct = Math.round((evt.registeredCount / evt.capacity) * 100);

                  return (
                    <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block text-sm">{evt.title}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">/{evt.slug}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-slate-700 block font-medium">{evt.venue}</span>
                        <span className="text-[10px] text-brand-600 font-semibold block">
                          Gates: {evt.gates.join(', ')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        <span>{new Date(evt.startDate).toLocaleDateString()}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">
                            {evt.registeredCount} / {evt.capacity}
                          </span>
                          <span className="text-[10px] text-slate-400">({capacityPct}%)</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleStatusToggle(evt.id, evt.status)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-[11px] hover:bg-slate-100"
                        >
                          {isPublished ? 'Close Registration' : 'Open Registration'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <span>Create New Event</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Robotics Symposium 2026"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    setFormData({ ...formData, title, slug });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Venue Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Campus Auditorium"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entry Gates (Comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="Gate A, Gate B, VIP Entrance"
                  value={formData.gates}
                  onChange={(e) => setFormData({ ...formData, gates: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  placeholder="Event details, guidelines, schedule..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/20"
                >
                  {createLoading ? 'Creating...' : 'Save & Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
