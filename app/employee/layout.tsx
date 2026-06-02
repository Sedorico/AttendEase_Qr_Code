// FILE PATH: app/employee/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { EmployeeNav } from '@/components/employee/employee-nav';
import { CompleteProfileModal } from '@/components/employee/complete-profile-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [showManagerBanner, setShowManagerBanner] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !user?._id) return;

    // ✅ Show manager banner if user is manager or admin
    if (user.role === 'manager' || user.role === 'admin') {
      setShowManagerBanner(true);
    }

    if (user.profileCompleted === true) {
      setProfileCompleted(true);
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/employees/${user._id}`);
        const data = await res.json();
        if (data.success && data.data?.employee) {
          const fresh = data.data.employee;
          setUser(fresh);
          setProfileCompleted(!!fresh.profileCompleted);
          if (fresh.role === 'manager' || fresh.role === 'admin') {
            setShowManagerBanner(true);
          }
        } else {
          setProfileCompleted(!!user.profileCompleted);
        }
      } catch {
        setProfileCompleted(!!user.profileCompleted);
      }
    };

    verify();
  }, [hydrated, user?._id]);

  const handleProfileCompleted = () => {
    setProfileCompleted(true);
  };

  const showModal = hydrated && !!user && profileCompleted === false;

  return (
    <div className="min-h-screen" style={{ background: '#F5F3EE' }}>
      <EmployeeNav />

      {/* ✅ Manager Dashboard Banner */}
      <AnimatePresence>
        {showManagerBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto px-4 pt-3"
            style={{ maxWidth: '1100px' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 rounded-[14px] border"
              style={{
                background: 'rgba(196,148,38,0.06)',
                borderColor: 'rgba(196,148,38,0.22)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(196,148,38,0.12)' }}
                >
                  <LayoutDashboard
                    className="w-4 h-4"
                    style={{ color: '#C49426' }}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-[600]" style={{ color: '#1C1C1A' }}>
                    {user?.role === 'admin' ? 'Admin Access' : 'Manager Access'}
                  </p>
                  <p className="text-[11px]" style={{ color: '#9A9890' }}>
                    {user?.role === 'admin'
                      ? 'You have full admin access to all departments'
                      : `You manage the ${user?.department} department`}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  router.push(user?.role === 'admin' ? '/admin' : '/manager')
                }
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-[600] transition-all duration-150 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #C49426 0%, #A47C1A 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 10px rgba(196,148,38,0.28)',
                }}
              >
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={2.5} />
                {user?.role === 'admin' ? 'Admin Panel' : 'Manager Panel'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pb-20 md:pb-0">
        {children}
      </main>

      <CompleteProfileModal open={showModal} onCompleted={handleProfileCompleted} />
    </div>
  );
}
