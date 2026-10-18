'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Copy,
  Check,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  ExternalLink,
  PhoneCall,
} from 'lucide-react';

interface DonationSectionProps {
  defaultOpenForm?: boolean;
  initialName?: string;
  initialUniversity?: string;
  initialBatch?: string;
}

export default function DonationSection({
  defaultOpenForm = false,
  initialName = '',
  initialUniversity = '',
  initialBatch = '',
}: DonationSectionProps) {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [showSubmitForm, setShowSubmitForm] = useState(defaultOpenForm);
  const [redirectToast, setRedirectToast] = useState<string | null>(null);

  // Reference Code & Form State: Name, Versity, Batch
  const [donorName, setDonorName] = useState(initialName);
  const [donorUniversity, setDonorUniversity] = useState(initialUniversity);
  const [donorBatch, setDonorBatch] = useState(initialBatch);
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial props when loaded asynchronously (e.g. from ticket sessionStorage)
  useEffect(() => {
    if (initialName && !donorName) setDonorName(initialName);
    if (initialUniversity && !donorUniversity) setDonorUniversity(initialUniversity);
    if (initialBatch && !donorBatch) setDonorBatch(initialBatch);
  }, [initialName, initialUniversity, initialBatch]);

  // bKash & Nagad numbers (01518-793129)
  const bkashNumber = process.env.NEXT_PUBLIC_BKASH_NUMBER || '01518793129';
  const nagadNumber = process.env.NEXT_PUBLIC_NAGAD_NUMBER || '01518793129';
  const displayFormattedNumber = '01518-793129';

  const activeNumber = selectedMethod === 'bkash' ? bkashNumber : nagadNumber;

  // Format reference parts (replace internal spaces with underscore)
  const formatRefPart = (val: string, fallback: string) => {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    return trimmed.replace(/\s+/g, '_');
  };

  const hasEnteredRefInfo = Boolean(
    donorName.trim() || donorUniversity.trim() || donorBatch.trim()
  );

  const computedReference = hasEnteredRefInfo
    ? `${formatRefPart(donorName, 'Name')}_${formatRefPart(donorUniversity, 'Versity')}_${formatRefPart(donorBatch, 'Batch')}`
    : 'Name_Versity_Batch';

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
  const handleDirectAppRedirect = (method: 'bkash' | 'nagad') => {
    // 1. Automatically copy number to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 3000);
    }

    const appName = method === 'bkash' ? 'bKash' : 'Nagad';
    setRedirectToast(`নম্বর (${displayFormattedNumber}) কপি হয়েছে! ${appName} অ্যাপে Send Money করার সময় রেফারেন্সে "${computedReference}" ব্যবহার করুন।`);
    setTimeout(() => setRedirectToast(null), 6000);

    // 2. Deep link trigger for mobile apps
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (method === 'bkash') {
        if (isAndroid) {
          window.location.href = 'intent://#Intent;package=com.bKash.customerapp;scheme=bkash;end';
          setTimeout(() => {
            window.location.href = 'bkash://';
          }, 300);
        } else if (isIOS) {
          window.location.href = 'bkash://';
        }
      } else if (method === 'nagad') {
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

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক টাকার পরিমাণ উল্লেখ করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: donorName.trim() || undefined,
          donorUniversity: donorUniversity.trim() || undefined,
          donorBatch: donorBatch.trim() || undefined,
          donorPhone: donorPhone.trim() || undefined,
          amount: Number(amount),
          trxId: trxId.trim() || undefined,
          paymentMethod: selectedMethod === 'bkash' ? 'bKash' : 'Nagad',
          referenceCode: computedReference,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit donation info.');
        setIsSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      setIsSubmitting(false);
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <section id="donation-section" className="w-full my-6 sm:my-8">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-2xl border border-emerald-500/30 p-3.5 sm:p-8 md:p-10">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Header & Hadith Badge */}
          <div className="text-center mb-5 sm:mb-8">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs font-semibold mb-2.5 sm:mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>সাদাকাহ জারিয়াহ • দ্বীনি কাজে অংশগ্রহণ</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              কনফারেন্স আয়োজনে স্বেচ্ছাসেবী অনুদান
            </h2>

            {/* Quranic Verse */}
            <div className="bg-emerald-900/40 border border-emerald-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 my-3 text-emerald-100 text-xs sm:text-sm italic leading-relaxed text-center">
              &ldquo;যারা আল্লাহর পথে তাদের সম্পদ ব্যয় করে, তাদের উপমা একটি শস্যবীজের ন্যায়, যা থেকে সাতটি শীষ উৎপন্ন হয় এবং প্রতিটি শীষে থাকে একশত দানা...&rdquo;
              <span className="block mt-1 font-semibold text-emerald-300 not-italic text-[11px] sm:text-xs">
                — সূরা আল-বাকারা, আয়াত: ২৬১
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              NITER ইসলামিক কনফারেন্স ২০২৬-এর আয়োজনকে সুন্দর ও সার্থক করতে এবং স্কলারদের আপ্যায়ন, শিক্ষার্থীদের তাবাররুক ও সামগ্রিক ব্যবস্থাপনা নির্বাহে আপনার আন্তরিক হাদিয়া সাদরে গৃহীত হবে।
              <strong className="text-emerald-300 block mt-1 font-bold">
                কোনো নির্দিষ্ট পরিমাণ নেই—আপনার সাধ্য অনুযায়ী যে কোনো পরিমাণ স্বেচ্ছাসেবী অনুদান পাঠাতে পারেন।
              </strong>
            </p>
          </div>

          {/* Direct App Redirect / Method Selector Cards */}
          <div className="mb-5 sm:mb-6">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400 block text-center mb-2.5">
              সরাসরি অ্যাপে রিডাইরেক্ট করুন (Direct Mobile App Launch)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
              {/* bKash Direct Button Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMethod('bkash');
                  handleDirectAppRedirect('bkash');
                }}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 shadow-md ${
                  selectedMethod === 'bkash'
                    ? 'bg-gradient-to-r from-[#E2136E]/20 to-[#E2136E]/30 border-[#E2136E] ring-2 ring-[#E2136E]/50'
                    : 'bg-slate-900/80 border-slate-700 hover:border-[#E2136E]/60'
                }`}
              >
                <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#E2136E] flex items-center justify-center text-white shrink-0 shadow-md font-extrabold text-base">
                    <svg viewBox="0 0 100 100" className="w-6 h-6 sm:w-8 sm:h-8 fill-white">
                      <path d="M48.2 26.5L34.1 63.8l20.4-7.4 12.5-29.9z" />
                      <path d="M14.7 32.2l20.8 14.3-1.4 3.7-19.4-18z" opacity="0.9" />
                      <path d="M85.3 46.2l-22.1-5.7 3.8 9.3 18.3-3.6z" opacity="0.9" />
                      <path d="M43.9 66.8l-8.6 15.7 13.9-9.2z" opacity="0.8" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-base font-extrabold text-white block group-hover:text-[#E2136E] transition-colors truncate">
                      bKash (বিকাশ)
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-300 block truncate">
                      ক্লিক করলেই বিকাশ অ্যাপ খুলবে
                    </span>
                  </div>
                </div>

                <div className="px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-[#E2136E] text-white text-[10px] sm:text-[11px] font-bold flex items-center space-x-1 shrink-0 ml-2 shadow-sm">
                  <span>Open App</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>

              {/* Nagad Direct Button Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMethod('nagad');
                  handleDirectAppRedirect('nagad');
                }}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 shadow-md ${
                  selectedMethod === 'nagad'
                    ? 'bg-gradient-to-r from-[#F7941D]/20 to-[#ED1C24]/30 border-[#F7941D] ring-2 ring-[#F7941D]/50'
                    : 'bg-slate-900/80 border-slate-700 hover:border-[#F7941D]/60'
                }`}
              >
                <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-[#F7941D] to-[#ED1C24] flex items-center justify-center text-white shrink-0 shadow-md font-extrabold text-base">
                    <svg viewBox="0 0 100 100" className="w-6 h-6 sm:w-8 sm:h-8 fill-white">
                      <path d="M50 15c-11 15-22 30-22 43 0 13 10 24 22 24s22-11 22-24c0-13-11-28-22-43zm0 55c-6 0-11-5-11-12 0-8 6-17 11-25 5 8 11 17 11 25 0 7-5 12-11 12z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-base font-extrabold text-white block group-hover:text-[#F7941D] transition-colors truncate">
                      Nagad (নগদ)
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-300 block truncate">
                      ক্লিক করলেই নগদ অ্যাপ খুলবে
                    </span>
                  </div>
                </div>

                <div className="px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#F7941D] to-[#ED1C24] text-white text-[10px] sm:text-[11px] font-bold flex items-center space-x-1 shrink-0 ml-2 shadow-sm">
                  <span>Open App</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>
            </div>
          </div>

          {/* Toast Notification when app launch / copy triggered */}
          {redirectToast && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-600 border border-emerald-400 text-white text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>{redirectToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setRedirectToast(null)}
                className="text-white/80 hover:text-white text-[11px] underline ml-2 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Account Number & Reference Card */}
          <div className="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-700/80 mb-5 sm:mb-6 shadow-xl space-y-3.5">
            {/* bKash / Nagad Number Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 bg-slate-800/80 rounded-xl sm:rounded-2xl border border-slate-700">
              <div className="text-center sm:text-left">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  {selectedMethod === 'bkash' ? 'bKash Personal (Send Money)' : 'Nagad Personal (Send Money)'}
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-wider block">
                  {displayFormattedNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-transform active:scale-95 shadow-md shadow-emerald-600/30 shrink-0"
              >
                {copiedNumber ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>নম্বর কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>নম্বর কপি করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Reference Box with Name, Versity & Batch */}
            <div className="p-3 sm:p-5 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 rounded-xl sm:rounded-2xl border border-emerald-500/40 shadow-inner space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-emerald-800/50 pb-2.5">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>রেফারেন্স কোড: Name_Versity_Batch</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-200/90 block mt-0.5">
                    বিকাশ বা নগদে Send Money করার সময় রেফারেন্সে দিন
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-300 bg-emerald-900/70 px-2 py-0.5 rounded-lg border border-emerald-500/30 shrink-0 font-medium self-start sm:self-auto font-mono">
                  [Name]_[Versity]_[Batch]
                </div>
              </div>

              {/* 3 Interactive Quick Fields for Name, Versity, Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                <div>
                  <label className="block text-[10px] sm:text-[11px] text-slate-300 font-semibold mb-1">
                    ১. আপনার নাম (Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sakib"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-sm sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] text-slate-300 font-semibold mb-1">
                    ২. প্রতিষ্ঠান / ভার্সিটি (Versity)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NITER / DU"
                    value={donorUniversity}
                    onChange={(e) => setDonorUniversity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-sm sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] text-slate-300 font-semibold mb-1">
                    ৩. ব্যাচ (Batch)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 13"
                    value={donorBatch}
                    onChange={(e) => setDonorBatch(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-sm sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Dynamic Reference Output & Copy Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-slate-950/80 rounded-xl border border-emerald-500/40 mt-1">
                <div className="text-left w-full sm:w-auto min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    আপনার তৈরি হওয়া রেফারেন্স কোড:
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm sm:text-lg font-bold font-mono text-emerald-300 tracking-wide bg-emerald-950/90 px-2.5 py-1 rounded-lg border border-emerald-500/40 break-all">
                      {computedReference}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-transform active:scale-95 shadow-md shadow-emerald-600/30 shrink-0"
                >
                  {copiedRef ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>রেফারেন্স কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>কপি রেফারেন্স</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] sm:text-xs text-slate-300 text-center">
              <span>💡 বাটন চাপলে বিকাশ/নগদ অ্যাপ চালু হবে এবং নম্বর অটো কপি হয়ে যাবে।</span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <a
                href={selectedMethod === 'bkash' ? 'tel:*247#' : 'tel:*167#'}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline inline-flex items-center space-x-1"
              >
                <PhoneCall className="w-3 h-3" />
                <span>বা ডায়াল করুন {selectedMethod === 'bkash' ? '*247#' : '*167#'}</span>
              </a>
            </div>
          </div>

          {/* Quick Steps Guide - Mobile Responsive List Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs text-slate-300 mb-5 sm:mb-6">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0">
              <span className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold inline-flex items-center justify-center shrink-0 sm:mb-1.5 text-xs">
                ১
              </span>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs">লোগোতে ক্লিক করুন</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">বিকাশ বা নগদ বাটনে চাপ দিলে অটো নম্বর কপি হয়ে অ্যাপ ওপেন হবে।</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0">
              <span className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold inline-flex items-center justify-center shrink-0 sm:mb-1.5 text-xs">
                ২
              </span>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs">Send Money করুন</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">রেফারেন্সে আপনার <span className="text-emerald-400 font-bold font-mono">Name_Versity_Batch</span> দিয়ে হাদিয়া পাঠান।</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0">
              <span className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold inline-flex items-center justify-center shrink-0 sm:mb-1.5 text-xs">
                ৩
              </span>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs">তথ্য সাবমিট (ঐচ্ছিক)</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">চাইলে নিচে TrxID সাবমিট করে অনুদান কনফার্ম করতে পারেন।</p>
              </div>
            </div>
          </div>

          {/* Toggle Button for Optional TrxID submission */}
          {!showSubmitForm && !submitSuccess && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowSubmitForm(true)}
                className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 underline decoration-dashed underline-offset-4 active:scale-95 transition-transform"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>টাকা পাঠিয়ে থাকলে তথ্য সাবমিট করতে এখানে ক্লিক করুন (ঐচ্ছিক)</span>
              </button>
            </div>
          )}

          {/* Optional TrxID Submission Form */}
          {showSubmitForm && !submitSuccess && (
            <div className="mt-5 pt-5 border-t border-slate-800/80 animate-in fade-in duration-300">
              <h4 className="text-sm font-bold text-white mb-1.5 text-center flex items-center justify-center space-x-2">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                <span>অনুদানের বিবরণ সাবমিশন (ঐচ্ছিক)</span>
              </h4>
              <p className="text-xs text-slate-400 text-center mb-4">
                আপনি টাকা পাঠিয়ে থাকলে নিচের তথ্যগুলো দিতে পারেন, যাতে আয়োজক কমিটি আপনার অনুদান লিপিবদ্ধ করতে পারে।
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-950/80 border border-red-500/40 rounded-xl flex items-center space-x-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleDonationSubmit} className="space-y-3 max-w-md mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      নাম (Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sakib"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      ভার্সিটি (Versity)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NITER / DU"
                      value={donorUniversity}
                      onChange={(e) => setDonorUniversity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      ব্যাচ (Batch)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 13"
                      value={donorBatch}
                      onChange={(e) => setDonorBatch(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      মোবাইল নম্বর (Contact)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 017XXXXXXXX"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      টাকার পরিমাণ (Amount ৳)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 100, 200, 500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      Transaction ID (TrxID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BKT98A76X1"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      Reference Code (Auto)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={computedReference}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-emerald-500/40 text-sm sm:text-xs text-emerald-300 font-mono font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>তথ্য সাবমিট করুন (Confirm Donation)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Submission Success Message */}
          {submitSuccess && (
            <div className="mt-5 p-4 sm:p-5 bg-emerald-900/60 border border-emerald-500/40 rounded-2xl text-center animate-in fade-in">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-base font-bold text-white mb-1">জাযাকাল্লাহু খাইরান!</h4>
              <p className="text-xs text-emerald-200 max-w-md mx-auto">
                আপনার অনুদানের তথ্য সফলভাবে সংরক্ষিত হয়েছে। আল্লাহ সুবহানাহু ওয়া তা&rsquo;আলা আপনার সাদাকাহ কবুল করুন এবং দুনিয়া ও আখিরাতে উত্তম প্রতিদান দান করুন। আমীন।
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
