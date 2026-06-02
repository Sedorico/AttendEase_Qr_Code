'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QrCode, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        login(data.data.employee, data.data.token);
        if (data.data.employee.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/employee');
        }
      } else {
        setError(data.error || 'Login failed');
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

      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE] px-4">

        <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#C49426] to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_4px_48px_rgba(0,0,0,0.08)] overflow-hidden">

            {/* Card Header */}
            <div className="px-8 pt-8 pb-7 border-b border-[#F0EDE6]">
              <div className="flex items-center gap-3.5">
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
            </div>

            {/* Title */}
            <div className="px-8 pt-6 pb-0">
              <h1 className="text-[20px] font-semibold text-[#1C1C1A] tracking-[-0.025em]">
                Welcome back
              </h1>
              <p className="text-[13px] text-[#9A9890] mt-1">
                Sign in to your workspace
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

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#6B6965]" strokeWidth={2} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        "w-full h-11 pl-[38px] pr-11 rounded-xl",
                        "border border-[#E5E2DB] bg-[#FAFAF8]",
                        "text-[14px] text-[#1C1C1A] placeholder:text-[#C2C0BB]",
                        "outline-none transition-all duration-150",
                        "focus:border-[#C49426] focus:bg-white focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)]"
                      )}
                      placeholder="••••••••"
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
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                    </>
                  )}
                </motion.button>
              </form>
            </div>

            {/* Card footer */}
            <div className="px-8 py-5 bg-[#FAFAF8] border-t border-[#F0EDE6] text-center">
              <p className="text-[13px] text-[#9A9890]">
                No account yet?{' '}
                <Link href="/register" className="text-[#C49426] font-semibold hover:text-[#A47C1A] transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}