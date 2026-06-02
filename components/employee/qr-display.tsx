'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QR_REFRESH_INTERVAL } from '@/lib/constants';
import { Loader2, RefreshCw, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRCodeDisplayProps {
  className?: string;
}

export function QRCodeDisplay({ className }: QRCodeDisplayProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/qr/generate');
      const data = await response.json();
      if (data.success && data.data) {
        setQrImage(data.data.qrImage);
        setExpiresAt(data.data.expiresAt);
      } else {
        setError(data.error || 'Failed to generate QR code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    generateQR();
    const interval = setInterval(generateQR, QR_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [generateQR]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (expiresAt) {
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const progress = timeLeft / 30;

  // Box is 192px total. SVG overlaid on top, stroked 3px inside the border.
  // Perimeter of the rounded rect at inset 3px:
  // width = height = 192 - 6 = 186, corner r = 14 - 3 = 11
  // perimeter ≈ 2*(186-2*11) + 2*(186-2*11) + 2*π*11 ≈ 4*(164) + 69.1 ≈ 725
  const BOX = 192;
  const INSET = 3;
  const W = BOX - INSET * 2;
  const RX = 11;
  const straight = 2 * (W - 2 * RX);
  const corners = 2 * Math.PI * RX;
  const perimeter = straight * 2 + corners; // ~725

  const ringColor =
    timeLeft <= 5 ? '#DC2626' : timeLeft <= 10 ? '#CA8A04' : '#C49426';

  const dashOffset = perimeter * (1 - progress);

  return (
    <div className={cn('flex flex-col items-center', className)}>

      {/* QR box + edge ring */}
      <div className="relative" style={{ width: BOX, height: BOX }}>

        {/* QR content */}
        <div
          className="absolute inset-0 rounded-[14px] overflow-hidden"
          style={{ background: '#FFFFFF', padding: '12px' }}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center gap-3"
              >
                <Loader2 className="w-9 h-9 animate-spin" style={{ color: '#C49426' }} strokeWidth={2} />
                <span className="text-[12px]" style={{ color: '#9A9890' }}>Generating secure QR…</span>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center gap-3 px-4 text-center"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <Shield className="w-5 h-5 text-red-500" strokeWidth={2} />
                </div>
                <p className="text-[12px] text-red-500">{error}</p>
                <button onClick={generateQR}
                  className="flex items-center gap-1.5 text-[12px] font-medium"
                  style={{ color: '#C49426' }}>
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
                  Retry
                </button>
              </motion.div>
            ) : qrImage ? (
              <motion.div
                key="qr"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                className="relative w-full h-full"
              >
                <img
                  src={qrImage}
                  alt="Your QR Code"
                  className="w-full h-full block rounded-[4px]"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Scan line */}
                <div className="absolute inset-0 overflow-hidden rounded-[4px] pointer-events-none">
                  <div
                    className="absolute left-0 right-0 h-[2px]"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(196,148,38,0.5), transparent)',
                      animation: 'scanLine 2s linear infinite',
                    }}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Progress ring SVG — overlaid perfectly on the box edge */}
        <svg
          width={BOX}
          height={BOX}
          viewBox={`0 0 ${BOX} ${BOX}`}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track — faint border */}
          <rect
            x={INSET} y={INSET}
            width={W} height={W}
            rx={RX} ry={RX}
            fill="none"
            stroke="#E5E2DB"
            strokeWidth="1.5"
          />
          {/* Animated progress stroke */}
          <rect
            x={INSET} y={INSET}
            width={W} height={W}
            rx={RX} ry={RX}
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={perimeter}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease',
            }}
          />
        </svg>
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 0 }
          50%  { top: calc(100% - 2px) }
          100% { top: 0 }
        }
      `}</style>

      {/* Timer pill */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full border"
        style={{ background: '#FAFAF8', borderColor: '#E5E2DB' }}
      >
        <Clock className="w-[13px] h-[13px]" style={{ color: '#9A9890' }} strokeWidth={2} />
        <span className="text-[12px]" style={{ color: '#9A9890' }}>Refreshes in</span>
        <span
          className="text-[13px] font-[700] tabular-nums"
          style={{ color: ringColor, transition: 'color 0.3s' }}
        >
          {timeLeft}s
        </span>
      </motion.div>

      {/* Security badge */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="mt-3 flex items-center gap-1.5 text-[11px]"
        style={{ color: '#B0AEA9' }}
      >
        <Shield className="w-3 h-3" strokeWidth={2} />
        <span>Cryptographically signed · One-time use</span>
      </motion.div>
    </div>
  );
}
