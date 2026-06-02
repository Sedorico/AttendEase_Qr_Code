'use client';

import { motion, type Variants } from 'framer-motion';
import { AttendanceHistory } from '@/components/employee/attendance-history';
import { History, Calendar, TrendingUp } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: i * 0.08,
    },
  }),
};

export default function HistoryPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F5F3EE' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .corp-card {
          background: #FFFFFF;
          border: 1px solid #E5E2DB;
          border-radius: 18px;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease;
          transform-style: preserve-3d;
        }
        .corp-card:hover {
          transform: translateY(-4px) rotateX(1.2deg) rotateY(0.6deg);
          box-shadow: 0 24px 64px rgba(0,0,0,0.09), 0 8px 24px rgba(196,148,38,0.10);
        }
      `}</style>

      <div className="container mx-auto px-4 py-7 md:py-10" style={{ maxWidth: '860px' }}>

        {/* Header */}
        <motion.div
          variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="mb-8 flex items-center gap-4"
        >
          <div
            className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(196,148,38,0.12)' }}
          >
            <History className="w-[22px] h-[22px]" style={{ color: '#C49426' }} strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-[26px] md:text-[30px] leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, color: '#1C1C1A' }}
            >
              Attendance History
            </h1>
            <p className="text-[13px] mt-[2px]" style={{ color: '#9A9890' }}>
              View your complete attendance records and statistics
            </p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {/* This Month */}
          <div className="corp-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(22,163,74,0.10)' }}
              >
                <Calendar className="w-[15px] h-[15px]" style={{ color: '#16A34A' }} strokeWidth={2} />
              </div>
              <span className="text-[12px] font-[600]" style={{ color: '#9A9890' }}>This Month</span>
            </div>
            <p
              className="text-[32px] leading-none font-[700]"
              style={{ color: '#1C1C1A', fontFamily: "'Playfair Display', serif" }}
            >
              --
            </p>
            <p className="text-[11px] mt-1" style={{ color: '#B0AEA9' }}>Days Present</p>
          </div>

          {/* Attendance Rate */}
          <div className="corp-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(196,148,38,0.12)' }}
              >
                <TrendingUp className="w-[15px] h-[15px]" style={{ color: '#C49426' }} strokeWidth={2} />
              </div>
              <span className="text-[12px] font-[600]" style={{ color: '#9A9890' }}>Attendance Rate</span>
            </div>
            <p
              className="text-[32px] leading-none font-[700]"
              style={{ color: '#1C1C1A', fontFamily: "'Playfair Display', serif" }}
            >
              --%
            </p>
            <p className="text-[11px] mt-1" style={{ color: '#B0AEA9' }}>Overall Rate</p>
          </div>
        </motion.div>

        {/* History Component */}
        <motion.div
          variants={fadeUp} custom={2} initial="hidden" animate="show"
        >
          <AttendanceHistory />
        </motion.div>

      </div>
    </div>
  );
}
