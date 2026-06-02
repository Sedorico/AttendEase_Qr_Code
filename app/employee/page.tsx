'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { QRCodeDisplay } from '@/components/employee/qr-display';
import { TodayStatus } from '@/components/employee/today-status';
import { AttendanceHistory } from '@/components/employee/attendance-history';
import { useAuthStore } from '@/lib/stores';
import {
  Loader2, Briefcase, Building2, Mail, Clock,
  AlertTriangle, CheckCircle2, Timer, LogOut, TrendingDown,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.08 },
  }),
};

const REQUIRED_MINUTES = 540;

interface ShiftData {
  status: string;
  timeIn?: string;
  timeOut?: string;
  workMinutes: number;
  totalMinutes: number;
  // Overtime
  overtimeRequested: boolean;
  overtimeRequestedAt?: string;
  overtimeApproved?: boolean;
  // Undertime
  undertimeRequested: boolean;
  undertimeRequestedAt?: string;
  undertimeApproved?: boolean;
  autoSignedOut: boolean;
}

export default function EmployeeDashboard() {
  const { user, isLoading } = useAuthStore();
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);

  // Overtime states
  const [otRequesting, setOtRequesting] = useState(false);
  const [otError, setOtError] = useState('');

  // Undertime states
  const [showUndertimeModal, setShowUndertimeModal] = useState(false);
  const [undertimeReason, setUndertimeReason] = useState('');
  const [utRequesting, setUtRequesting] = useState(false);
  const [utError, setUtError] = useState('');

  const fetchShift = async () => {
    try {
      const res = await fetch('/api/attendance/today/shift');
      const data = await res.json();
      if (data.success && data.data) setShift(data.data);
      else setShift(null);
    } catch {
      setShift(null);
    } finally {
      setShiftLoading(false);
    }
  };

  useEffect(() => {
    fetchShift();
    const interval = setInterval(fetchShift, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Overtime request ──
  const handleOvertimeRequest = async () => {
    setOtRequesting(true);
    setOtError('');
    try {
      const res = await fetch('/api/attendance/overtime-request', { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchShift();
      else setOtError(data.error || 'Failed to send request');
    } catch {
      setOtError('Network error. Try again.');
    } finally {
      setOtRequesting(false);
    }
  };

  // ── Undertime request ──
  const handleUndertimeRequest = async () => {
    setUtRequesting(true);
    setUtError('');
    try {
      const res = await fetch('/api/attendance/undertime-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: undertimeReason }),
      });
      const data = await res.json();
      if (data.success) {
        setShowUndertimeModal(false);
        setUndertimeReason('');
        fetchShift();
      } else {
        setUtError(data.error || 'Failed to send request');
      }
    } catch {
      setUtError('Network error. Try again.');
    } finally {
      setUtRequesting(false);
    }
  };

  // Derived values
  const workMinutes = shift?.workMinutes ?? 0;
  const progress = Math.min(workMinutes / REQUIRED_MINUTES, 1);
  const progressPct = Math.round(progress * 100);
  const hoursWorked = Math.floor(workMinutes / 60);
  const minsWorked = workMinutes % 60;
  const remaining = Math.max(0, REQUIRED_MINUTES - workMinutes);
  const remainHours = Math.floor(remaining / 60);
  const remainMins = remaining % 60;

  const isShiftActive = shift?.status === 'in_progress';
  const shiftComplete = workMinutes >= REQUIRED_MINUTES;
  const isAutoSignedOut = shift?.status === 'auto_signed_out';
  const isUndertimeDone = shift?.status === 'undertime' && shift?.undertimeApproved;

  // Can request overtime: shift active + 9h reached + not already requested
  const canRequestOT = isShiftActive && shiftComplete && !shift?.overtimeRequested;

  // Can request undertime: shift active + not already requested either type
  const canRequestUT = isShiftActive && !shift?.undertimeRequested && !shift?.overtimeRequested;

  const showShiftCard = !shiftLoading && shift;

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" style={{ background: '#F5F3EE' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(196,148,38,0.12)' }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#C49426' }} />
          </div>
          <p className="text-[13px]" style={{ color: '#9A9890' }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F3EE' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .corp-card {
          background: #FFFFFF;
          border: 1px solid #E5E2DB;
          border-radius: 18px;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease;
        }
        .corp-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 56px rgba(0,0,0,0.07), 0 6px 20px rgba(196,148,38,0.08);
        }
      `}</style>

      <div className="container mx-auto px-4 py-7 md:py-10" style={{ maxWidth: '1100px' }}>

        {/* Welcome Header */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="mb-8">
          <p className="text-[11px] font-[600] tracking-[0.07em] uppercase mb-2" style={{ color: '#C49426' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-[28px] md:text-[32px] leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, color: '#1C1C1A' }}>
            Welcome back{' '}
            <span style={{ color: '#C49426' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#9A9890' }}>
            Scan your QR code at the office kiosk to record your attendance
          </p>
        </motion.div>

        {/* ── STATUS BANNERS ── */}
        <div className="space-y-3 mb-5">
          {/* Auto signed out */}
          {isAutoSignedOut && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-5 py-4 rounded-[14px] border"
              style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.18)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" strokeWidth={2} />
              <div>
                <p className="text-[13px] font-[600] text-red-600">You were automatically signed out</p>
                <p className="text-[12px] text-red-400 mt-[1px]">Your overtime request was not approved. Your shift has ended.</p>
              </div>
            </motion.div>
          )}

          {/* Undertime approved */}
          {isUndertimeDone && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-5 py-4 rounded-[14px] border"
              style={{ background: 'rgba(22,163,74,0.06)', borderColor: 'rgba(22,163,74,0.18)' }}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" strokeWidth={2} />
              <div>
                <p className="text-[13px] font-[600] text-green-700">Undertime approved — you may leave</p>
                <p className="text-[12px] text-green-500 mt-[1px]">Your manager approved your early time-out request.</p>
              </div>
            </motion.div>
          )}

          {/* Undertime rejected */}
          {shift?.undertimeRequested && shift?.undertimeApproved === false && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-5 py-4 rounded-[14px] border"
              style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.18)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" strokeWidth={2} />
              <div>
                <p className="text-[13px] font-[600] text-red-600">Undertime request rejected</p>
                <p className="text-[12px] text-red-400 mt-[1px]">Your manager rejected your early time-out. Please complete your shift.</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* LEFT COLUMN */}
          <div className="space-y-5">

            {/* QR CARD */}
            <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show" className="corp-card">
              <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: '#F0EDE6' }}>
                <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(196,148,38,0.12)' }}>
                  <svg className="w-[16px] h-[16px]" style={{ stroke: '#C49426' }} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" />
                    <rect x="18" y="14" width="3" height="3" /><rect x="14" y="18" width="3" height="3" /><rect x="18" y="18" width="3" height="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-[600] text-[#1C1C1A]">Your Dynamic QR Code</p>
                  <p className="text-[11px] text-[#9A9890]">Show this to the scanner kiosk</p>
                </div>
              </div>
              <div className="px-6 py-6">
                <QRCodeDisplay />
              </div>
            </motion.div>

            {/* SHIFT PROGRESS CARD */}
            {showShiftCard && (
              <motion.div variants={fadeUp} custom={1.5} initial="hidden" animate="show" className="corp-card">
                <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: '#F0EDE6' }}>
                  <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(196,148,38,0.12)' }}>
                    <Timer className="w-[16px] h-[16px]" style={{ color: '#C49426' }} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-[600] text-[#1C1C1A]">Shift Progress</p>
                    <p className="text-[11px] text-[#9A9890]">9 hours required · break auto-deducted</p>
                  </div>
                  {/* Status chip */}
                  <span className={`text-[10px] font-[700] uppercase tracking-[0.06em] px-2.5 py-1 rounded-full border ${
                    shift?.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    shift?.status === 'complete' ? 'bg-green-50 text-green-700 border-green-100' :
                    shift?.status === 'overtime' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    shift?.status === 'undertime' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {shift?.status?.replace('_', ' ')}
                  </span>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-[600] text-[#1C1C1A]">
                        {hoursWorked}h {minsWorked}m worked
                      </span>
                      <span className="text-[12px] font-[600]" style={{ color: shiftComplete ? '#16A34A' : '#C49426' }}>
                        {progressPct}% of 9h
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#F0EDE6' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{
                          background: shiftComplete
                            ? 'linear-gradient(90deg,#16A34A,#22c55e)'
                            : 'linear-gradient(90deg,#C49426,#E4B84A)',
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-[#B0AEA9]">0h</span>
                      {!shiftComplete && (
                        <span className="text-[10px] text-[#B0AEA9]">
                          {remainHours > 0 ? `${remainHours}h ${remainMins}m left` : `${remainMins}m left`}
                        </span>
                      )}
                      <span className="text-[10px] text-[#B0AEA9]">9h</span>
                    </div>
                  </div>

                  {/* ── ACTION SECTION ── */}
                  {isShiftActive && (
                    <div className="space-y-3 pt-1 border-t" style={{ borderColor: '#F0EDE6' }}>

                      {/* OVERTIME — show when 9h reached */}
                      {canRequestOT && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="text-[12px] text-[#9A9890] mb-2.5">
                            You've completed 9 hours. Want to continue working?
                          </p>
                          {otError && (
                            <p className="text-[11px] text-red-500 mb-2">{otError}</p>
                          )}
                          <button
                            onClick={handleOvertimeRequest}
                            disabled={otRequesting}
                            className="w-full h-10 rounded-[10px] text-[13px] font-[600] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg,#C49426,#A47C1A)', color: '#fff' }}
                          >
                            {otRequesting ? (
                              <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
                            ) : (
                              <><Clock className="w-4 h-4" strokeWidth={2} />Request Overtime</>
                            )}
                          </button>
                        </motion.div>
                      )}

                      {/* OT pending */}
                      {shift?.overtimeRequested && shift?.overtimeApproved == null && (
                        <div className="flex items-center gap-2.5 py-2">
                          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: '#C49426' }} />
                          <p className="text-[12px] text-[#9A9890]">Overtime request pending manager approval…</p>
                        </div>
                      )}

                      {/* OT approved */}
                      {shift?.overtimeApproved === true && (
                        <div className="flex items-center gap-2.5 py-2">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
                          <p className="text-[12px] font-[600] text-green-700">Overtime approved — keep going!</p>
                        </div>
                      )}

                      {/* UNDERTIME — always available when shift active and no pending requests */}
                      {canRequestUT && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                          <button
                            onClick={() => setShowUndertimeModal(true)}
                            className="w-full h-10 rounded-[10px] text-[13px] font-[600] flex items-center justify-center gap-2 transition-all border"
                            style={{
                              background: 'rgba(234,88,12,0.06)',
                              borderColor: 'rgba(234,88,12,0.20)',
                              color: '#EA580C',
                            }}
                          >
                            <TrendingDown className="w-4 h-4" strokeWidth={2} />
                            Request Early Time-Out (Undertime)
                          </button>
                        </motion.div>
                      )}

                      {/* UT pending */}
                      {shift?.undertimeRequested && shift?.undertimeApproved == null && (
                        <div className="flex items-center gap-2.5 py-2">
                          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-orange-500" />
                          <p className="text-[12px] text-[#9A9890]">Undertime request pending manager approval…</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* EMPLOYEE INFO CARD */}
            <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show" className="corp-card">
              <div className="p-6">
                <div className="flex items-center gap-4 pb-5 border-b" style={{ borderColor: '#F0EDE6' }}>
                  <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-white text-[22px] flex-shrink-0"
                    style={{
                      fontFamily: "'Playfair Display', serif", fontWeight: 600,
                      background: 'linear-gradient(135deg,#C49426 0%,#A47C1A 100%)',
                      boxShadow: '0 4px 14px rgba(196,148,38,0.30)',
                    }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-[600] text-[#1C1C1A]">{user?.name}</p>
                    <div className="flex items-center gap-1.5 mt-[3px]">
                      <Briefcase className="w-[12px] h-[12px] flex-shrink-0" style={{ color: '#9A9890' }} strokeWidth={2} />
                      <p className="text-[12px] text-[#9A9890]">{user?.position}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-[600] uppercase tracking-[0.05em] text-[#B0AEA9]">Employee ID</p>
                    <p className="text-[11px] font-[600] mt-1 px-2 py-1 rounded-[6px] border"
                      style={{ fontFamily: 'monospace', color: '#1C1C1A', background: '#F5F3EE', borderColor: '#E5E2DB' }}>
                      {user?.employeeId}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                    <span className="text-[12px] text-[#6B6965]">{user?.department}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                    <span className="text-[12px] text-[#6B6965] truncate">{user?.email}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <motion.div variants={fadeUp} custom={1.5} initial="hidden" animate="show">
              <TodayStatus />
            </motion.div>
            <motion.div variants={fadeUp} custom={2.5} initial="hidden" animate="show">
              <AttendanceHistory />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── UNDERTIME MODAL ── */}
      <AnimatePresence>
        {showUndertimeModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowUndertimeModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[400px] bg-white rounded-[20px] border overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.14)]"
              style={{ borderColor: '#E5E2DB' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#F0EDE6' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(234,88,12,0.10)' }}>
                    <TrendingDown className="w-4 h-4 text-orange-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[14px] font-[600] text-[#1C1C1A]">Request Early Time-Out</p>
                    <p className="text-[11px] text-[#9A9890]">Manager approval required</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUndertimeModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9A9890] hover:text-[#1C1C1A] hover:bg-[#F5F3EE] transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4">
                {/* Time summary */}
                <div className="flex items-center gap-3 p-3.5 rounded-[12px] border" style={{ background: '#FAFAF8', borderColor: '#E5E2DB' }}>
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#C49426' }} strokeWidth={2} />
                  <div>
                    <p className="text-[12px] font-[600] text-[#1C1C1A]">
                      Time worked: {hoursWorked}h {minsWorked}m
                    </p>
                    <p className="text-[11px] text-[#9A9890]">
                      {shiftComplete
                        ? 'You have completed 9 hours.'
                        : `${remainHours > 0 ? `${remainHours}h ` : ''}${remainMins}m remaining to complete 9 hours`}
                    </p>
                  </div>
                </div>

                {/* Reason input */}
                <div>
                  <label className="block text-[11px] font-[700] text-[#5A5855] uppercase tracking-[0.07em] mb-1.5">
                    Reason <span className="text-[#B0AEA9] normal-case font-[400]">(optional)</span>
                  </label>
                  <textarea
                    value={undertimeReason}
                    onChange={(e) => setUndertimeReason(e.target.value)}
                    placeholder="e.g. Medical appointment, personal emergency…"
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-[#1C1C1A] placeholder:text-[#C2C0BB] resize-none outline-none transition-all"
                    style={{
                      borderColor: '#E5E2DB', background: '#FAFAF8',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#C49426';
                      e.target.style.boxShadow = '0 0 0 3px rgba(196,148,38,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E5E2DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {utError && (
                  <p className="text-[12px] text-red-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                    {utError}
                  </p>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t flex gap-2.5" style={{ borderColor: '#F0EDE6', background: '#FAFAF8' }}>
                <button
                  onClick={() => setShowUndertimeModal(false)}
                  className="flex-1 h-10 rounded-[10px] text-[13px] font-[600] border transition-colors"
                  style={{ borderColor: '#E5E2DB', color: '#6B6965', background: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUndertimeRequest}
                  disabled={utRequesting}
                  className="flex-1 h-10 rounded-[10px] text-[13px] font-[600] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#EA580C,#C2410C)', color: '#fff' }}
                >
                  {utRequesting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
                  ) : (
                    <><LogOut className="w-4 h-4" strokeWidth={2} />Send Request</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
