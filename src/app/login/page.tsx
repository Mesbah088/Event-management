'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Lock,
  Mail,
  Shield,
  Camera,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Setup modal for initial admin bootstrap
  const [showBootstrapModal, setShowBootstrapModal] = useState(false);
  const [bootstrapData, setBootstrapData] = useState({
    name: 'Super Administrator',
    email: '',
    password: '',
  });
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapMsg, setBootstrapMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid credentials or inactive account.');
        setIsLoading(false);
        return;
      }

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/scanner');
      }
    } catch (err: any) {
      setErrorMsg('Network error connecting to authentication server.');
      setIsLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setBootstrapLoading(true);
    setBootstrapMsg(null);

    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bootstrapData),
      });

      const data = await res.json();
      if (!res.ok) {
        setBootstrapMsg(data.error || 'Bootstrap failed.');
        setBootstrapLoading(false);
        return;
      }

      setBootstrapMsg('✓ Admin initialized! You can now log in.');
      setEmail(bootstrapData.email);
      setPassword(bootstrapData.password);
      setTimeout(() => setShowBootstrapModal(false), 1500);
    } catch (err) {
      setBootstrapMsg('Network error during admin initialization.');
    } finally {
      setBootstrapLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="max-w-md mx-auto px-4 sm:px-6 py-16 flex-1 w-full flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-brand-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & Admin Login</h1>
            <p className="text-xs text-slate-500 mt-1">
              Authorized gate scanners and system administrators only.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="staff@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Enter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>RBAC Session</span>
            </span>

            <button
              onClick={() => setShowBootstrapModal(true)}
              className="text-brand-600 hover:underline font-semibold"
            >
              First-Time Admin Setup?
            </button>
          </div>
        </div>
      </main>

      {/* Admin One-Time Bootstrap Modal */}
      {showBootstrapModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Shield className="w-5 h-5 text-brand-600" />
                <span>One-Time Admin Bootstrap</span>
              </h3>
              <button
                onClick={() => setShowBootstrapModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Initialize the initial Administrator account. The database strictly enforces exactly one active Admin identity.
            </p>

            {bootstrapMsg && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-semibold ${
                  bootstrapMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {bootstrapMsg}
              </div>
            )}

            <form onSubmit={handleBootstrap} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Name</label>
                <input
                  type="text"
                  required
                  value={bootstrapData.name}
                  onChange={(e) => setBootstrapData({ ...bootstrapData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@university.edu"
                  value={bootstrapData.email}
                  onChange={(e) => setBootstrapData({ ...bootstrapData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={bootstrapData.password}
                  onChange={(e) => setBootstrapData({ ...bootstrapData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBootstrapModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bootstrapLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500"
                >
                  {bootstrapLoading ? 'Initializing...' : 'Bootstrap Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
