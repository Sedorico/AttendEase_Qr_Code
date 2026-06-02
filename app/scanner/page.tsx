'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScanResult {
  success: boolean;
  employee?: {
    name: string;
    employeeId: string;
    department: string;
    position: string;
  };
  type?: 'TIME_IN' | 'TIME_OUT';
  timestamp?: string;
  isLate?: boolean;
  error?: string;
}

export default function ScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScanRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const playSound = useCallback(
    (type: 'success' | 'error') => {
      if (!soundEnabled) return;
      const audio = new Audio(
        type === 'success'
          ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2IkI+Nh4aBhICEh4yRlZeWlJGNiYWBgICAg4eKjo+QjoyJhoSCgYGChYiLjY+PjoyKh4WDgoGBgoWHio2PkJCOjImGhIKBgYKEh4qNj5CQjo2KhoSDgoGChIeKjI6QkI6MiYaEgoGBgoSHioyOkJCOjImHhYOBgYKEh4qMjo+Pjo2Kh4WDgoGBgoSHioyOj4+OjYqHhYOCgYGChIeKjI6Pj46NioeFg4KBgYKEh4qMjo+Pjo2Kh4WDgoGBgoSHioyOj4+OjYqHhYOCgYGChIeKjI6Pj46NioeFg4KBgQ=='
          : 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTtvAAAAAGBmfH2DhoiIiIeGhYOBgH9/f4CChIaIiYmIh4WDgX9+fn+Ag4WHiYqKiYeGhIJ/fn5/gIOGiImKiomHhYOBf35+f4CDhoiKi4qJh4WDgX9+fn+Ag4aIiouKiYeFg4F/fn5/gIOGiIqLiomHhYOBf35+f4CDhoiKi4qJh4WDgX9+fn+Ag4aIiouKiYeFg4F/fn5/gIOGiIqLiomHhYOBf35+f4CDhoiKi4qJh4WDgX9+fn+Ag4aIiouKiYeFg4F/fn5/gIOGiIqLiomHhYOBf35+fw=='
      );
      audio.play().catch(() => {});
    },
    [soundEnabled]
  );

  const processQRCode = useCallback(
    async (qrData: string) => {
      const now = Date.now();
      if (now - lastScanRef.current < 3000) return;
      lastScanRef.current = now;
      setIsProcessing(true);
      try {
        const response = await fetch('/api/qr/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrData, deviceInfo: 'Scanner Kiosk' }),
        });
        const data = await response.json();
        const result: ScanResult = {
          success: data.success,
          employee: data.data?.employee,
          type: data.data?.type,
          timestamp: data.data?.timestamp,
          isLate: data.data?.isLate,
          error: data.error,
        };
        setScanResult(result);
        playSound(result.success ? 'success' : 'error');
        if (result.success) setRecentScans((prev) => [result, ...prev].slice(0, 5));
        setTimeout(() => setScanResult(null), 5000);
      } catch {
        const result: ScanResult = { success: false, error: 'Network error. Please try again.' };
        setScanResult(result);
        playSound('error');
      } finally {
        setIsProcessing(false);
      }
    },
    [playSound]
  );

  const startScanner = useCallback(async () => {
    if (scannerRef.current) {
      const state = scannerRef.current.getState();
      if (state === Html5QrcodeScannerState.SCANNING) return;
    }
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10 },
        (decodedText) => processQRCode(decodedText),
        () => {}
      );
      setIsScanning(true);
    } catch (error) {
      console.error('Scanner error:', error);
    }
  }, [processQRCode]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current = null; } catch {}
    }
    setIsScanning(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  useEffect(() => { return () => { stopScanner(); }; }, [stopScanner]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');

        /* ── QR reader overrides ── */
        #qr-reader {
          width: 100% !important; height: 100% !important;
          border: none !important; padding: 0 !important;
          background: transparent !important;
        }
        #qr-reader * { border: none !important; box-shadow: none !important; }
        #qr-reader video {
          width: 100% !important; height: 100% !important;
          object-fit: cover !important; position: absolute !important;
          top: 0 !important; left: 0 !important;
        }
        #qr-reader img, #qr-reader canvas,
        #qr-reader__scan_region img,
        #qr-reader__scan_region canvas { display: none !important; }
        #qr-reader__scan_region {
          width: 100% !important; height: 100% !important;
          position: relative !important; background: transparent !important;
        }
        #qr-reader__dashboard { display: none !important; }
        #qr-reader__scan_region > div { display: none !important; }

        /* ── Root ── */
        .kiosk-root {
          min-height: 100vh;
          background: #F5F3EE;
          font-family: 'Outfit', sans-serif;
          color: #1C1C1A;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Top gold accent line */
        .kiosk-root::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #C49426 30%, #C49426 70%, transparent);
          z-index: 100;
        }

        /* Subtle warm texture overlay */
        .kiosk-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 50% at 40% 50%, rgba(196,148,38,0.04) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Header ── */
        .kiosk-header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          background: #FFFFFF;
          border-bottom: 1px solid #E5E2DB;
          box-shadow: 0 1px 12px rgba(0,0,0,0.04);
        }

        .kiosk-logo-wrap {
          display: flex; align-items: center; gap: 14px;
        }

        .kiosk-logo-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: #C49426;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(196,148,38,0.30);
          flex-shrink: 0;
        }

        .kiosk-brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 21px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: #1C1C1A;
          line-height: 1;
        }

        .kiosk-brand-sub {
          font-size: 10px;
          font-weight: 500;
          color: #9A9890;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          margin-top: 3px;
        }

        /* ── Clock ── */
        .kiosk-time {
          font-family: 'DM Mono', monospace;
          font-size: 32px;
          font-weight: 500;
          color: #1C1C1A;
          letter-spacing: 0.03em;
          line-height: 1;
          text-align: right;
        }

        .kiosk-time-colon { color: #C49426; }

        .kiosk-date {
          font-size: 11px;
          color: #9A9890;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 4px;
          text-align: right;
        }

        /* ── Control buttons ── */
        .kiosk-ctrl-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1px solid #E5E2DB;
          background: #FAFAF8;
          color: #9A9890;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .kiosk-ctrl-btn:hover {
          background: rgba(196,148,38,0.08);
          border-color: rgba(196,148,38,0.35);
          color: #C49426;
        }
        .kiosk-ctrl-btn.active {
          background: rgba(196,148,38,0.10);
          border-color: rgba(196,148,38,0.3);
          color: #C49426;
        }

        /* ── Main layout ── */
        .kiosk-main {
          position: relative; z-index: 1;
          flex: 1; display: flex;
        }

        /* ── Scanner zone ── */
        .scanner-zone {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px; gap: 24px;
        }

        .scanner-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #C49426;
          display: flex; align-items: center; gap: 10px;
        }
        .scanner-eyebrow::before,
        .scanner-eyebrow::after {
          content: '';
          width: 36px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(196,148,38,0.45));
        }
        .scanner-eyebrow::after {
          background: linear-gradient(90deg, rgba(196,148,38,0.45), transparent);
        }

        /* ── Camera frame ── */
        .cam-frame-outer {
          position: relative;
          width: 380px; height: 380px;
        }

        /* outer decorative ring */
        .cam-ring {
          position: absolute;
          inset: -7px;
          border-radius: 26px;
          border: 1px solid #E5E2DB;
        }

        /* pulsing ring — uses the warm border color */
        .cam-ring-pulse {
          position: absolute;
          inset: -7px;
          border-radius: 26px;
          border: 1px solid transparent;
          animation: ringPulse 3s ease-in-out infinite;
        }
        @keyframes ringPulse {
          0%, 100% { border-color: transparent; transform: scale(1); }
          50% { border-color: rgba(196,148,38,0.3); transform: scale(1.012); }
        }

        .cam-frame {
          position: relative;
          width: 380px; height: 380px;
          border-radius: 20px;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid #E5E2DB;
          box-shadow: 0 8px 40px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04);
        }

        /* Idle state */
        .cam-idle {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 14px; z-index: 10;
          background: #FAFAF8;
        }
        .cam-idle-icon {
          width: 68px; height: 68px;
          border-radius: 18px;
          background: rgba(196,148,38,0.07);
          border: 1px solid rgba(196,148,38,0.18);
          display: flex; align-items: center; justify-content: center;
          color: rgba(196,148,38,0.55);
        }
        .cam-idle-text {
          font-size: 13px; color: #9A9890; letter-spacing: 0.02em;
        }

        /* Corner brackets */
        .bracket {
          position: absolute;
          width: 22px; height: 22px;
          z-index: 20; pointer-events: none;
        }
        .bracket-tl { top: 10px; left: 10px; border-top: 2.5px solid #C49426; border-left: 2.5px solid #C49426; border-radius: 3px 0 0 0; }
        .bracket-tr { top: 10px; right: 10px; border-top: 2.5px solid #C49426; border-right: 2.5px solid #C49426; border-radius: 0 3px 0 0; }
        .bracket-bl { bottom: 10px; left: 10px; border-bottom: 2.5px solid #C49426; border-left: 2.5px solid #C49426; border-radius: 0 0 0 3px; }
        .bracket-br { bottom: 10px; right: 10px; border-bottom: 2.5px solid #C49426; border-right: 2.5px solid #C49426; border-radius: 0 0 3px 0; }

        /* Scan line */
        .scan-line-wrap {
          position: absolute; inset: 0;
          overflow: hidden; pointer-events: none; z-index: 15;
        }
        .scan-line {
          position: absolute;
          left: 12px; right: 12px; height: 2px;
          background: linear-gradient(90deg, transparent 0%, #C49426 20%, rgba(196,148,38,0.85) 50%, #C49426 80%, transparent 100%);
          box-shadow: 0 0 10px rgba(196,148,38,0.45), 0 0 20px rgba(196,148,38,0.2);
          animation: scanMove 2.4s ease-in-out infinite;
        }
        @keyframes scanMove {
          0%   { top: 12px; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: calc(100% - 12px); opacity: 0; }
        }

        /* Processing overlay */
        .cam-processing {
          position: absolute; inset: 0;
          background: rgba(245,243,238,0.88);
          backdrop-filter: blur(4px);
          border-radius: 20px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 14px; z-index: 30;
        }
        .processing-spinner {
          width: 48px; height: 48px;
          border-radius: 50%;
          border: 2px solid #E5E2DB;
          border-top-color: #C49426;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .processing-text {
          font-size: 11px; letter-spacing: 0.1em;
          text-transform: uppercase; color: #C49426;
        }

        /* CTA buttons */
        .btn-start {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 30px; border-radius: 14px;
          background: #C49426;
          color: #FFFFFF;
          font-size: 14px; font-weight: 600; letter-spacing: 0.03em;
          cursor: pointer; border: none;
          transition: all 0.22s ease;
          box-shadow: 0 4px 20px rgba(196,148,38,0.35);
        }
        .btn-start:hover {
          background: #B48820;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(196,148,38,0.45);
        }
        .btn-start:active { transform: translateY(0); background: #A47C1A; }

        .btn-stop {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 30px; border-radius: 14px;
          background: #FFFFFF;
          color: #C0392B;
          font-size: 14px; font-weight: 600; letter-spacing: 0.03em;
          cursor: pointer;
          border: 1px solid rgba(192,57,43,0.2);
          transition: all 0.22s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .btn-stop:hover {
          background: rgba(192,57,43,0.05);
          border-color: rgba(192,57,43,0.35);
        }

        .scan-hint {
          font-size: 12px; color: #B0AEA9;
          letter-spacing: 0.02em; text-align: center;
          max-width: 310px; line-height: 1.6;
        }

        /* ══════════════════════════
           RIGHT PANEL
        ══════════════════════════ */
        .result-panel {
          width: 356px; flex-shrink: 0;
          background: #FFFFFF;
          border-left: 1px solid #E5E2DB;
          display: flex; flex-direction: column;
          padding: 26px 22px;
          overflow-y: auto;
        }

        .panel-section-title {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #C49426;
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .panel-section-title::after {
          content: ''; flex: 1; height: 1px;
          background: #F0EDE6;
        }

        /* Waiting */
        .result-waiting {
          border: 1px dashed #E5E2DB;
          border-radius: 16px;
          padding: 30px 20px;
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          background: #FAFAF8;
        }
        .waiting-icon {
          width: 50px; height: 50px;
          border-radius: 13px;
          background: rgba(196,148,38,0.07);
          border: 1px solid rgba(196,148,38,0.16);
          display: flex; align-items: center; justify-content: center;
          color: rgba(196,148,38,0.45);
        }
        .waiting-text { font-size: 13px; color: #B0AEA9; letter-spacing: 0.03em; }

        /* Success */
        .result-success {
          border: 1px solid rgba(196,148,38,0.3);
          border-radius: 16px;
          background: rgba(196,148,38,0.03);
          overflow: hidden;
        }
        .result-success-header {
          padding: 14px 18px;
          background: rgba(196,148,38,0.07);
          border-bottom: 1px solid rgba(196,148,38,0.12);
          display: flex; align-items: center; gap: 10px;
        }
        .success-icon-wrap {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(196,148,38,0.15);
          border: 1px solid rgba(196,148,38,0.3);
          display: flex; align-items: center; justify-content: center;
          color: #C49426; flex-shrink: 0;
        }

        .type-badge {
          display: inline-flex; align-items: center;
          padding: 3px 11px; border-radius: 20px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.09em; text-transform: uppercase;
        }
        .type-badge-in {
          background: rgba(30,155,80,0.1);
          color: #1A8A4A;
          border: 1px solid rgba(30,155,80,0.2);
        }
        .type-badge-out {
          background: rgba(196,148,38,0.12);
          color: #A47C1A;
          border: 1px solid rgba(196,148,38,0.25);
        }
        .type-badge-late {
          background: rgba(200,100,30,0.1);
          color: #C06418;
          border: 1px solid rgba(200,100,30,0.2);
          margin-left: 5px;
        }

        .result-success-body {
          padding: 16px 18px;
          display: flex; flex-direction: column; gap: 12px;
        }

        .emp-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 23px; font-weight: 500;
          color: #1C1C1A; line-height: 1.1;
        }
        .emp-id {
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: #9A9890;
          letter-spacing: 0.06em; margin-top: 2px;
        }

        .emp-meta-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px;
          background: #FAFAF8;
          border: 1px solid #F0EDE6;
          border-radius: 10px;
        }
        .emp-meta-icon { color: #B0AEA9; flex-shrink: 0; }
        .emp-meta-label { font-size: 10px; color: #9A9890; letter-spacing: 0.03em; }
        .emp-meta-value { font-size: 13px; color: #1C1C1A; font-weight: 500; }

        /* Error */
        .result-error {
          border: 1px solid rgba(192,57,43,0.2);
          border-radius: 16px;
          background: rgba(192,57,43,0.04);
          padding: 28px 18px;
          display: flex; flex-direction: column;
          align-items: center; gap: 10px; text-align: center;
        }
        .error-icon-wrap {
          width: 50px; height: 50px; border-radius: 50%;
          background: rgba(192,57,43,0.08);
          border: 1px solid rgba(192,57,43,0.18);
          display: flex; align-items: center; justify-content: center;
          color: #C0392B;
        }
        .error-title { font-size: 15px; font-weight: 600; color: #C0392B; }
        .error-msg { font-size: 12px; color: #9A9890; line-height: 1.5; }

        /* Late banner */
        .late-banner {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px;
          background: rgba(200,100,30,0.07);
          border: 1px solid rgba(200,100,30,0.18);
          border-radius: 10px; margin-top: 2px;
        }
        .late-banner-text { font-size: 12px; color: #C06418; letter-spacing: 0.02em; }

        /* Recent scans */
        .recent-section { margin-top: 26px; flex: 1; }

        .recent-item {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 11px; border-radius: 11px;
          background: #FAFAF8;
          border: 1px solid #F0EDE6;
          transition: background 0.18s;
          margin-bottom: 6px;
        }
        .recent-item:hover { background: rgba(196,148,38,0.05); border-color: rgba(196,148,38,0.18); }

        .recent-badge {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.05em; flex-shrink: 0;
        }
        .recent-badge-in {
          background: rgba(30,155,80,0.08);
          color: #1A8A4A;
          border: 1px solid rgba(30,155,80,0.18);
        }
        .recent-badge-out {
          background: rgba(196,148,38,0.1);
          color: #A47C1A;
          border: 1px solid rgba(196,148,38,0.2);
        }
        .recent-name {
          font-size: 13px; font-weight: 500;
          color: #1C1C1A; flex: 1;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .recent-time {
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: #9A9890; flex-shrink: 0;
        }
        .no-scans {
          text-align: center; font-size: 12px;
          color: #B0AEA9; padding: 18px 0; letter-spacing: 0.03em;
        }
      `}</style>

      <div className="kiosk-root">

        {/* HEADER */}
        <header className="kiosk-header">
          <div className="kiosk-logo-wrap">
            <div className="kiosk-logo-icon">
              <QrCode style={{ width: 20, height: 20, color: '#FFFFFF' }} strokeWidth={2.5} />
            </div>
            <div>
              <div className="kiosk-brand-name">AttendEase</div>
              <div className="kiosk-brand-sub">Office Kiosk Mode</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <div className="kiosk-time">
                {format(currentTime, 'HH')}
                <span className="kiosk-time-colon">:</span>
                {format(currentTime, 'mm')}
                <span className="kiosk-time-colon">:</span>
                {format(currentTime, 'ss')}
              </div>
              <div className="kiosk-date">{format(currentTime, 'EEEE, MMMM d, yyyy')}</div>
            </div>

            <div className="flex items-center gap-2 pl-4" style={{ borderLeft: '1px solid #E5E2DB' }}>
              <button
                className={cn('kiosk-ctrl-btn', soundEnabled && 'active')}
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label="Toggle sound"
              >
                {soundEnabled
                  ? <Volume2 style={{ width: 16, height: 16 }} />
                  : <VolumeX style={{ width: 16, height: 16 }} />}
              </button>
              <button className="kiosk-ctrl-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
                <Maximize style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="kiosk-main">

          {/* Scanner zone */}
          <div className="scanner-zone">
            <div className="scanner-eyebrow">QR Code Scanner</div>

            <div className="cam-frame-outer">
              <div className="cam-ring" />
              <div className="cam-ring-pulse" />

              <div className="cam-frame">
                <div id="qr-reader" style={{ position: 'absolute', inset: 0 }} />

                {!isScanning && (
                  <div className="cam-idle">
                    <div className="cam-idle-icon">
                      <Camera style={{ width: 30, height: 30 }} />
                    </div>
                    <div className="cam-idle-text">Click Start to begin scanning</div>
                  </div>
                )}

                {isScanning && (
                  <div className="scan-line-wrap">
                    <div className="scan-line" />
                  </div>
                )}

                <div className="bracket bracket-tl" />
                <div className="bracket bracket-tr" />
                <div className="bracket bracket-bl" />
                <div className="bracket bracket-br" />
              </div>

              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    className="cam-processing"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <div className="processing-spinner" />
                    <div className="processing-text">Validating…</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              {isScanning ? (
                <button className="btn-stop" onClick={stopScanner}>
                  <CameraOff style={{ width: 17, height: 17 }} />
                  Stop Scanner
                </button>
              ) : (
                <button className="btn-start" onClick={startScanner}>
                  <Camera style={{ width: 17, height: 17 }} />
                  Start Scanner
                </button>
              )}
            </div>

            <p className="scan-hint">
              Position your QR code within the frame — detection is automatic.
            </p>
          </div>

          {/* Result panel */}
          <aside className="result-panel">

            <div>
              <div className="panel-section-title">Scan Result</div>

              <AnimatePresence mode="wait">
                {scanResult ? (
                  scanResult.success ? (
                    <motion.div
                      key="success"
                      className="result-success"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="result-success-header">
                        <div className="success-icon-wrap">
                          <CheckCircle2 style={{ width: 17, height: 17 }} />
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={cn('type-badge', scanResult.type === 'TIME_IN' ? 'type-badge-in' : 'type-badge-out')}>
                            {scanResult.type === 'TIME_IN' ? 'Time In' : 'Time Out'}
                          </span>
                          {scanResult.isLate && <span className="type-badge type-badge-late">Late</span>}
                        </div>
                      </div>

                      <div className="result-success-body">
                        <div>
                          <div className="emp-name">{scanResult.employee?.name}</div>
                          <div className="emp-id">{scanResult.employee?.employeeId}</div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="emp-meta-row">
                            <Building2 className="emp-meta-icon" style={{ width: 14, height: 14 }} />
                            <div>
                              <div className="emp-meta-label">Department</div>
                              <div className="emp-meta-value">{scanResult.employee?.department}</div>
                            </div>
                          </div>
                          <div className="emp-meta-row">
                            <User className="emp-meta-icon" style={{ width: 14, height: 14 }} />
                            <div>
                              <div className="emp-meta-label">Position</div>
                              <div className="emp-meta-value">{scanResult.employee?.position}</div>
                            </div>
                          </div>
                          <div className="emp-meta-row">
                            <Clock className="emp-meta-icon" style={{ width: 14, height: 14 }} />
                            <div>
                              <div className="emp-meta-label">Timestamp</div>
                              <div className="emp-meta-value" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                                {scanResult.timestamp && format(new Date(scanResult.timestamp), 'h:mm:ss a')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {scanResult.isLate && (
                          <div className="late-banner">
                            <AlertTriangle style={{ width: 14, height: 14, color: '#C06418', flexShrink: 0 }} />
                            <span className="late-banner-text">Employee arrived late</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="error"
                      className="result-error"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="error-icon-wrap">
                        <XCircle style={{ width: 24, height: 24 }} />
                      </div>
                      <div className="error-title">Scan Failed</div>
                      <div className="error-msg">{scanResult.error}</div>
                    </motion.div>
                  )
                ) : (
                  <motion.div
                    key="waiting"
                    className="result-waiting"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <div className="waiting-icon">
                      <QrCode style={{ width: 24, height: 24 }} />
                    </div>
                    <div className="waiting-text">Waiting for scan…</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="recent-section">
              <div className="panel-section-title">Recent Scans</div>

              {recentScans.length === 0 ? (
                <div className="no-scans">No recent scans</div>
              ) : (
                recentScans.map((scan, i) => (
                  <motion.div
                    key={`${scan.employee?.employeeId}-${scan.timestamp}`}
                    className="recent-item"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className={cn('recent-badge', scan.type === 'TIME_IN' ? 'recent-badge-in' : 'recent-badge-out')}>
                      {scan.type === 'TIME_IN' ? 'IN' : 'OUT'}
                    </div>
                    <div className="recent-name">{scan.employee?.name}</div>
                    <div className="recent-time">
                      {scan.timestamp && format(new Date(scan.timestamp), 'h:mm a')}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

          </aside>
        </main>
      </div>
    </>
  );
}
