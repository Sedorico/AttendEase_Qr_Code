'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionRequired?: boolean;
  actionTaken?: boolean;
  attendanceId?: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
    pendingOvertimeCount: number;
  };
}

const NOTIF_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  SHIFT_30MIN:        { icon: Clock,          color: 'text-amber-600',  bg: 'bg-amber-50' },
  SHIFT_10MIN:        { icon: Clock,          color: 'text-orange-600', bg: 'bg-orange-50' },
  SHIFT_COMPLETE:     { icon: CheckCircle2,   color: 'text-green-600',  bg: 'bg-green-50' },
  OVERTIME_REQUEST:   { icon: AlertTriangle,  color: 'text-amber-600',  bg: 'bg-amber-50' },
  OVERTIME_APPROVED:  { icon: CheckCircle2,   color: 'text-green-600',  bg: 'bg-green-50' },
  OVERTIME_REJECTED:  { icon: XCircle,        color: 'text-red-600',    bg: 'bg-red-50' },
  AUTO_SIGNED_OUT:    { icon: XCircle,        color: 'text-red-600',    bg: 'bg-red-50' },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const data: NotificationsResponse = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch {}
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark all as read when dropdown opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      }).then(() => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }).catch(() => {});
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOvertimeAction = async (notif: Notification, approved: boolean) => {
    if (!notif.attendanceId) return;
    setLoadingAction(notif._id);
    try {
      const res = await fetch('/api/attendance/overtime-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId: notif.attendanceId,
          approved,
        }),
      });
      if (res.ok) {
        // Mark notification as action taken
        setNotifications(prev =>
          prev.map(n => n._id === notif._id ? { ...n, actionTaken: true } : n)
        );
        await fetchNotifications();
      }
    } catch {}
    setLoadingAction(null);
  };

  const handleDelete = async (notifId: string) => {
    try {
      await fetch(`/api/notifications?id=${notifId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== notifId));
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C49426] text-white text-[9px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-10 w-[360px] bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EDE6]">
              <h3 className="text-[13px] font-semibold text-[#1C1C1A]">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={() => {
                      fetch('/api/notifications', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ markAllRead: true }),
                      }).then(() => {
                        setUnreadCount(0);
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      });
                    }}
                    className="text-[11px] text-[#C49426] font-medium hover:text-[#B48820] flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-[#F5F3EE]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-8 h-8 text-[#C2C0BB] mx-auto mb-2" />
                  <p className="text-[13px] text-[#9A9890]">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const iconConfig = NOTIF_ICONS[notif.type] || NOTIF_ICONS.SHIFT_30MIN;
                  const IconComponent = iconConfig.icon;
                  const isOvertimeRequest = notif.type === 'OVERTIME_REQUEST';

                  return (
                    <div
                      key={notif._id}
                      className={cn(
                        "px-4 py-3 hover:bg-[#FAFAF8] transition-colors relative group",
                        !notif.read && "bg-[#FBF5E6]/40"
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                          iconConfig.bg
                        )}>
                          <IconComponent className={cn("w-4 h-4", iconConfig.color)} strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-semibold text-[#1C1C1A] leading-tight">
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#C49426] flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-[12px] text-[#6B6965] mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[11px] text-[#B0AEA9] mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>

                          {/* Overtime approve/reject buttons */}
                          {isOvertimeRequest && !notif.actionTaken && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleOvertimeAction(notif, true)}
                                disabled={loadingAction === notif._id}
                                className="flex-1 h-7 rounded-lg bg-green-50 text-green-700 text-[11px] font-semibold border border-green-100 hover:bg-green-100 transition-colors disabled:opacity-50"
                              >
                                {loadingAction === notif._id ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleOvertimeAction(notif, false)}
                                disabled={loadingAction === notif._id}
                                className="flex-1 h-7 rounded-lg bg-red-50 text-red-600 text-[11px] font-semibold border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {loadingAction === notif._id ? '...' : 'Reject'}
                              </button>
                            </div>
                          )}

                          {isOvertimeRequest && notif.actionTaken && (
                            <p className="text-[11px] text-[#9A9890] mt-1 italic">Action taken</p>
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(notif._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#C2C0BB] hover:text-[#6B6965] flex-shrink-0 mt-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-[#F0EDE6] text-center">
                <p className="text-[11px] text-[#B0AEA9]">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}