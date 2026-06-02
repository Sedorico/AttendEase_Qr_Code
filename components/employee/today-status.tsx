'use client';

import { motion } from 'framer-motion';
import { LogIn, LogOut, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TodayStatus() {
  const { data, isLoading } = useSWR('/api/attendance/today', fetcher, {
    refreshInterval: 30000,
  });

  const timeIn  = data?.data?.timeIn;
  const timeOut = data?.data?.timeOut;

  return (
    <div className="corp-card"
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
      <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: '#F0EDE6' }}>
        <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(196,148,38,0.12)' }}>
          <Calendar className="w-[16px] h-[16px]" style={{ color: '#C49426' }} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[14px] font-[600] text-[#1C1C1A]">Today's Status</p>
          <p className="text-[11px] text-[#9A9890]">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Time cards */}
      <div className="p-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="h-[88px] rounded-[12px] animate-pulse" style={{ background: '#F5F3EE' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <TimeCard type="in"  timestamp={timeIn?.timestamp}  icon={LogIn}  />
            <TimeCard type="out" timestamp={timeOut?.timestamp} icon={LogOut} />
          </div>
        )}
      </div>
    </div>
  );
}

interface TimeCardProps {
  type: 'in' | 'out';
  timestamp?: string;
  icon: typeof LogIn;
}

function TimeCard({ type, timestamp, icon: Icon }: TimeCardProps) {
  const done  = !!timestamp;
  const label = type === 'in' ? 'Time In' : 'Time Out';

  return (
    <div
      className="rounded-[12px] p-4 border transition-all duration-200"
      style={{
        background: done ? 'rgba(34,197,94,0.04)' : '#FAFAF8',
        borderColor: done ? 'rgba(34,197,94,0.18)' : '#F0EDE6',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[11px] font-[600]" style={{ color: '#9A9890' }}>
          <Icon className="w-[13px] h-[13px]" strokeWidth={2}
            style={{ stroke: done ? '#16A34A' : '#9A9890' }} />
          {label}
        </div>
        {done
          ? <CheckCircle2 className="w-[16px] h-[16px]" style={{ color: '#16A34A' }} strokeWidth={2} />
          : <XCircle className="w-[16px] h-[16px]" style={{ color: '#C2C0BB' }} strokeWidth={2} />
        }
      </div>

      {done ? (
        <div className="flex items-baseline gap-1">
          <span className="text-[22px] font-[600] tracking-[-0.03em]" style={{ color: '#1C1C1A' }}>
            {format(new Date(timestamp!), 'h:mm')}
          </span>
          <span className="text-[12px]" style={{ color: '#9A9890' }}>
            {format(new Date(timestamp!), 'a')}
          </span>
        </div>
      ) : (
        <span className="text-[18px] font-[400]" style={{ color: '#C2C0BB' }}>--:--</span>
      )}
    </div>
  );
}
