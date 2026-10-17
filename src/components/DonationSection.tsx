'use client';

import React, { useState } from 'react';
import {
  Heart,
  Copy,
  Check,
  Send,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Tag,
} from 'lucide-react';

interface DonationSectionProps {
  defaultOpenForm?: boolean;
}

export default function DonationSection({ defaultOpenForm = false }: DonationSectionProps) {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [showSubmitForm, setShowSubmitForm] = useState(defaultOpenForm);

  // Form State
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [reference, setReference] = useState('NIS Program');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // bKash & Nagad numbers (01518-793129)
  const bkashNumber = process.env.NEXT_PUBLIC_BKASH_NUMBER || '01518793129';
  const nagadNumber = process.env.NEXT_PUBLIC_NAGAD_NUMBER || '01518793129';
  const displayFormattedNumber = '01518-793129';
  const autoReference = 'NIS Program';

  const activeNumber = selectedMethod === 'bkash' ? bkashNumber : nagadNumber;

  const handleCopyNumber = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(activeNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 3000);
    }
  };

  const handleCopyRef = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(autoReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 3000);
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: donorName.trim() || 'Anonymous Donor',
          donorPhone: donorPhone.trim(),
          amount: amount.trim(),
          trxId: trxId.trim().toUpperCase(),
          reference: reference.trim() || 'NIS Program',
          paymentMethod: selectedMethod === 'bkash' ? 'bKash' : 'Nagad',
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
    <section id="donation-section" className="w-full my-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-2xl border border-emerald-500/30 p-6 sm:p-10">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Header & Hadith Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>সাদাকাহ জারিয়াহ • দ্বীনি কাজে অংশগ্রহণ</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
              কনফারেন্স আয়োজনে স্বেচ্ছাসেবী অনুদান
            </h2>

            {/* Quranic Verse */}
            <div className="bg-emerald-900/40 border border-emerald-500/20 rounded-2xl p-4 my-4 text-emerald-100 text-xs sm:text-sm italic leading-relaxed text-center">
              &ldquo;যারা আল্লাহর পথে তাদের সম্পদ ব্যয় করে, তাদের উপমা একটি শস্যবীজের ন্যায়, যা থেকে সাতটি শীষ উৎপন্ন হয় এবং প্রতিটি শীষে থাকে একশত দানা...&rdquo;
              <span className="block mt-1 font-semibold text-emerald-300 not-italic text-xs">
                — সূরা আল-বাকারা, আয়াত: ২৬১
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              NITER ইসলামিক কনফারেন্স ২০২৬-এর রেজিস্ট্রেশন সকলের জন্য সম্পূর্ণ উন্মুক্ত ও ফ্রি। তবে সম্মানিত স্কলার ও অতিথিদের আপ্যায়ন, শিক্ষার্থীদের খাবার এবং প্রয়োজনীয় সামগ্রিক খরচ নির্বাহে আপনার আন্তরিক হাদিয়া সাদরে গৃহীত হবে। 
              <strong className="text-emerald-300 block mt-1.5 font-bold">
                কোনো নির্দিষ্ট বা বাধ্যতামূলক ফি নেই—আপনার সাধ্য অনুযায়ী যে কোনো পরিমাণ অনুদান পাঠাতে পারেন।
              </strong>
            </p>
          </div>

          {/* Payment Method Switcher (bKash & Nagad) */}
          <div className="flex justify-center mb-6">
            <div className="bg-slate-900/80 p-1 rounded-2xl border border-slate-700 inline-flex space-x-1">
              <button
                type="button"
                onClick={() => setSelectedMethod('bkash')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  selectedMethod === 'bkash'
                    ? 'bg-[#E2136E] text-white shadow-lg shadow-[#E2136E]/30 scale-[1.02]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>বিকাশ (bKash)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('nagad')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  selectedMethod === 'nagad'
                    ? 'bg-[#F7941D] text-white shadow-lg shadow-[#F7941D]/30 scale-[1.02]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>নগদ (Nagad)</span>
              </button>
            </div>
          </div>

          {/* Account Number & Auto Reference Card */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700/80 mb-6 shadow-xl space-y-4">
            {/* bKash / Nagad Number Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-800/70 rounded-xl border border-slate-700">
              <div className="text-center sm:text-left">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  {selectedMethod === 'bkash' ? 'bKash Personal (Send Money)' : 'Nagad Personal (Send Money)'}
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-wider block">
                  {displayFormattedNumber}
                </span>
              </div>
              <button
                onClick={handleCopyNumber}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-transform active:scale-95 shadow-md shadow-emerald-600/30 shrink-0"
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

            {/* Auto Reference Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-emerald-950/60 rounded-xl border border-emerald-500/40">
              <div className="text-center sm:text-left">
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-emerald-400" />
                  <span>Auto Reference (অটো রেফারেন্স)</span>
                </span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-xl font-bold font-mono text-emerald-200 bg-emerald-900/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                    {autoReference}
                  </span>
                  <span className="text-[11px] text-emerald-300 hidden md:inline">
                    (বিকাশে রেফারেন্সে এই নামটি দিন)
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopyRef}
                className="px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 transition-transform active:scale-95 border border-emerald-500/50 shadow-md shrink-0"
              >
                {copiedRef ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>রেফারেন্স কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-200" />
                    <span>কপি রেফারেন্স: NIS Program</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-300 text-center pt-1">
              💡 বিকাশ অ্যাপে Send Money করার সময় Reference ঘরে <span className="text-emerald-400 font-bold font-mono">NIS Program</span> লিখে দিন।
            </p>
          </div>

          {/* Quick Steps Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 mb-6">
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold inline-flex items-center justify-center mb-1 text-[11px]">১</span>
              <p className="font-semibold text-white">নম্বর ও রেফারেন্স কপি</p>
              <p className="text-[11px] text-slate-400 mt-0.5">বিকাশ নম্বর ও রেফারেন্স <span className="text-emerald-400 font-mono font-bold">NIS Program</span> কপি করুন।</p>
            </div>
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold inline-flex items-center justify-center mb-1 text-[11px]">২</span>
              <p className="font-semibold text-white">Send Money করুন</p>
              <p className="text-[11px] text-slate-400 mt-0.5">আপনার সাধ্যমতো যে কোনো পরিমাণ অর্থ পাঠিয়ে দিন।</p>
            </div>
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold inline-flex items-center justify-center mb-1 text-[11px]">৩</span>
              <p className="font-semibold text-white">তথ্য নিশ্চিত করুন (ঐচ্ছিক)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">চাইলে নিচে TrxID সাবমিট করে অনুদান কনফার্ম করতে পারেন।</p>
            </div>
          </div>

          {/* Toggle Button for Optional TrxID submission */}
          {!showSubmitForm && !submitSuccess && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowSubmitForm(true)}
                className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 underline decoration-dashed underline-offset-4"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>টাকা পাঠিয়ে থাকলে তথ্য সাবমিট করতে এখানে ক্লিক করুন (ঐচ্ছিক)</span>
              </button>
            </div>
          )}

          {/* Optional TrxID Submission Form */}
          {showSubmitForm && !submitSuccess && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 animate-in fade-in duration-300">
              <h4 className="text-sm font-bold text-white mb-2 text-center flex items-center justify-center space-x-2">
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
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    আপনার নাম (Donor Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Abdullah / Anonymous"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      মোবাইল নম্বর (Contact)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 017XXXXXXXX"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      Transaction ID (TrxID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BKT98A76X1"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      Reference Code
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={reference}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-emerald-500/40 text-xs text-emerald-300 font-mono font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
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
            <div className="mt-6 p-5 bg-emerald-900/60 border border-emerald-500/40 rounded-2xl text-center animate-in fade-in">
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
