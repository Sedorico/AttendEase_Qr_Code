'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/stores';
import {
  User, MapPin, Calendar, Building2, Briefcase, Clock, Loader2, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const inputBase =
  'w-full h-11 px-4 rounded-[10px] border text-[13px] transition-all duration-200 outline-none bg-white';
const inputActive =
  'border-[#E5E2DB] text-[#1C1C1A] placeholder:text-[#C2C0BB] focus:border-[#C49426] focus:ring-2 focus:ring-[rgba(196,148,38,0.15)]';
const inputDisabled =
  'border-[#E5E2DB] text-[#9A9890] bg-[#F5F3EE] cursor-not-allowed';

interface Props {
  open: boolean;
  onCompleted: () => void; // ← notify layout that profile is done
}

export function CompleteProfileModal({ open, onCompleted }: Props) {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: user?.name || '',
    address: user?.address || '',
    age: user?.age?.toString() || '',
    department: user?.department || '',
    position: user?.position || '',
    scheduleTimeIn: user?.scheduleTimeIn || '',
    scheduleTimeOut: user?.scheduleTimeOut || '',
  });

  const set = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    setError('');

    if (!form.address || !form.age || !form.scheduleTimeIn || !form.scheduleTimeOut) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/employees/${user?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: form.address,
          age: parseInt(form.age),
          scheduleTimeIn: form.scheduleTimeIn,
          scheduleTimeOut: form.scheduleTimeOut,
          profileCompleted: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 1. Sync store with fresh DB data (profileCompleted: true is now in here)
        setUser(data.data.employee);
        // 2. Tell layout directly — don't rely on re-render chain
        onCompleted();
      } else {
        setError(data.error || 'Failed to save profile.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(28,28,26,0.55)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          >
            <div
              className="w-full max-w-[520px] rounded-[22px] overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E2DB',
                boxShadow: '0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(196,148,38,0.10)',
              }}
            >
              {/* Header */}
              <div
                className="px-7 pt-7 pb-5 border-b"
                style={{
                  borderColor: '#F0EDE6',
                  background: 'linear-gradient(135deg, rgba(196,148,38,0.06) 0%, rgba(196,148,38,0.02) 100%)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-[48px] h-[48px] rounded-[13px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(196,148,38,0.12)' }}
                  >
                    <User className="w-[20px] h-[20px]" style={{ color: '#C49426' }} strokeWidth={2} />
                  </div>
                  <div>
                    <p
                      className="text-[18px] font-[600] text-[#1C1C1A]"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      Complete Your Profile
                    </p>
                    <p className="text-[12px] mt-[2px]" style={{ color: '#9A9890' }}>
                      Fill in your details to get started — only takes a minute
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="px-7 py-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-[10px] border text-[12px]"
                    style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.18)', color: '#DC2626' }}
                  >
                    {error}
                  </motion.div>
                )}

                <div>
                  <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                    <input type="text" value={form.name} disabled className={cn(inputBase, inputDisabled, 'pl-10')} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                    Home Address <span style={{ color: '#C49426' }}>*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                    <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)}
                      placeholder="e.g. 123 Rizal St., Makati City" className={cn(inputBase, inputActive, 'pl-10')} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                    Age <span style={{ color: '#C49426' }}>*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                    <input type="number" value={form.age} onChange={(e) => set('age', e.target.value)}
                      placeholder="e.g. 25" min={16} max={100} className={cn(inputBase, inputActive, 'pl-10')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>Department</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                      <input type="text" value={form.department} disabled className={cn(inputBase, inputDisabled, 'pl-10')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>Job Title</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                      <input type="text" value={form.position} disabled className={cn(inputBase, inputDisabled, 'pl-10')} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                    Work Schedule <span style={{ color: '#C49426' }}>*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] mb-1" style={{ color: '#9A9890' }}>Time In</p>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                        <input type="time" value={form.scheduleTimeIn} onChange={(e) => set('scheduleTimeIn', e.target.value)}
                          className={cn(inputBase, inputActive, 'pl-10')} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] mb-1" style={{ color: '#9A9890' }}>Time Out</p>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                        <input type="time" value={form.scheduleTimeOut} onChange={(e) => set('scheduleTimeOut', e.target.value)}
                          className={cn(inputBase, inputActive, 'pl-10')} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-7 py-5 border-t" style={{ borderColor: '#F0EDE6' }}>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="w-full h-12 rounded-[11px] text-[14px] font-[600] flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#C49426 0%,#A47C1A 100%)', color: '#FFFFFF' }}
                >
                  {isSaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> Saving…</>
                    : <><CheckCircle2 className="w-4 h-4" strokeWidth={2} /> Complete Profile</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
