import React from 'react';
import Navbar from '@/components/Navbar';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Navbar />
      <div className="flex flex-1">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        <div className="flex-1 overflow-x-hidden p-4 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
