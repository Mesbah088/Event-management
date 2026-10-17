'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Keyboard,
  ShieldCheck,
  Building,
  User,
  Phone,
  GraduationCap,
  School,
  UserCheck,
} from 'lucide-react';
import { playSuccessChime, playDeniedBuzzer } from '@/lib/utils/audio';

interface ScannerProps {
  eventId: string;
  eventName: string;
  gateId: string;
  gates: string[];
  onGateChange: (gate: string) => void;
}

interface ScanResultState {
  status: 'IDLE' | 'VALID' | 'DUPLICATE' | 'INVALID' | 'CANCELLED' | 'WRONG_EVENT' | 'NETWORK_ERROR';
  message: string;
  ticketRef?: string;
  attendeeName?: string;
  details?: any;
}

export default function ScannerComponent({
  eventId,
  eventName,
  gateId,
  gates,
  onGateChange,
}: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResultState>({ status: 'IDLE', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTokenRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const isRequestInFlightRef = useRef<boolean>(false);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Send token to check-in API
  const submitCheckIn = useCallback(async (token: string) => {
    if (isRequestInFlightRef.current) return;
    isRequestInFlightRef.current = true;
    setIsProcessing(true);

    try {
      const response = await fetch('/api/scanner/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          eventId,
          gateId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.outcome === 'VALID') {
        playSuccessChime();
        setResult({
          status: 'VALID',
          message: data.message || 'VALID — ENTRY ALLOWED',
          ticketRef: data.ticket?.ticketRef,
          attendeeName: data.ticket?.attendeeName,
          details: data.ticket,
        });
      } else {
        playDeniedBuzzer();
        const outcome = data.outcome || 'INVALID';
        setResult({
          status: outcome,
          message: data.message || data.error || 'ENTRY DENIED',
          ticketRef: data.ticketRef,
          details: data.details,
        });
      }
    } catch (err) {
      playDeniedBuzzer();
      setResult({
        status: 'NETWORK_ERROR',
        message: 'NETWORK ERROR — Unable to verify ticket with central server. Please re-try.',
      });
    } finally {
      setIsProcessing(false);
      isRequestInFlightRef.current = false;

      // Auto-clear result after 3.5 seconds to scan next ticket effortlessly
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = setTimeout(() => {
        setResult({ status: 'IDLE', message: '' });
      }, 3500);
    }
  }, [eventId, gateId]);

  // Handle successful camera decode
  const onScanSuccess = useCallback((decodedText: string) => {
    const now = Date.now();

    // Parse payload if encoded as JSON
    let tokenToSubmit = decodedText.trim();
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.t) tokenToSubmit = parsed.t;
      else if (parsed.token) tokenToSubmit = parsed.token;
      else if (parsed.ticketRef) tokenToSubmit = parsed.ticketRef;
    } catch (e) {
      // Raw string token
    }

    // If scanned text is a URL, extract token or ticketRef parameter
    if (tokenToSubmit.startsWith('http://') || tokenToSubmit.startsWith('https://')) {
      try {
        const urlObj = new URL(tokenToSubmit);
        const tokParam = urlObj.searchParams.get('token');
        const refParam = urlObj.searchParams.get('ticketRef') || urlObj.searchParams.get('ref');
        if (tokParam) tokenToSubmit = tokParam;
        else if (refParam) tokenToSubmit = refParam;
      } catch (e) {}
    }

    // Debounce duplicate scans of the exact same token within 3 seconds
    if (
      lastScannedTokenRef.current === tokenToSubmit &&
      now - lastScannedTimeRef.current < 3000
    ) {
      return;
    }

    if (isRequestInFlightRef.current) return;

    lastScannedTokenRef.current = tokenToSubmit;
    lastScannedTimeRef.current = now;

    submitCheckIn(tokenToSubmit);
  }, [submitCheckIn]);

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      const scanner = new Html5Qrcode('qr-reader-viewport');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        () => {} // Ignore continuous scan frame misses
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera startup error:', err);
      setCameraError('Camera access denied or unavailable. You can use Manual Entry below.');
      setIsScanning(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Camera stop error:', e);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    submitCheckIn(manualCode.trim());
    setManualCode('');
    setShowManualModal(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Event and Gate Context Header */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Active Event</span>
          <span className="font-bold text-base truncate block max-w-[200px]">{eventName}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-brand-400" />
          <select
            value={gateId}
            onChange={(e) => onGateChange(e.target.value)}
            className="bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {gates.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Viewfinder Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="relative aspect-square w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
          {/* HTML5 QR Code Container */}
          <div id="qr-reader-viewport" className="w-full h-full" />

          {/* Scanner Overlay Guide */}
          {isScanning && !isProcessing && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-dashed border-emerald-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent scanner-laser" />
              </div>
            </div>
          )}

          {/* Idle / Off Screen */}
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white">
              <Camera className="w-16 h-16 text-slate-500 mb-4 stroke-1" />
              <h3 className="text-lg font-semibold mb-2">Camera is Paused</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-6">
                Tap Start Scanner to activate the rear camera stream for admission verification.
              </p>
              <button
                onClick={startCamera}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Start Scanner</span>
              </button>
            </div>
          )}

          {/* In-Flight Processing Spinner */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-semibold text-sm">Verifying Ticket Atomic State...</p>
            </div>
          )}
        </div>

        {/* Camera Controls Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {isScanning ? (
            <button
              onClick={stopCamera}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Pause Camera</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Resume Camera</span>
            </button>
          )}

          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100"
          >
            <Keyboard className="w-3.5 h-3.5 text-brand-600" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* SCAN RESULT CARDS */}
      {result.status !== 'IDLE' && (
        <div
          className={`rounded-2xl p-5 shadow-lg border transition-all animate-in fade-in zoom-in-95 duration-200 ${
            result.status === 'VALID'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : result.status === 'NETWORK_ERROR'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {result.status === 'VALID' ? (
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : result.status === 'NETWORK_ERROR' ? (
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
                  <XCircle className="w-7 h-7" />
                </div>
              )}

              <div>
                <h4 className="text-lg font-extrabold tracking-tight">{result.message}</h4>
                {result.ticketRef && (
                  <p className="text-xs font-mono font-semibold opacity-80 mt-0.5">
                    Ticket Ref: {result.ticketRef}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setResult({ status: 'IDLE', message: '' })}
              title="Clear & Next"
              className="p-1.5 rounded-lg hover:bg-black/5 text-current"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Enhanced Attendee Verification Card for Gate Staff */}
          {result.status === 'VALID' && (
            <div className="mt-4 pt-4 border-t border-emerald-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center space-x-1">
                      <UserCheck className="w-3 h-3" />
                      <span>
                        {result.details?.attendeeType === 'NITER_STUDENT'
                          ? '🎓 NITER Student'
                          : result.details?.attendeeType === 'NITER_ALUMNI'
                          ? '🎓 NITER Alumni'
                          : result.details?.attendeeType === 'EXTERNAL_STUDENT'
                          ? '🏛️ External University'
                          : '👤 Event Attendee'}
                      </span>
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-emerald-950 leading-tight">
                    {result.attendeeName || result.details?.attendeeName}
                  </h3>
                  {result.details?.attendeeEmail && (
                    <p className="text-xs text-emerald-700">{result.details.attendeeEmail}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Admitted Gate</span>
                  <span className="font-extrabold text-xs text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-md inline-block">
                    {gateId}
                  </span>
                </div>
              </div>

              {/* Attendee Details Grid */}
              <div className="bg-emerald-100/60 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs text-emerald-900 border border-emerald-200/80">
                {result.details?.studentId && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Student ID</span>
                    <span className="font-bold font-mono">{result.details.studentId}</span>
                  </div>
                )}
                {result.details?.batch && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Batch</span>
                    <span className="font-bold">{result.details.batch}</span>
                  </div>
                )}
                {result.details?.department && (
                  <div className={result.details?.institution ? 'col-span-1' : 'col-span-2'}>
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Department</span>
                    <span className="font-bold">{result.details.department}</span>
                  </div>
                )}
                {result.details?.institution && (
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 block">University / Institution</span>
                    <span className="font-bold">{result.details.institution}</span>
                  </div>
                )}
                {result.details?.attendeePhone && (
                  <div className="col-span-2 flex items-center space-x-1 pt-1 border-t border-emerald-200/50">
                    <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span className="font-semibold text-emerald-800">Contact:</span>
                    <span className="font-bold font-mono">{result.details.attendeePhone}</span>
                  </div>
                )}
                {result.details?.trxId && (
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-emerald-200/50">
                    <span className="font-semibold text-emerald-800">Payment TrxID:</span>
                    <span className="font-bold font-mono text-emerald-950 bg-emerald-200/80 px-2 py-0.5 rounded text-[11px]">
                      {result.details.trxId} {result.details?.paymentMethod ? `(${result.details.paymentMethod})` : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-emerald-600 text-white rounded-xl p-2.5 text-center text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Identity & Payment Verified — Allow Entry</span>
              </div>
            </div>
          )}

          {/* Duplicate Scan Diagnostics */}
          {result.status === 'DUPLICATE' && result.details && (
            <div className="mt-4 pt-3 border-t border-rose-200 text-xs space-y-2">
              <div className="bg-rose-100/80 rounded-xl p-3 border border-rose-200 text-rose-950">
                <p className="font-bold text-rose-900 mb-1 flex items-center space-x-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Previous Admission Record:</span>
                </p>
                {result.details.attendeeName && (
                  <p className="text-rose-900 font-semibold">• Name: {result.details.attendeeName}</p>
                )}
                {result.details.trxId && (
                  <p className="text-rose-800">• TrxID: {result.details.trxId}</p>
                )}
                {result.details.studentId && (
                  <p className="text-rose-800">• Student ID: {result.details.studentId}</p>
                )}
                {result.details.institution && (
                  <p className="text-rose-800">• Institution: {result.details.institution}</p>
                )}
                {result.details.attendeePhone && (
                  <p className="text-rose-800">• Contact: {result.details.attendeePhone}</p>
                )}
                <p className="text-rose-800">
                  • Previous Entry Time:{' '}
                  {result.details.initialCheckInAt
                    ? new Date(result.details.initialCheckInAt).toLocaleTimeString()
                    : 'Earlier today'}
                </p>
                <p className="text-rose-800">
                  • Previous Entry Gate: {result.details.initialGateId || 'Main Gate'}
                </p>
              </div>
              <p className="text-rose-700 font-semibold text-center text-[11px]">
                ⚠️ Do NOT allow entry. Ticket has already been scanned.
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setResult({ status: 'IDLE', message: '' })}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-transform active:scale-95 shadow-md flex items-center space-x-1.5"
            >
              <span>Scan Next Attendee</span>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Keyboard className="w-5 h-5 text-brand-600" />
                <span>Manual Ticket Entry</span>
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Enter the ticket token or reference code presented by the attendee.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. UE-2026-8AD9F8 or raw token"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
                required
              />

              <div className="flex space-x-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/20 disabled:opacity-50"
                >
                  {isProcessing ? 'Verifying...' : 'Verify Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
