'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scan,
  History,
  Mail,
  FileSpreadsheet,
  Camera,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Registrations', href: '/admin/registrations', icon: Users },
  { label: 'Scanner Staff', href: '/admin/scanners', icon: Scan },
  { label: 'Scan Audit Trail', href: '/admin/scan-logs', icon: History },
  { label: 'Email Logs', href: '/admin/email-logs', icon: Mail },
  { label: 'Reports & Export', href: '/admin/reports', icon: FileSpreadsheet },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col p-4 border-r border-slate-800">
      <div className="mb-6 px-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Management Console</h2>
      </div>

      <nav className="space-y-1.5 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800">
        <Link
          href="/scanner"
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-slate-800 transition-colors"
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>Launch Scanner Mode</span>
        </Link>
      </div>
    </aside>
  );
}
