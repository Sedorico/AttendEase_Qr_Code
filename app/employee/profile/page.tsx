'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Building2, Briefcase, Lock, Save, Loader2,
  CheckCircle2, MapPin, Calendar, Clock, Camera, Pencil, X,
  Shield, BadgeCheck,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

const easing: [number, number, number, number] = [0.22, 1, 0.36, 1];

const inputBase =
  'w-full h-11 px-4 rounded-[10px] border text-[13px] transition-all duration-200 outline-none';
const inputActive =
  'border-[#E5E2DB] bg-white text-[#1C1C1A] placeholder:text-[#C2C0BB] focus:border-[#C49426] focus:ring-2 focus:ring-[rgba(196,148,38,0.15)]';
const inputDisabled =
  'border-[#E5E2DB] bg-[#F5F3EE] text-[#9A9890] cursor-not-allowed';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value?: string | number;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0" style={{ borderColor: '#F0EDE6' }}>
      <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(196,148,38,0.10)' }}>
        <Icon className="w-[14px] h-[14px]" style={{ color: '#C49426' }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-[600] uppercase tracking-[0.06em]" style={{ color: '#B0AEA9' }}>{label}</p>
        <p className="text-[13px] font-[500] mt-[1px] truncate" style={{ color: value ? '#1C1C1A' : '#C2C0BB' }}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    age: user?.age?.toString() || '',
    scheduleTimeIn: user?.scheduleTimeIn || '',
    scheduleTimeOut: user?.scheduleTimeOut || '',
    newPassword: '',
  });

  const set = (key: string, val: string) =>
    setFormData((p) => ({ ...p, [key]: val }));

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch(`/api/employees/${user?._id}/photo`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success) setUser(data.data.employee);
    } catch {
      // silently fail photo upload
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      const payload: Record<string, string | number> = {
        name: formData.name,
        address: formData.address,
        age: parseInt(formData.age) || 0,
        scheduleTimeIn: formData.scheduleTimeIn,
        scheduleTimeOut: formData.scheduleTimeOut,
      };
      if (formData.newPassword) payload.password = formData.newPassword;

      const res = await fetch(`/api/employees/${user?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.employee);
        setIsEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setFormData(p => ({ ...p, newPassword: '' }));
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setFormData({
      name: user?.name || '',
      address: user?.address || '',
      age: user?.age?.toString() || '',
      scheduleTimeIn: user?.scheduleTimeIn || '',
      scheduleTimeOut: user?.scheduleTimeOut || '',
      newPassword: '',
    });
  };

  // Format time "08:00" → "8:00 AM"
  const fmtTime = (t?: string) => {
    if (!t) return undefined;
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F3EE' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');`}</style>

      <div className="container mx-auto px-4 py-8 md:py-12" style={{ maxWidth: '900px' }}>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easing }}
          className="mb-7"
        >
          <p className="text-[11px] font-[600] tracking-[0.07em] uppercase mb-1" style={{ color: '#C49426' }}>
            Account
          </p>
          <h1 className="text-[26px]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: '#1C1C1A' }}>
            Your Profile
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#9A9890' }}>
            Manage your personal info and work schedule
          </p>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-center gap-3 px-5 py-3 rounded-[12px] border text-[13px]"
              style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)', color: '#16A34A' }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
              Profile updated successfully!
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-center gap-3 px-5 py-3 rounded-[12px] border text-[13px]"
              style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.18)', color: '#DC2626' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-[300px_1fr] gap-5 items-start">

          {/* ── LEFT: Profile Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easing, delay: 0.05 }}
            className="rounded-[20px] overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #E5E2DB', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}
          >
            {/* Photo area */}
            <div className="flex flex-col items-center pt-8 pb-5 px-6"
              style={{ borderBottom: '1px solid #F0EDE6' }}>

              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-[110px] h-[110px] rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    background: user?.profilePhoto
                      ? 'transparent'
                      : 'linear-gradient(135deg,#C49426 0%,#A47C1A 100%)',
                    boxShadow: '0 6px 24px rgba(196,148,38,0.25)',
                  }}>
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-[46px] h-[46px] text-white" strokeWidth={1.5} />
                  )}
                </div>

                {/* Upload button */}
                <button
                  onClick={handlePhotoClick}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-1 right-1 w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                  style={{ background: '#C49426', boxShadow: '0 2px 8px rgba(196,148,38,0.45)', border: '2px solid white' }}
                >
                  {isUploadingPhoto
                    ? <Loader2 className="w-[13px] h-[13px] text-white animate-spin" strokeWidth={2.5} />
                    : <Camera className="w-[13px] h-[13px] text-white" strokeWidth={2.5} />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Name & position */}
              <p className="text-[17px] font-[600] text-[#1C1C1A] text-center leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {user?.name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <BadgeCheck className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#C49426' }} strokeWidth={2} />
                <p className="text-[12px]" style={{ color: '#9A9890' }}>{user?.position}</p>
              </div>

              {/* Employee ID badge */}
              <div className="mt-3 px-3 py-1.5 rounded-full border"
                style={{ background: '#F5F3EE', borderColor: '#E5E2DB' }}>
                <p className="text-[11px] font-[600] tracking-[0.05em]"
                  style={{ color: '#6B6965', fontFamily: 'monospace' }}>
                  {user?.employeeId}
                </p>
              </div>
            </div>

            {/* Info rows */}
            <div className="px-5 py-2">
              <InfoRow icon={Building2} label="Department" value={user?.department} />
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow icon={MapPin} label="Address" value={user?.address} />
              <InfoRow icon={Calendar} label="Age" value={user?.age ? `${user.age} years old` : undefined} />
              <InfoRow icon={Clock} label="Time In" value={fmtTime(user?.scheduleTimeIn)} />
              <InfoRow icon={Clock} label="Time Out" value={fmtTime(user?.scheduleTimeOut)} />
            </div>

            {/* Edit button */}
            {!isEditing && (
              <div className="px-5 pb-5 pt-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full h-11 rounded-[10px] text-[13px] font-[600] flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-90"
                  style={{ background: 'rgba(196,148,38,0.10)', color: '#C49426', border: '1px solid rgba(196,148,38,0.20)' }}
                >
                  <Pencil className="w-[14px] h-[14px]" strokeWidth={2} />
                  Edit Profile
                </button>
              </div>
            )}
          </motion.div>

          {/* ── RIGHT: Edit Form / Info Detail ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easing, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, ease: easing }}
                  className="rounded-[20px] overflow-hidden"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E2DB', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}
                >
                  {/* Edit header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#F0EDE6' }}>
                    <div>
                      <p className="text-[14px] font-[600] text-[#1C1C1A]">Edit Information</p>
                      <p className="text-[11px] mt-[1px]" style={{ color: '#9A9890' }}>Update your personal details</p>
                    </div>
                    <button onClick={handleCancel}
                      className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition-colors hover:bg-[#F5F3EE]">
                      <X className="w-[15px] h-[15px]" style={{ color: '#9A9890' }} strokeWidth={2} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">

                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                        Full Name
                      </label>
                      <input type="text" value={formData.name} onChange={e => set('name', e.target.value)}
                        className={cn(inputBase, inputActive)} placeholder="Your full name" />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                        Home Address
                      </label>
                      <input type="text" value={formData.address} onChange={e => set('address', e.target.value)}
                        className={cn(inputBase, inputActive)} placeholder="e.g. 123 Rizal St., Makati City" />
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                        Age
                      </label>
                      <input type="number" min={16} max={100} value={formData.age} onChange={e => set('age', e.target.value)}
                        className={cn(inputBase, inputActive)} placeholder="e.g. 25" />
                    </div>

                    {/* Department & Position read-only */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                          Department
                        </label>
                        <input type="text" value={user?.department || ''} disabled className={cn(inputBase, inputDisabled)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                          Job Title
                        </label>
                        <input type="text" value={user?.position || ''} disabled className={cn(inputBase, inputDisabled)} />
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5" style={{ color: '#B0AEA9' }}>
                        Work Schedule
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] mb-1" style={{ color: '#9A9890' }}>Time In</p>
                          <input type="time" value={formData.scheduleTimeIn} onChange={e => set('scheduleTimeIn', e.target.value)}
                            className={cn(inputBase, inputActive)} />
                        </div>
                        <div>
                          <p className="text-[11px] mb-1" style={{ color: '#9A9890' }}>Time Out</p>
                          <input type="time" value={formData.scheduleTimeOut} onChange={e => set('scheduleTimeOut', e.target.value)}
                            className={cn(inputBase, inputActive)} />
                        </div>
                      </div>
                    </div>

                    {/* Change password */}
                    <div className="pt-2 border-t" style={{ borderColor: '#F0EDE6' }}>
                      <label className="block text-[11px] font-[600] uppercase tracking-[0.06em] mb-1.5 mt-3" style={{ color: '#B0AEA9' }}>
                        New Password <span style={{ color: '#C2C0BB', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(leave blank to keep current)</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
                        <input type="password" value={formData.newPassword} onChange={e => set('newPassword', e.target.value)}
                          placeholder="••••••••"
                          className={cn(inputBase, inputActive, 'pl-10')} />
                      </div>
                    </div>

                    {/* Save button */}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full h-12 rounded-[11px] text-[14px] font-[600] flex items-center justify-center gap-2 mt-2 transition-opacity disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#C49426 0%,#A47C1A 100%)', color: '#FFFFFF' }}
                    >
                      {isSaving
                        ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> Saving…</>
                        : <><Save className="w-4 h-4" strokeWidth={2} /> Save Changes</>}
                    </button>
                  </div>
                </motion.div>

              ) : (
                // ── View mode: security card ──
                <motion.div
                  key="view"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, ease: easing }}
                  className="rounded-[20px] overflow-hidden"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E2DB', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}
                >
                  <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: '#F0EDE6' }}>
                    <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center"
                      style={{ background: 'rgba(196,148,38,0.10)' }}>
                      <Shield className="w-[16px] h-[16px]" style={{ color: '#C49426' }} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[14px] font-[600] text-[#1C1C1A]">Account Security</p>
                      <p className="text-[11px]" style={{ color: '#9A9890' }}>Your login & access details</p>
                    </div>
                  </div>
                  <div className="px-5 py-2">
                    <InfoRow icon={Mail} label="Email Address" value={user?.email} />
                    <InfoRow icon={Lock} label="Password" value="••••••••••" />
                    <InfoRow icon={BadgeCheck} label="Role" value={user?.role === 'admin' ? 'Administrator' : 'Employee'} />
                    <InfoRow icon={User} label="Employee ID" value={user?.employeeId} />
                  </div>
                  <div className="px-5 pb-5 pt-1">
                    <p className="text-[11px] px-1" style={{ color: '#B0AEA9' }}>
                      To change your password, click <span style={{ color: '#C49426', fontWeight: 600 }}>Edit Profile</span> on the left card.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
