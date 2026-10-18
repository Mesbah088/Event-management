'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Camera,
  LogOut,
  User,
  Heart,
  BookOpen,
  Menu,
  X,
  Sparkles,
  Calendar,
  Ticket,
} from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch(() => setSession({ authenticated: false, user: null }));
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false, user: null });
    setMobileMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-md shadow-brand-500/10 group-hover:scale-105 transition-transform border border-slate-200 shrink-0 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nis-logo.png"
              alt="NITER Islamic Society (NIS)"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg leading-none">
                NITER
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 hidden xs:inline-block">
                ২০২৬
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-brand-600 block font-semibold truncate max-w-[150px] sm:max-w-none mt-0.5">
              Islamic Conference
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Visible on md and up) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <Link
            href="/"
            className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-colors ${
              pathname === '/'
                ? 'text-brand-600 bg-brand-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Events
          </Link>

          <Link
            href="/#sponsors"
            className="px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors"
          >
            স্পন্সর
          </Link>

          <Link
            href="/#quiz-section"
            className="px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors flex items-center space-x-1.5"
          >
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>কুইজ বই</span>
          </Link>

          <Link
            href="/#donation-section"
            className="px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center space-x-1.5"
          >
            <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600 shrink-0" />
            <span>অনুদান</span>
          </Link>

          {session?.authenticated && (
            <Link
              href="/scanner"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname.startsWith('/scanner')
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Scanner</span>
            </Link>
          )}

          {session?.authenticated && session.user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname.startsWith('/admin')
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Admin</span>
            </Link>
          )}

          {/* User / Login state */}
          {session?.authenticated ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {session.user?.name}
              </span>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all shrink-0 active:scale-95"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Staff Login</span>
            </Link>
          )}
        </nav>

        {/* Mobile Header Right: Quick Action & Hamburger Toggle */}
        <div className="flex items-center space-x-2 md:hidden">
          <Link
            href="/#donation-section"
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center space-x-1 active:scale-95 transition-transform"
          >
            <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 shrink-0" />
            <span>অনুদান</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown / Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 shadow-2xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-3 duration-200">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-amber-50 to-purple-50 border border-slate-200/80 mb-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-extrabold text-slate-900 block">
                NITER ISLAMIC Conference 2026
              </span>
              <span className="text-[10px] text-slate-600 block">
                ৯ নভেম্বর ২০২৬ • নিটার কেন্দ্রীয় মাঠ
              </span>
            </div>
            <Link
              href="/events/niter-islamic-conference-2026/register"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-extrabold shadow-sm active:scale-95 transition-transform shrink-0"
            >
              রেজিস্ট্রেশন
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors ${
                pathname === '/' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
              <span>ইভেন্ট হোম</span>
            </Link>

            <Link
              href="/#quiz-section"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center space-x-2 active:scale-95 transition-transform"
            >
              <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
              <span>কুইজ ও বই</span>
            </Link>

            <Link
              href="/#sponsors"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/60 flex items-center space-x-2 active:scale-95 transition-transform"
            >
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>স্পন্সরবৃন্দ</span>
            </Link>

            <Link
              href="/#donation-section"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center space-x-2 active:scale-95 transition-transform"
            >
              <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600 shrink-0" />
              <span>স্বেচ্ছাসেবী অনুদান</span>
            </Link>
          </div>

          {session?.authenticated && (
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <Link
                href="/scanner"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full p-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 flex items-center space-x-2"
              >
                <Camera className="w-4 h-4 text-brand-600 shrink-0" />
                <span>QR Scanner (গেট স্ক্যানার)</span>
              </Link>

              {session.user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full p-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>
          )}

          {/* Auth Button */}
          <div className="pt-2">
            {session?.authenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Log Out ({session.user?.name})</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-transform"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Staff & Scanner Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
