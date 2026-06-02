'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, History, User, LogOut, Bell, Menu, X, Lock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useNotificationStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/employee', icon: QrCode, label: 'My QR' },
  { href: '/employee/history', icon: History, label: 'History' },
  { href: '/employee/profile', icon: User, label: 'Profile' },
];

// Get first 2 initials from name e.g. "Karl Del Carmen" → "KD"
function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

export function EmployeeNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChangePassword = () => {
    setDropdownOpen(false);
    router.push('/employee/profile');
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');`}</style>

      {/* Top gold accent line */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[60]"
        style={{ background: 'linear-gradient(90deg, transparent, #C49426, transparent)' }} />

      {/* Desktop Header */}
      <header className="sticky top-[3px] z-50 border-b"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderColor: '#E5E2DB' }}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-[58px]">

            {/* Logo */}
            <Link href="/employee" className="flex items-center gap-3 group">
              <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                style={{ background: '#C49426', boxShadow: '0 4px 14px rgba(196,148,38,0.35)' }}>
                <QrCode className="w-[17px] h-[17px] text-white" strokeWidth={2} />
              </div>
              <span className="text-[17px] text-[#1C1C1A] hidden sm:block"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>
                AttendEase
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                      isActive ? 'text-[#C49426]' : 'text-[#6B6965] hover:text-[#1C1C1A] hover:bg-[#F5F3EE]'
                    )}
                  >
                    <item.icon className="w-[15px] h-[15px]" strokeWidth={2} />
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'rgba(196,148,38,0.08)' }}
                        transition={{ type: 'spring', duration: 0.4 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">

              {/* Bell */}
              <button className="relative w-[34px] h-[34px] rounded-[8px] flex items-center justify-center transition-colors duration-150 hover:bg-[#F5F3EE]">
                <Bell className="w-[17px] h-[17px] text-[#6B6965]" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full border-2"
                    style={{ background: '#C49426', borderColor: 'white' }} />
                )}
              </button>

              {/* ── User Avatar with hover expand + click dropdown ── */}
              <div
                ref={dropdownRef}
                className="hidden sm:block relative pl-3 border-l"
                style={{ borderColor: '#E5E2DB' }}
              >
                {/* Avatar button — hover expands to show name */}
                <motion.button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  onHoverStart={() => setIsHovered(true)}
                  onHoverEnd={() => setIsHovered(false)}
                  className="flex items-center gap-0 rounded-full border overflow-hidden transition-all duration-300"
                  style={{
                    background: '#FAFAF8',
                    borderColor: dropdownOpen ? '#C49426' : '#E5E2DB',
                    boxShadow: dropdownOpen ? '0 0 0 3px rgba(196,148,38,0.12)' : 'none',
                    padding: '3px',
                  }}
                  animate={{ paddingRight: isHovered || dropdownOpen ? '12px' : '3px' }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Avatar circle */}
                  <div
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-[700] text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#C49426,#A47C1A)' }}
                  >
                    {getInitials(user?.name)}
                  </div>

                  {/* Name — animates in on hover */}
                  <AnimatePresence>
                    {(isHovered || dropdownOpen) && (
                      <motion.div
                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
                        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        <p className="text-[12px] font-[600] leading-none" style={{ color: '#1C1C1A' }}>
                          {user?.name?.split(' ')[0]}
                        </p>
                        <p className="text-[10px] mt-[2px]" style={{ color: '#9A9890' }}>
                          {user?.department}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-[calc(100%+10px)] w-[200px] rounded-[14px] overflow-hidden"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E2DB',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(196,148,38,0.08)',
                      }}
                    >
                      {/* User info header inside dropdown */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: '#F0EDE6' }}>
                        <p className="text-[13px] font-[600] text-[#1C1C1A] truncate">{user?.name}</p>
                        <p className="text-[11px] mt-[1px] truncate" style={{ color: '#9A9890' }}>{user?.email}</p>
                      </div>

                      {/* Change Password */}
                      <button
                        onClick={handleChangePassword}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-[500] transition-colors duration-150 hover:bg-[#F5F3EE] text-left"
                        style={{ color: '#1C1C1A' }}
                      >
                        <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(196,148,38,0.10)' }}>
                          <Lock className="w-[13px] h-[13px]" style={{ color: '#C49426' }} strokeWidth={2} />
                        </div>
                        Change Password
                      </button>

                      {/* Divider */}
                      <div style={{ borderTop: '1px solid #F0EDE6' }} />

                      {/* Sign Out */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-[500] transition-colors duration-150 hover:bg-red-50 text-left"
                        style={{ color: '#DC2626' }}
                      >
                        <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(239,68,68,0.08)' }}>
                          <LogOut className="w-[13px] h-[13px] text-red-500" strokeWidth={2} />
                        </div>
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu btn — avatar circle, no hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-[700] text-white transition-all duration-150"
                style={{
                  background: mobileMenuOpen
                    ? 'linear-gradient(135deg,#A47C1A,#8A6614)'
                    : 'linear-gradient(135deg,#C49426,#A47C1A)',
                  boxShadow: mobileMenuOpen
                    ? '0 0 0 3px rgba(196,148,38,0.25)'
                    : '0 2px 8px rgba(196,148,38,0.35)',
                }}
              >
                {getInitials(user?.name)}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed inset-x-0 top-[61px] z-40 shadow-lg"
            style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E2DB' }}
          >
            <div className="container mx-auto p-4 space-y-1">
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3 mb-1 rounded-[12px]"
                style={{ background: '#F5F3EE' }}>
                <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[13px] font-[700] text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#C49426,#A47C1A)' }}>
                  {getInitials(user?.name)}
                </div>
                <div>
                  <p className="text-[13px] font-[600] text-[#1C1C1A]">{user?.name}</p>
                  <p className="text-[11px]" style={{ color: '#9A9890' }}>{user?.department}</p>
                </div>
              </div>

              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors',
                      isActive
                        ? 'text-[#C49426] bg-[#FBF8F0]'
                        : 'text-[#6B6965] hover:text-[#1C1C1A] hover:bg-[#F5F3EE]'
                    )}
                  >
                    <item.icon className="w-[15px] h-[15px]" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}

              <div style={{ borderTop: '1px solid #F0EDE6', paddingTop: '4px', marginTop: '4px' }}>
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push('/employee/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors hover:bg-[#F5F3EE]"
                  style={{ color: '#1C1C1A' }}
                >
                  <Lock className="w-[15px] h-[15px]" style={{ color: '#C49426' }} strokeWidth={2} />
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-[15px] h-[15px]" strokeWidth={2} />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderColor: '#E5E2DB' }}>
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-4 py-2 transition-colors"
                style={{ color: isActive ? '#C49426' : '#9A9890' }}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
