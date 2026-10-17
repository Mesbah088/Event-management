'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building,
  School,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function RegisterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const eventSlug = params.id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    attendeeType: 'NITER_STUDENT',
    batch: '',
    studentId: '',
    department: 'CSE',
    institution: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isNiter = formData.attendeeType === 'NITER_STUDENT' || formData.attendeeType === 'NITER_ALUMNI';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validations
    if (!formData.name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('Valid email address is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Contact / Phone number is required.');
      return;
    }

    if (isNiter) {
      if (!formData.studentId.trim()) {
        setErrorMsg('NITER Student ID is required.');
        return;
      }
      if (!formData.batch.trim()) {
        setErrorMsg('Batch is required (e.g. 11th Batch, 12th Batch).');
        return;
      }
      if (!formData.department.trim()) {
        setErrorMsg('Department is required.');
        return;
      }
    } else {
      if (!formData.institution.trim()) {
        setErrorMsg('University or Institution name is required.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/events/${eventSlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          attendeeType: formData.attendeeType,
          batch: isNiter ? formData.batch.trim() : '',
          studentId: isNiter ? formData.studentId.trim() : '',
          department: formData.department.trim(),
          institution: !isNiter ? formData.institution.trim() : 'NITER',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to complete registration. Please check your information.');
        setIsLoading(false);
        return;
      }

      // Store ticket in sessionStorage for immediate offline display & backup
      if (typeof window !== 'undefined' && data.ticket) {
        sessionStorage.setItem(`ticket_${data.ticket.ticketRef}`, JSON.stringify(data.ticket));
      }

      // Redirect to ticket success view
      router.push(`/events/${eventSlug}/success?ticketRef=${encodeURIComponent(data.ticket.ticketRef)}`);
    } catch (err: any) {
      setErrorMsg('Network error. Unable to reach event registration service.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 mb-6 flex items-center space-x-2">
          <Link href="/" className="hover:text-brand-600 transition-colors">
            Events
          </Link>
          <span>/</span>
          <Link href={`/events/${eventSlug}`} className="hover:text-brand-600 transition-colors">
            Event Details
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Registration</span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Event Registration Form
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              সঠিক তথ্য দিয়ে ফর্মটি পূরণ করুন। ফর্ম সাবমিট করার সাথে সাথে আপনার ভেরিফাইড QR Code টিকেট তৈরি হয়ে যাবে।
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Full Name (পূর্ণ নাম) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Abdullah Al Masud"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Address (ইমেইল) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="abdullah@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                আপনার কিউআর টিকেট এই ইমেইল ঠিকানায় পাঠানো হবে।
              </span>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Contact Number (মোবাইল নম্বর) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 017XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            {/* Attendee Type Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Attendee Category (অংশগ্রহণকারীর ধরণ) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={formData.attendeeType}
                  onChange={(e) => setFormData({ ...formData, attendeeType: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                >
                  <option value="NITER_STUDENT">🎓 NITER Current Student (নাইটার রানিং শিক্ষার্থী)</option>
                  <option value="NITER_ALUMNI">🎓 NITER Alumni (নাইটার প্রাক্তন শিক্ষার্থী / অ্যালামনাই)</option>
                  <option value="EXTERNAL_STUDENT">🏛️ External University Student (অন্যান্য বিশ্ববিদ্যালয়)</option>
                  <option value="GUEST">👤 Guest / Other Institution (অতিথি / অন্যান্য)</option>
                </select>
              </div>
            </div>

            {/* CONDITIONAL SECTION: NITER STUDENT / ALUMNI */}
            {isNiter ? (
              <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100 space-y-4 animate-in fade-in duration-200">
                <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider block">
                  NITER Academic Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Student ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 2022-CSE-045"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono bg-white"
                      />
                    </div>
                  </div>

                  {/* Batch */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Batch (ব্যাচ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 11th Batch / 12th"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Department (বিভাগ) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                    >
                      <option value="CSE">Computer Science & Engineering (CSE)</option>
                      <option value="TE">Textile Engineering (TE)</option>
                      <option value="EEE">Electrical & Electronic Engineering (EEE)</option>
                      <option value="FDAE">Fashion Design & Apparel Engineering (FDAE)</option>
                      <option value="IPE">Industrial & Production Engineering (IPE)</option>
                      <option value="Other">Other Department</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* CONDITIONAL SECTION: EXTERNAL UNIVERSITY / GUEST */
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in duration-200">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Institution / University Details
                </span>

                {/* University Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    University / College / Institution Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. University of Dhaka, BUET, JU, DIU, etc."
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </div>

                {/* Department / Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Department / Subject (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dept. of Physics / Software Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Secure QR Ticket...</span>
                  </div>
                ) : (
                  <>
                    <span>Submit & Get QR Ticket (সাবমিট ও কিউআর কোড নিন)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Guaranteed Unique Single-Entry QR Verification</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
