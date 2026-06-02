'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QrCode, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, Briefcase, Building2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

const DEPARTMENTS = [
  'Data Analyst',
  'IT',
  'HR',
  'ESL Teacher',
  'Operation',
  'Customer Support',
  'Marketing',
  'WebDev',
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    position: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success && data.data) {
        login(data.data.employee, data.data.token);
        router.push('/employee');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');`}</style>

      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE] px-4 py-10">

        {/* Top accent line */}
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#C49426] to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_4px_48px_rgba(0,0,0,0.08)] overflow-hidden">

            {/* Card Header — Logo lockup */}
            <div className="px-8 pt-8 pb-6 border-b border-[#F0EDE6] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[11px] bg-[#C49426] flex items-center justify-center flex-shrink-0 shadow-[0_4px_16px_rgba(196,148,38,0.30)]">
                <QrCode className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <span
                  className="block text-[19px] text-[#1C1C1A] leading-none tracking-[-0.01em]"
                  style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", fontWeight: 600 }}
                >
                  AttendQR
                </span>
                <span className="block text-[11px] text-[#9A9890] mt-[3px] tracking-[0.04em]">
                  Attendance Management
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="px-8 pt-6">
              <h1 className="text-[20px] font-semibold text-[#1C1C1A] tracking-[-0.025em]">
                Create account
              </h1>
              <p className="text-[13px] text-[#9A9890] mt-1">
                Fill in your details to get started
              </p>
            </div>

            {/* Form */}
            <div className="px-8 pt-5 pb-7">

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-[13px] text-red-600">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#6B6965]" strokeWidth={2} />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className={cn(
                        "w-full h-11 pl-[38px] pr-4 rounded-xl",
                        "border border-[#E5E2DB] bg-[#FAFAF8]",
                        "text-[14px] text-[#1C1C1A] placeholder:text-[#C2C0BB]",
                        "outline-none transition-all duration-150",
                        "focus:border-[#C49426] focus:bg-white focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)]"
                      )}
                      placeholder="Juan dela Cruz"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#6B6965]" strokeWidth={2} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={cn(
                        "w-full h-11 pl-[38px] pr-4 rounded-xl",
                        "border border-[#E5E2DB] bg-[#FAFAF8]",
                        "text-[14px] text-[#1C1C1A] placeholder:text-[#C2C0BB]",
                        "outline-none transition-all duration-150",
                        "focus:border-[#C49426] focus:bg-white focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)]"
                      )}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#6B6965]" strokeWidth={2} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={cn(
                        "w-full h-11 pl-[38px] pr-11 rounded-xl",
                        "border border-[#E5E2DB] bg-[#FAFAF8]",
                        "text-[14px] text-[#1C1C1A] placeholder:text-[#C2C0BB]",
                        "outline-none transition-all duration-150",
                        "focus:border-[#C49426] focus:bg-white focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)]"
                      )}
                      placeholder="Min. 6 characters"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6965] hover:text-[#1C1C1A] transition-colors"
                    >
                      {showPassword
                        ? <EyeOff className="w-[15px] h-[15px]" strokeWidth={2} />
                        : <Eye className="w-[15px] h-[15px]" strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {/* Department & Position — side by side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Department */}
                  <div>
                    <label htmlFor="department" className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-2">
                      Department
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#6B6965] pointer-events-none" strokeWidth={2} />
                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className={cn(
                          "w-full h-11 pl-[38px] pr-7 rounded-xl appearance-none cursor-pointer",
                          "border border-[#E5E2DB] bg-[#FAFAF8]",
                          "text-[13px] text-[#1C1C1A]",
                          "outline-none transition-all duration-150",
                          "focus:border-[#C49426] focus:bg-white focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)]",
                          !formData.department && "text-[#C2C0BB]"
                        )}
                        required
                      >
                        <option value="" disabled>Select</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept} className="text-[#1C1C1A]">{dept}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-3.5 h-3.5 text-[#6B6965]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <label htmlFor="position" className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-2">
                      Position
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#6B6965]" strokeWidth={2} />
                      <input
                        id="position"
                        name="position"
                        type="text"
                        value={formData.position}
                        onChange={handleChange}
                        className={cn(
                          "w-full h-11 pl-[38px] pr-3 rounded-xl",
                          "border border-[#E5E2DB] bg-[#FAFAF8]",
                          "text-[14px] text-[#1C1C1A] placeholder:text-[#C2C0BB]",
                          "outline-none transition-all duration-150",
                          "focus:border-[#C49426] focus:bg-white focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)]"
                        )}
                        placeholder="Job title"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full h-[46px] mt-1 rounded-xl",
                    "bg-[#C49426] hover:bg-[#B48820] active:bg-[#A47C1A]",
                    "text-[14px] font-semibold text-white tracking-[0.01em]",
                    "flex items-center justify-center gap-2",
                    "transition-all duration-150",
                    "shadow-[0_2px_16px_rgba(196,148,38,0.35)] hover:shadow-[0_4px_24px_rgba(196,148,38,0.45)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                    </>
                  )}
                </motion.button>
              </form>
            </div>

            {/* Card footer */}
            <div className="px-8 py-5 bg-[#FAFAF8] border-t border-[#F0EDE6] text-center">
              <p className="text-[13px] text-[#9A9890]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#C49426] font-semibold hover:text-[#A47C1A] transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
