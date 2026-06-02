import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { generateQRToken, generateQRCodeImage } from '@/lib/qr';
import QRSession from '@/lib/models/QRSession';
import { ApiResponse } from '@/types';

export async function GET() {
  try {
    const auth = await getAuthFromCookies();

    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    // Generate new QR token
    const tokenData = generateQRToken(auth.employeeId);
    
    // Generate QR code image
    const qrImage = await generateQRCodeImage(tokenData);

    // Store QR session in database
    await QRSession.create({
      employeeId: auth.userId,
      token: tokenData.nonce,
      expiresAt: new Date(tokenData.expiresAt),
    });

    return NextResponse.json<ApiResponse<{
      qrImage: string;
      expiresAt: number;
      tokenData: typeof tokenData;
    }>>(
      {
        success: true,
        data: {
          qrImage,
          expiresAt: tokenData.expiresAt,
          tokenData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
