'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Download,
  ExternalLink,
  Award,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  FileText,
  Copy,
  Check,
  ChevronRight,
  BookmarkCheck,
  Trophy,
} from 'lucide-react';

export default function QuizSection() {
  const [copiedLink, setCopiedLink] = useState(false);

  // Google Drive Book URLs
  const googleDriveViewUrl = 'https://drive.google.com/file/d/1UC0Mn3Xc6ESH5h-qCMEhlHZfcVLlVmIb/view?usp=sharing';
  const googleDriveDownloadUrl = 'https://drive.google.com/uc?export=download&id=1UC0Mn3Xc6ESH5h-qCMEhlHZfcVLlVmIb';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(googleDriveViewUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <section id="quiz-section" className="w-full py-14 sm:py-20 relative overflow-hidden bg-slate-900 text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-lg">
            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>মেগা ইসলামিক কুইজ প্রতিযোগিতা ২০২৬</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            কুইজ সিলেবাস ও{' '}
            <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-amber-400 bg-clip-text text-transparent">
              পাঠ্য বই ডাউনলোড
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
            NITER ইসলামিক কনফারেন্স ২০২৬ উপলক্ষে আয়োজিত বিশেষ জ্ঞানচর্চামূলক কুইজ প্রতিযোগিতায় অংশ নিতে নির্ধারিত বইটি এখনই ডাউনলোড করে প্রস্তুতি শুরু করুন।
          </p>
        </div>

        {/* Main Content: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Featured Book Card (7 cols) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/70 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            {/* Top decorative badge */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-800/50 pb-5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300 block">
                      অফিসিয়াল কুইজ সিলেবাস বই
                    </span>
                    <span className="text-xs text-slate-400">পিডিএফ ই-বুক সংস্করণ</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  সাইজ: ১৩৪.৭ মেগাবাইট (Full Book)
                </span>
              </div>

              {/* Book Details Box */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* Book Cover Stylized Presentation */}
                <div className="sm:col-span-5 flex justify-center">
                  <div className="relative group w-44 sm:w-48 aspect-[3/4] rounded-2xl bg-gradient-to-br from-[#17382c] via-[#0f241c] to-[#091510] border-2 border-amber-400/60 p-5 shadow-2xl flex flex-col justify-between text-center transform transition-transform group-hover:scale-105 duration-300">
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase tracking-widest text-amber-300/80 font-bold">
                        ইসলামিক আকীদা গ্রন্থ
                      </div>
                      <div className="w-8 h-0.5 bg-amber-400/60 mx-auto rounded-full" />
                    </div>

                    <div className="my-auto space-y-2">
                      <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight leading-tight">
                        ইমান ও কুফর
                      </div>
                      <p className="text-[11px] text-emerald-200 font-medium">
                        মাওলানা সাঈদ আহমদ
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-400/30 text-[9px] text-slate-300 font-mono">
                      NITER Islamic Conference 2026
                    </div>
                  </div>
                </div>

                {/* Book Description & Highlights */}
                <div className="sm:col-span-7 space-y-3.5 text-left">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                    ইমান ও কুফর
                  </h3>
                  <p className="text-xs font-semibold text-amber-300">
                    লেখক: মাওলানা সাঈদ আহমদ
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    একটি বিশুদ্ধ দ্বীনি আকিদা ও ঈমানের মৌলিক বিষয়াদি সম্পর্কে সুস্পষ্ট জ্ঞান অর্জনে অত্যন্ত প্রামাণ্য গ্রন্থ। সম্মেলনের কুইজ প্রতিযোগিতার সকল প্রশ্ন এই বইয়ের বিষয়ের আলোকে প্রণয়ন করা হবে।
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center space-x-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>কুইজ প্রতিযোগিতায় সকল প্রশ্ন এই বই থেকে থাকবে</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>সম্পূর্ণ মূল বই পিডিএফ ফরম্যাটে বিনামূল্যে উন্মুক্ত</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>মোবাইল বা কম্পিউটারে যেকোনো সময় পাঠযোগ্য</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-emerald-800/40 flex flex-col sm:flex-row items-center gap-3">
              {/* Primary Download Button */}
              <a
                href={googleDriveDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95 text-center"
              >
                <Download className="w-4 h-4 shrink-0 animate-bounce" />
                <span>বইটি ডাউনলোড করুন (PDF Download)</span>
              </a>

              {/* Read Online / Preview */}
              <a
                href={googleDriveViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
                <span>অনলাইনে পড়ুন (Preview)</span>
              </a>

              {/* Copy Direct Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-400/60 text-slate-300 hover:text-white transition-colors flex items-center justify-center"
                title="বইয়ের ডাউনলোড লিংক কপি করুন"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
                <span className="ml-2 text-xs font-semibold sm:hidden">
                  {copiedLink ? 'লিংক কপি হয়েছে' : 'লিংক কপি করুন'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Quiz Rules, Prizes & Attendee Callout (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-purple-950/70 to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-amber-400/40 shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center space-x-2 text-amber-300">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-lg text-white">কুইজ প্রতিযোগিতার নির্দেশিকা</h3>
              </div>

              {/* Prize Highlight Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/30 space-y-1.5">
                <span className="text-[10px] uppercase font-extrabold text-amber-300 tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>আকর্ষণীয় পুরস্কার ও সম্মাননা</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  কুইজ প্রতিযোগিতায় বিজয়ী সেরা প্রতিযোগীদের জন্য থাকছে বিশেষ সম্মাননা ক্রেস্ট, মূল্যবান ইসলামিক গ্রন্থাবলি ও বিশেষ উপহার স্মারক!
                </p>
              </div>

              {/* Rules List */}
              <div className="space-y-3 pt-1 text-xs text-slate-300">
                <div className="flex items-start space-x-2.5">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">অংশগ্রহণের যোগ্যতা:</span>
                    <span>কনফারেন্সে নিবন্ধিত নিটার ও বহিরাগত বিশ্ববিদ্যালয়ের সকল শিক্ষার্থী উন্মুক্তভাবে অংশ নিতে পারবেন।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">সিলেবাস ও প্রস্তুতি:</span>
                    <span>"ইমান ও কুফর" (মাওলানা সাঈদ আহমদ) বইটি ভালো করে পাঠ করে প্রস্তুতি নিন।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">প্রতিযোগিতার মাধ্যম:</span>
                    <span>সম্মেলনের দিনে নির্ধারিত সেশনে লিখিত MCQ ও ভাইভার মাধ্যমে চূড়ান্ত বিজয়ী নির্বাচন করা হবে।</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Registration Reminder */}
            <div className="mt-8 pt-5 border-t border-purple-800/40 space-y-3">
              <p className="text-[11px] text-slate-400">
                কুইজ প্রতিযোগিতায় অংশ নিতে সম্মেলনে রেজিস্ট্রেশন করা আবশ্যক।
              </p>

              <Link
                href="/events/niter-islamic-conference-2026/register"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95"
              >
                <span>রেজিস্ট্রেশন না করে থাকলে এখনই করুন</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
