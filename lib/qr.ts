import crypto from 'crypto';
import QRCode from 'qrcode';
import { QR_EXPIRY_SECONDS } from './constants';

const QR_SECRET = process.env.QR_SECRET || 'your-qr-secret-key-change-in-production';

export interface QRTokenData {
  employeeId: string;
  timestamp: number;
  expiresAt: number;
  nonce: string;
  signature: string;
}

// Generate HMAC signature for QR token
function generateSignature(data: Omit<QRTokenData, 'signature'>): string {
  const payload = `${data.employeeId}:${data.timestamp}:${data.expiresAt}:${data.nonce}`;
  return crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
}

// Generate a new QR token
export function generateQRToken(employeeId: string): QRTokenData {
  const timestamp = Date.now();
  const expiresAt = timestamp + QR_EXPIRY_SECONDS * 1000;
  const nonce = crypto.randomBytes(16).toString('hex');

  const dataWithoutSignature = {
    employeeId,
    timestamp,
    expiresAt,
    nonce,
  };

  const signature = generateSignature(dataWithoutSignature);

  return {
    ...dataWithoutSignature,
    signature,
  };
}

// Validate QR token
export function validateQRToken(tokenData: QRTokenData): {
  valid: boolean;
  error?: string;
  employeeId?: string;
} {
  // Check if token has expired
  if (Date.now() > tokenData.expiresAt) {
    return { valid: false, error: 'QR code has expired' };
  }

  // Verify signature
  const expectedSignature = generateSignature({
    employeeId: tokenData.employeeId,
    timestamp: tokenData.timestamp,
    expiresAt: tokenData.expiresAt,
    nonce: tokenData.nonce,
  });

  if (tokenData.signature !== expectedSignature) {
    return { valid: false, error: 'Invalid QR code signature' };
  }

  return { valid: true, employeeId: tokenData.employeeId };
}

// Parse QR token from string
export function parseQRToken(tokenString: string): QRTokenData | null {
  try {
    return JSON.parse(tokenString) as QRTokenData;
  } catch {
    return null;
  }
}

// Generate QR code image as data URL
export async function generateQRCodeImage(data: QRTokenData): Promise<string> {
  const tokenString = JSON.stringify(data);
  
  const qrCodeDataUrl = await QRCode.toDataURL(tokenString, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return qrCodeDataUrl;
}

// Check if QR was recently used (replay attack prevention)
const usedTokens = new Map<string, number>();
const TOKEN_REUSE_WINDOW = 60000; // 1 minute

export function checkAndMarkTokenUsed(tokenData: QRTokenData): boolean {
  const tokenKey = `${tokenData.employeeId}:${tokenData.nonce}`;
  const lastUsed = usedTokens.get(tokenKey);

  if (lastUsed && Date.now() - lastUsed < TOKEN_REUSE_WINDOW) {
    return false; // Token was recently used
  }

  usedTokens.set(tokenKey, Date.now());

  // Cleanup old entries periodically
  if (usedTokens.size > 1000) {
    const now = Date.now();
    for (const [key, time] of usedTokens.entries()) {
      if (now - time > TOKEN_REUSE_WINDOW) {
        usedTokens.delete(key);
      }
    }
  }

  return true;
}
