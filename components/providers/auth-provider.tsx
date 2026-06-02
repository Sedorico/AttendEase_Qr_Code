'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setLoading, logout, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.success && data.data?.employee) {
          setUser(data.data.employee);
        } else {
          logout();
          if (
            !pathname.startsWith('/login') &&
            !pathname.startsWith('/register') &&
            !pathname.startsWith('/scanner')
          ) {
            router.push('/login');
          }
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) return;

    // ✅ FIXED: redirect based on role
    const { user } = useAuthStore.getState();

    if (pathname === '/login' || pathname === '/register') {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/employee');
      }
    }

    // ✅ Prevent admin from going to /employee and vice versa
    if (user?.role === 'admin' && pathname.startsWith('/employee')) {
      router.push('/admin');
    }

    if (user?.role !== 'admin' && pathname.startsWith('/admin')) {
      router.push('/employee');
    }

  }, [mounted, isAuthenticated, pathname]);

  if (!mounted) return null;

  return <>{children}</>;
}
