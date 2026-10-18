'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { QrCode, Shield, Camera, LogOut, User as UserIcon, Heart } from 'lucide-react';

interface SessionInfo {
  authenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SCANNER';
  } | null;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(() => setSession({ authenticated: false, user: null }));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false, user: null });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-md shadow-brand-500/10 group-hover:scale-105 transition-transform border border-slate-200 shrink-0 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nis-logo.png"
              alt="NITER Islamic Society (NIS)"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-lg block leading-tight">NITER</span>
            <span className="text-xs text-brand-600 block font-semibold">Islamic Conference 2026</span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center space-x-1 sm:space-x-3">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/' ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Events
          </Link>

          <Link
            href="/#sponsors"
            className="px-3 py-2 rounded-lg text-sm font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors"
          >
            স্পন্সর (Sponsors)
          </Link>

          <Link
            href="/#donation-section"
            className="px-3 py-2 rounded-lg text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center space-x-1.5"
          >
            <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span>অনুদান (Donate)</span>
          </Link>

          {session?.authenticated && (
            <Link
              href="/scanner"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                pathname.startsWith('/scanner')
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Gate Scanner</span>
            </Link>
          )}

          {session?.authenticated && session.user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                pathname.startsWith('/admin')
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* User / Login state */}
          {session?.authenticated ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-md hidden md:inline-block">
                {session.user?.role}: {session.user?.name}
              </span>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all"
            >
              <UserIcon className="w-4 h-4" />
              <span>Staff Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
