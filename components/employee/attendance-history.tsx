'use client';

import { motion } from 'framer-motion';
import { History, Clock, Calendar, CheckCircle2, AlertCircle, XCircle, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import { AttendanceRecord } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const statusConfig = {
  present: {
    icon: CheckCircle2,
    color: '#16A34A',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.15)',
    label: 'Present',
    pillBg: 'rgba(34,197,94,0.08)',
    pillBorder: 'rgba(34,197,94,0.15)',
    numColor: '#16A34A',
    lblColor: 'rgba(22,163,74,0.7)',
  },
  late: {
    icon: AlertCircle,
    color: '#CA8A04',
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.15)',
    label: 'Late',
    pillBg: 'rgba(234,179,8,0.08)',
    pillBorder: 'rgba(234,179,8,0.15)',
    numColor: '#CA8A04',
    lblColor: 'rgba(202,138,4,0.7)',
  },
  absent: {
    icon: XCircle,
    color: '#DC2626',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.15)',
    label: 'Absent',
    pillBg: 'rgba(239,68,68,0.08)',
    pillBorder: 'rgba(239,68,68,0.15)',
    numColor: '#DC2626',
    lblColor: 'rgba(220,38,38,0.7)',
  },
  'half-day': {
    icon: MinusCircle,
    color: '#C49426',
    bg: 'rgba(196,148,38,0.08)',
    border: 'rgba(196,148,38,0.15)',
    label: 'Half',
    pillBg: 'rgba(196,148,38,0.08)',
    pillBorder: 'rgba(196,148,38,0.15)',
    numColor: '#C49426',
    lblColor: 'rgba(196,148,38,0.7)',
  },
};

export function AttendanceHistory() {
  const { data, isLoading } = useSWR('/api/attendance/history', fetcher);
  const history: AttendanceRecord[] = data?.data?.history || [];
  const summary = data?.data?.summary;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E2DB',
        borderRadius: '18px',
        overflow: 'hidden',
        transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px) rotateX(1.2deg) rotateY(0.6deg)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 24px 64px rgba(0,0,0,0.09),0 8px 24px rgba(196,148,38,0.10)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: '#F0EDE6' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(196,148,38,0.12)' }}>
            <History className="w-[16px] h-[16px]" style={{ color: '#C49426' }} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[14px] font-[600] text-[#1C1C1A]">Attendance History</p>
            <p className="text-[11px] text-[#9A9890]">{format(new Date(), 'MMMM yyyy')}</p>
          </div>
        </div>

        {/* Summary pills */}
        {summary && (
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { key: 'present',  val: summary.present  },
                { key: 'late',     val: summary.late     },
                { key: 'absent',   val: summary.absent   },
                { key: 'half-day', val: summary.halfDay  },
              ] as { key: keyof typeof statusConfig; val: number }[]
            ).map(({ key, val }) => {
              const c = statusConfig[key];
              return (
                <div key={key} className="rounded-[10px] py-2 text-center border"
                  style={{ background: c.pillBg, borderColor: c.pillBorder }}>
                  <p className="text-[19px] font-[700]" style={{ color: c.numColor }}>{val}</p>
                  <p className="text-[10px] font-[600] uppercase tracking-[0.04em] mt-[2px]"
                    style={{ color: c.lblColor }}>{c.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[56px] rounded-[10px] animate-pulse" style={{ background: '#F5F3EE' }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <Calendar className="w-10 h-10" style={{ color: '#C2C0BB' }} strokeWidth={1.5} />
            <p className="text-[13px]" style={{ color: '#9A9890' }}>No attendance records yet</p>
          </div>
        ) : (
          <div>
            {history.slice(0, 10).map((record, index) => (
              <HistoryItem key={record.date} record={record} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryItem({ record, index }: { record: AttendanceRecord; index: number }) {
  const config = statusConfig[record.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between px-6 py-3 border-b transition-colors duration-150 cursor-default"
      style={{ borderColor: '#F0EDE6' }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FAFAF8'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ''}
    >
      <div className="flex items-center gap-3">
        <div className="w-[32px] h-[32px] rounded-[9px] flex items-center justify-center flex-shrink-0"
          style={{ background: config.bg }}>
          <StatusIcon className="w-[14px] h-[14px]" style={{ color: config.color }} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-[600] text-[#1C1C1A]">
            {format(new Date(record.date), 'EEEE')}
          </p>
          <p className="text-[11px] text-[#9A9890]">
            {format(new Date(record.date), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px]" style={{ color: '#6B6965' }}>
        <Clock className="w-[12px] h-[12px]" style={{ color: '#B0AEA9' }} strokeWidth={2} />
        <span className="font-[500] text-[#1C1C1A]">{record.timeIn || '--:--'}</span>
        <span style={{ color: '#C2C0BB' }}>–</span>
        <span className="font-[500] text-[#1C1C1A]">{record.timeOut || '--:--'}</span>
      </div>
    </motion.div>
  );
}
