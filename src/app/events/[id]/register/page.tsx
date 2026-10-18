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
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Tag,
  CreditCard,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  ArrowRight,
} from 'lucide-react';

export default function RegisterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const eventSlug = params.id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    attendeeType: 'EXTERNAL_STUDENT' as 'EXTERNAL_STUDENT' | 'NITER_STUDENT',
    institution: '',
    department: '',
    batch: '',
    studentId: '',
    // Payment details for External University Students
    trxId: '',
    senderPhone: '',
    paymentAmount: '499',
    paymentMethod: 'bKash' as 'bKash' | 'Nagad',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [redirectToast, setRedirectToast] = useState<string | null>(null);

  const isExternal = formData.attendeeType === 'EXTERNAL_STUDENT';

  // Payment number & reference
  const bkashNumber = process.env.NEXT_PUBLIC_BKASH_NUMBER || '01518793129';
  const nagadNumber = process.env.NEXT_PUBLIC_NAGAD_NUMBER || '01518793129';
  const displayFormattedNumber = '01518-793129';
  const activeNumber = formData.paymentMethod === 'bKash' ? bkashNumber : nagadNumber;

  // Format reference part (replaces spaces with underscore)
  const formatRefPart = (val: string, fallback: string) => {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    return trimmed.replace(/\s+/g, '_');
  };

  const computedReference = `${formatRefPart(formData.name, 'Name')}_${formatRefPart(isExternal ? formData.institution : 'NITER', 'Versity')}_${formatRefPart(formData.batch, 'Batch')}`;

  const handleCopyNumber = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(activeNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 3000);
    }
  };

  const handleCopyRef = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(computedReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 3000);
    }
  };

  // Direct Mobile App Launch / Deep link Redirect
  const handleDirectAppRedirect = (method: 'bKash' | 'Nagad') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 3000);
    }

    const appName = method === 'bKash' ? 'bKash' : 'Nagad';
    setRedirectToast(`নম্বর (${displayFormattedNumber}) কপি হয়েছে! ${appName} অ্যাপে ৳৪৯৯ Send Money করার সময় রেফারেন্সে "${computedReference}" দিয়ে TrxID সংগ্রহ করুন।`);
    setTimeout(() => setRedirectToast(null), 6000);

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (method === 'bKash') {
        if (isAndroid) {
          window.location.href = 'intent://#Intent;package=com.bKash.customerapp;scheme=bkash;end';
          setTimeout(() => {
            window.location.href = 'bkash://';
          }, 300);
        } else if (isIOS) {
          window.location.href = 'bkash://';
        }
      } else {
        if (isAndroid) {
          window.location.href = 'intent://#Intent;package=com.konasl.nagad;scheme=nagad;end';
          setTimeout(() => {
            window.location.href = 'nagad://';
          }, 300);
        } else if (isIOS) {
          window.location.href = 'nagad://';
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Common validations
    if (!formData.name.trim()) {
      setErrorMsg('আপনার পূর্ণ নাম প্রদান করা আবশ্যক।');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('সঠিক ইমেইল ঠিকানা প্রদান করা আবশ্যক।');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('মোবাইল যোগাযোগ নম্বর প্রদান করা আবশ্যক।');
      return;
    }

    if (isExternal) {
      if (!formData.institution.trim()) {
        setErrorMsg('আপনার বিশ্ববিদ্যালয়ের নাম (University name) প্রদান করা আবশ্যক।');
        return;
      }
      if (!formData.department.trim()) {
        setErrorMsg('আপনার অধ্যয়নরত বিভাগ / ডিপার্টমেন্ট প্রদান করা আবশ্যক।');
        return;
      }
      if (!formData.batch.trim()) {
        setErrorMsg('আপনার ব্যাচ বা শিক্ষাবর্ষ প্রদান করা আবশ্যক।');
        return;
      }
      if (!formData.trxId.trim()) {
        setErrorMsg('বহিরাগত বিশ্ববিদ্যালয়ের জন্য রেজিস্ট্রেশন ফি ৪৯৯ টাকা পরিশোধ ও Transaction ID (TrxID) প্রদান করা বাধ্যতামূলক।');
        return;
      }
      if (!formData.senderPhone.trim()) {
        setErrorMsg('যে নম্বর থেকে বিকাশ বা নগদ করা হয়েছে সেই প্রেরক নম্বরটি লিখুন।');
        return;
      }
      const amountNum = Number(formData.paymentAmount);
      if (!formData.paymentAmount || isNaN(amountNum) || amountNum < 499) {
        setErrorMsg('বহিরাগত বিশ্ববিদ্যালয়ের শিক্ষার্থীদের জন্য নির্ধারিত রেজিস্ট্রেশন ফি ৪৯৯ টাকা পরিশোধ করা বাধ্যতামূলক।');
        return;
      }
    } else {
      if (!formData.studentId.trim()) {
        setErrorMsg('নিটার স্টুডেন্ট আইডি প্রদান করা আবশ্যক।');
        return;
      }
      if (!formData.batch.trim()) {
        setErrorMsg('আপনার নিটার ব্যাচ উল্লেখ করুন (e.g. 11th, 12th, 13th)।');
        return;
      }
      if (!formData.department.trim()) {
        setErrorMsg('ডিপার্টমেন্ট নির্বাচন করুন।');
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
          institution: isExternal ? formData.institution.trim() : 'NITER',
          department: formData.department.trim(),
          batch: formData.batch.trim(),
          studentId: !isExternal ? formData.studentId.trim() : '',
          trxId: isExternal ? formData.trxId.trim().toUpperCase() : '',
          senderPhone: isExternal ? formData.senderPhone.trim() : '',
          paymentAmount: isExternal ? formData.paymentAmount.trim() : '',
          paymentMethod: isExternal ? formData.paymentMethod : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি। তথ্য সঠিক আছে কি না যাচাই করুন।');
        setIsLoading(false);
        return;
      }

      // Store ticket in sessionStorage for instant display & backup
      if (typeof window !== 'undefined' && data.ticket) {
        sessionStorage.setItem(`ticket_${data.ticket.ticketRef}`, JSON.stringify(data.ticket));
      }

      // Redirect to ticket success view
      router.push(`/events/${eventSlug}/success?ticketRef=${encodeURIComponent(data.ticket.ticketRef)}`);
    } catch (err: any) {
      setErrorMsg('নেটওয়ার্ক সমস্যা। দয়া করে আবার চেষ্টা করুন।');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 mb-6 flex items-center space-x-2">
          <Link href="/" className="hover:text-brand-600 transition-colors">
            Events
          </Link>
          <span>/</span>
          <Link href={`/events/${eventSlug}`} className="hover:text-brand-600 transition-colors">
            NITER ISLAMIC Conference
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Registration</span>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-xl border border-slate-200">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-bold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>NITER ISLAMIC Conference 2026 • ৯ নভেম্বর ২০২৬</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isExternal
                ? 'বহিরাগত বিশ্ববিদ্যালয় শিক্ষার্থী রেজিস্ট্রেশন'
                : 'নিটার শিক্ষার্থী রেজিস্ট্রেশন'}
            </h1>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              {isExternal
                ? 'অন্যান্য বিশ্ববিদ্যালয়ের শিক্ষার্থীদের রেজিস্ট্রেশন ফি ৪৯৯ টাকা (বাধ্যতামূলক)। বিকাশ বা নগদে পেমেন্ট করে TrxID দিয়ে ফর্মটি পূরণ করুন।'
                : 'নিটারের নিয়মিত শিক্ষার্থীদের জন্য ফ্রি রেজিস্ট্রেশন ফর্ম। আপনার একাডেমিক তথ্য দিন।'}
            </p>

            {/* Category Switcher Tabs */}
            <div className="mt-5 p-1 bg-slate-100 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row max-w-lg mx-auto border border-slate-200 gap-1 sm:gap-0">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    attendeeType: 'EXTERNAL_STUDENT',
                    paymentAmount: '499',
                  }))
                }
                className={`flex-1 py-2.5 px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  isExternal
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span>External Univ (অন্যান্য)</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ml-1 ${
                  isExternal ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}>
                  ৳৪৯৯
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    attendeeType: 'NITER_STUDENT',
                    paymentAmount: '',
                    trxId: '',
                    senderPhone: '',
                  }))
                }
                className={`flex-1 py-2.5 px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  !isExternal
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span>NITER Student (নিটার)</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 ${
                  !isExternal ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  ফ্রি
                </span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Full Name (আপনার পূর্ণ নাম) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Abdullah / Sakib Al Hasan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* University Name (External) */}
            {isExternal && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  University / Institution Name (বিশ্ববিদ্যালয়ের নাম) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka University / Jahangirnagar University / RUET"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Department & Batch Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Department (বিভাগ / ডিপার্টমেন্ট) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE, EEE, BBA, Pharmacy"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Batch / Session (ব্যাচ / সেশন) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isExternal ? 'e.g. 2021-22 / 13th' : 'e.g. 12th Batch'}
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Student ID for NITER */}
            {!isExternal && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  NITER Student ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2022-CSE-045"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Mobile Contact & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Email Address (ইমেইল ঠিকানা) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* EXTERNAL UNIVERSITY PAYMENT & TRXID PROCESS SECTION           */}
            {/* ============================================================== */}
            {isExternal && (
              <div className="mt-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-xl border border-emerald-500/40 space-y-4 animate-in fade-in">
                {/* Section Header */}
                <div className="border-b border-emerald-800/60 pb-3">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>পেমেন্ট প্রসেস ও TrxID ভেরিফিকেশন (Payment Required)</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    অন্যান্য বিশ্ববিদ্যালয়ের শিক্ষার্থীদের রেজিস্ট্রেশন ফি ৪৯৯ টাকা। বিকাশ বা নগদ নম্বরে Send Money করে TrxID ও প্রেরক নম্বর নিচে প্রদান করুন। পেমেন্ট না করলে রেজিস্ট্রেশন সম্পন্ন হবে না।
                  </p>
                </div>

                {/* Prominent Fee Badge */}
                <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-slate-900 border border-amber-400/50 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                        নির্ধারিত রেজিস্ট্রেশন ফি
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">
                      বহিরাগত শিক্ষার্থীদের জন্য ফি পরিশোধ বাধ্যতামূলক
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-amber-300 tracking-tight">৳৪৯৯</span>
                    <span className="text-[10px] text-amber-200/80 block font-semibold">ফিক্সড রেজি: ফি</span>
                  </div>
                </div>

                {/* Direct App Launch / Method Selector Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, paymentMethod: 'bKash' });
                      handleDirectAppRedirect('bKash');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      formData.paymentMethod === 'bKash'
                        ? 'bg-[#E2136E]/20 border-[#E2136E] ring-2 ring-[#E2136E]/50'
                        : 'bg-slate-900 border-slate-700 hover:border-[#E2136E]/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#E2136E] flex items-center justify-center text-white shrink-0 font-extrabold text-xs">
                        <svg viewBox="0 0 100 100" className="w-5 h-5 fill-white">
                          <path d="M48.2 26.5L34.1 63.8l20.4-7.4 12.5-29.9z" />
                          <path d="M14.7 32.2l20.8 14.3-1.4 3.7-19.4-18z" opacity="0.9" />
                          <path d="M85.3 46.2l-22.1-5.7 3.8 9.3 18.3-3.6z" opacity="0.9" />
                          <path d="M43.9 66.8l-8.6 15.7 13.9-9.2z" opacity="0.8" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">bKash (বিকাশ)</span>
                        <span className="text-[10px] text-slate-300 block">Send Money ৳499</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, paymentMethod: 'Nagad' });
                      handleDirectAppRedirect('Nagad');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      formData.paymentMethod === 'Nagad'
                        ? 'bg-[#F7941D]/20 border-[#F7941D] ring-2 ring-[#F7941D]/50'
                        : 'bg-slate-900 border-slate-700 hover:border-[#F7941D]/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F7941D] to-[#ED1C24] flex items-center justify-center text-white shrink-0 font-extrabold text-xs">
                        <svg viewBox="0 0 100 100" className="w-5 h-5 fill-white">
                          <path d="M50 15c-11 15-22 30-22 43 0 13 10 24 22 24s22-11 22-24c0-13-11-28-22-43zm0 55c-6 0-11-5-11-12 0-8 6-17 11-25 5 8 11 17 11 25 0 7-5 12-11 12z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Nagad (নগদ)</span>
                        <span className="text-[10px] text-slate-300 block">Send Money ৳499</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                </div>

                {/* Redirect Toast */}
                {redirectToast && (
                  <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between">
                    <span>{redirectToast}</span>
                    <button type="button" onClick={() => setRedirectToast(null)} className="underline text-[11px] ml-2">
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Number Box */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {formData.paymentMethod === 'bKash' ? 'bKash Personal (Send Money)' : 'Nagad Personal (Send Money)'}
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-extrabold text-white tracking-wider block">
                      {displayFormattedNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 shadow-md active:scale-95 transition-transform shrink-0"
                  >
                    {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNumber ? 'কপি হয়েছে' : 'নম্বর কপি'}</span>
                  </button>
                </div>

                {/* Auto Reference Box */}
                <div className="p-3.5 bg-emerald-950/90 rounded-2xl border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>রেফারেন্স কোড (Name_Versity_Batch)</span>
                    </span>
                    <span className="text-[10px] text-emerald-300 hidden sm:inline">রেফারেন্স ফিল্ডে এটি দিন</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-emerald-500/30">
                    <span className="text-sm font-mono font-bold text-emerald-200 truncate">
                      {computedReference}
                    </span>

                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center space-x-1 shrink-0 active:scale-95 transition-transform"
                    >
                      {copiedRef ? <Check className="w-3 h-3 text-emerald-200" /> : <Copy className="w-3 h-3 text-emerald-200" />}
                      <span>{copiedRef ? 'কপি হয়েছে' : 'কপি রেফারেন্স'}</span>
                    </button>
                  </div>
                </div>

                {/* Payment Input Fields: TrxID, Sender Phone, Amount */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-emerald-300 mb-1 uppercase tracking-wider">
                      Transaction ID (TrxID) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BKT98A76X1 (টাকা পাঠানোর পর বিকাশ/নগদের SMS-এ পাওয়া যাবে)"
                      value={formData.trxId}
                      onChange={(e) => setFormData({ ...formData, trxId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-sm text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        প্রেরক নম্বর (Sender Number) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন"
                        value={formData.senderPhone}
                        onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        টাকার পরিমাণ (Amount ৳) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          readOnly
                          value={formData.paymentAmount || '499'}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/50 text-sm text-amber-300 font-mono font-bold focus:outline-none cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                          ফিক্সড ৳৪৯৯
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invariant Rule Banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                রেজিস্ট্রেশন সম্পন্ন হলে অবিলম্বে আপনার কিউআর কোড টিকিট স্ক্রিনে প্রদর্শিত হবে এবং ইমেইলে সংরক্ষিত হবে। ইভেন্টের প্রবেশদ্বারে কিউআর কোডটি স্ক্যান করে প্রবেশ করতে হবে।
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>ভেরিফাই ও টিকেট তৈরি হচ্ছে...</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {isExternal
                        ? '৳৪৯৯ পেমেন্ট ও রেজিস্ট্রেশন কনফার্ম করুন (Get QR Ticket)'
                        : 'রেজিস্ট্রেশন নিশ্চিত করুন (Get QR Ticket)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Event Sponsors Trust Bar */}
        <div className="mt-8 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
            সম্মানিত অফিসিয়াল স্পন্সরবৃন্দ (Official Event Sponsors)
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-90 hover:opacity-100 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/zain-mahal.png" alt="Zainmahal" className="h-6 sm:h-7 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/kholzis-treasure.png" alt="Kholzi's Treasure" className="h-7 sm:h-8 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/shilpaholic.png" alt="Shilpaholic" className="h-7 sm:h-8 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/chumuk.png" alt="Chumuk" className="h-8 sm:h-9 object-contain" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
