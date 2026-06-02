'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, CheckCircle2, XCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  SHIFT_30MIN:       { icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
  SHIFT_10MIN:       { icon: Clock,         color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  SHIFT_COMPLETE:    { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100' },
  OVERTIME_REQUEST:  { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
  OVERTIME_APPROVED: { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100' },
  OVERTIME_REJECTED: { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100' },
  AUTO_SIGNED_OUT:   { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100' },
};

interface ToastItem extends Notification {
  toastId: string;
}

export default function NotifToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastPollRef = useRef<Date>(new Date());
  const seenIdsRef = useRef<Set<string>>(new Set());

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  const fetchAndShowToasts = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();

      if (!data.success) return;

      const notifications: Notification[] = data.data.notifications;
      const now = new Date();
      const lastPoll = lastPollRef.current;

      // Find new unread notifications that arrived since last poll
      const newNotifs = notifications.filter(n => {
        if (seenIdsRef.current.has(n._id)) return false;
        if (n.read) return false;
        const createdAt = new Date(n.createdAt);
        // Show if created after last poll (or within last 35s on first load)
        return createdAt >= lastPoll;
      });

      // Mark all as seen
      notifications.forEach(n => seenIdsRef.current.add(n._id));
      lastPollRef.current = now;

      if (newNotifs.length === 0) return;

      // Add new toasts
      const newToasts: ToastItem[] = newNotifs.map(n => ({
        ...n,
        toastId: `${n._id}-${Date.now()}`,
      }));

      setToasts(prev => [...prev, ...newToasts].slice(-5)); // max 5 toasts

      // Auto-dismiss each after 5 seconds
      newToasts.forEach(toast => {
        setTimeout(() => {
          dismissToast(toast.toastId);
        }, 5000);
      });
    } catch {}
  }, [dismissToast]);

  // Poll every 30 seconds
  useEffect(() => {
    // Initial fetch — set lastPoll to 35s ago so we catch recent notifs on load
    lastPollRef.current = new Date(Date.now() - 35000);
    fetchAndShowToasts();

    const interval = setInterval(fetchAndShowToasts, 30000);
    return () => clearInterval(interval);
  }, [fetchAndShowToasts]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const iconConfig = NOTIF_ICONS[toast.type] || {
            icon: Bell,
            color: 'text-[#C49426]',
            bg: 'bg-[#FBF5E6]',
            border: 'border-[#E5DCC0]',
          };
          const IconComponent = iconConfig.icon;

          return (
            <motion.div
              key={toast.toastId}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-[320px] bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              {/* Progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-[3px] bg-[#C49426] origin-left"
              />

              <div className="flex items-start gap-3 px-4 py-3">
                {/* Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border",
                  iconConfig.bg,
                  iconConfig.border
                )}>
                  <IconComponent className={cn("w-4 h-4", iconConfig.color)} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1C1C1A] leading-tight">
                    {toast.title}
                  </p>
                  <p className="text-[12px] text-[#6B6965] mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => dismissToast(toast.toastId)}
                  className="text-[#C2C0BB] hover:text-[#6B6965] transition-colors flex-shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}