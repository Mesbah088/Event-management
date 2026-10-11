'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scan,
  Plus,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  RotateCcw,
  Building,
} from 'lucide-react';

interface ScannerItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  defaultGate: string;
  scanCount: number;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminScannersPage() {
  const router = useRouter();
  const [scanners, setScanners] = useState<ScannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    password: '',
    defaultGate: 'Main Gate A',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const fetchScanners = () => {
    setLoading(true);
    fetch('/api/admin/scanners')
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setScanners(data.scanners || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScanners();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/scanners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create scanner.');
        setCreateLoading(false);
        return;
      }

      setShowCreateModal(false);
      setCreateData({ name: '', email: '', password: '', defaultGate: 'Main Gate A' });
      fetchScanners();
    } catch (e) {
      setCreateError('Network error creating scanner.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (scannerId: string, currentStatus: boolean) => {
    await fetch(`/api/admin/scanners/${scannerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    fetchScanners();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetId || newPassword.length < 8) return;
    setResetLoading(true);

    try {
      await fetch(`/api/admin/scanners/${resetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      setResetId(null);
      setNewPassword('');
      fetchScanners();
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scanner Staff Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision volunteer accounts, assign gates, and revoke access instantly.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Scanner Account</span>
        </button>
      </div>

      {/* Scanners Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Assigned Gate</th>
                <th className="px-6 py-4">Total Scans</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading scanner accounts...
                  </td>
                </tr>
              ) : scanners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No scanner accounts provisioned yet. Add your gate volunteer accounts here.
                  </td>
                </tr>
              ) : (
                scanners.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block text-sm">{s.name}</span>
                      <span className="text-[11px] text-slate-500 block">{s.email}</span>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {s.defaultGate || 'Main Gate'}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {s.scanCount} Scans
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          s.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(s.id, s.isActive)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${
                          s.isActive
                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => setResetId(s.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 hover:bg-slate-100 text-slate-700"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SCANNER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center space-x-2">
              <Scan className="w-5 h-5 text-brand-600" />
              <span>Create Scanner Account</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Scanners can only scan tickets and see their own personal scan history.
            </p>

            {createError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs mb-3">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Volunteer Gate Staff"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Login Email</label>
                <input
                  type="email"
                  required
                  placeholder="gate1@university.edu"
                  value={createData.email}
                  onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={createData.password}
                  onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Gate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Gate A"
                  value={createData.defaultGate}
                  onChange={(e) => setCreateData({ ...createData, defaultGate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-brand-600" />
              <span>Reset Scanner Password</span>
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetId(null);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800"
                >
                  {resetLoading ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
